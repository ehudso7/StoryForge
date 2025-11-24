/**
 * Iteration API Route
 * POST - Run iteration cycle with IterationManager
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { StripeService } from '@/services/stripe-service';
import { IterationManager } from '@/services/iteration-manager';
import { z } from 'zod';

// Validation schema for iteration request
const iterateSceneSchema = z.object({
  sceneId: z.string().cuid(),
  maxIterations: z.number().int().min(1).max(15).optional().default(5),
  maxStrategiesPerIteration: z.number().int().min(1).max(5).optional().default(3),
  runUntilTarget: z.boolean().optional().default(false),
});

/**
 * POST /api/generate/iterate
 * Run iterative improvement cycle on a scene
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = iterateSceneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { sceneId, maxIterations, maxStrategiesPerIteration, runUntilTarget } = validationResult.data;

    // Fetch scene with project info
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        project: {
          select: {
            userId: true,
            genre: true,
          },
        },
      },
    });

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (scene.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this scene' },
        { status: 403 }
      );
    }

    // Check if scene has content
    if (!scene.content || scene.content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Scene has no content',
          message: 'Cannot iterate on an empty scene',
        },
        { status: 400 }
      );
    }

    // Check usage limits
    const usageCheck = await StripeService.checkUsageLimits(session.user.id);
    if (!usageCheck.canGenerate) {
      return NextResponse.json(
        {
          error: 'Usage limit reached',
          reason: usageCheck.reason,
          usage: usageCheck.usage,
        },
        { status: 429 }
      );
    }

    // Initialize IterationManager
    const manager = new IterationManager(scene.content, scene.project.genre);

    // Run iterations
    let history;
    if (runUntilTarget) {
      // Run until target score or max iterations
      history = await manager.runUntilTarget(maxStrategiesPerIteration);
    } else {
      // Run fixed number of iterations
      for (let i = 0; i < maxIterations; i++) {
        const result = await manager.runIteration(maxStrategiesPerIteration);

        if (!result.shouldContinue) {
          break;
        }

        // Add delay between iterations for rate limiting
        if (i < maxIterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      history = manager.getHistory();
    }

    // Get final text and metrics
    const finalText = manager.getCurrentText();
    const summary = manager.getSummary();

    // Calculate word count and estimate tokens used
    const finalWordCount = finalText
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;

    // Estimate tokens: iterations * strategies * avg tokens per strategy
    const estimatedTokens = history.totalIterations * maxStrategiesPerIteration * 1500;

    // Track usage
    await StripeService.trackUsage({
      userId: session.user.id,
      tokens: estimatedTokens,
      words: finalWordCount,
    });

    // Save current version to history
    const currentVersion = {
      content: scene.content,
      wordCount: scene.wordCount,
      uwqesScore: scene.uwqesScore,
      timestamp: new Date().toISOString(),
    };

    // Update scene with final improved content
    const updatedScene = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        content: finalText,
        wordCount: finalWordCount,
        uwqesScore: summary.finalScore,
        versions: {
          push: currentVersion,
        },
        updatedAt: new Date(),
      },
    });

    // Update project word count if changed
    const wordCountDelta = finalWordCount - scene.wordCount;
    if (wordCountDelta !== 0) {
      await prisma.project.update({
        where: { id: scene.projectId },
        data: {
          wordCount: { increment: wordCountDelta },
          totalWordsWritten: { increment: Math.max(0, wordCountDelta) },
        },
      });
    }

    return NextResponse.json({
      scene: {
        id: updatedScene.id,
        content: updatedScene.content,
        wordCount: updatedScene.wordCount,
        uwqesScore: updatedScene.uwqesScore,
      },
      iteration: {
        initialScore: summary.initialScore,
        finalScore: summary.finalScore,
        totalImprovement: summary.totalImprovement,
        iterations: summary.iterations,
        targetReached: summary.targetReached,
        bestIteration: summary.bestIteration,
        lockedMetrics: summary.lockedMetrics,
      },
      history: {
        snapshots: history.snapshots.map(s => ({
          iteration: s.iteration,
          timestamp: s.timestamp,
          score: s.metrics.overallScore,
          strategies: s.strategies,
          improvements: s.improvements,
          locked: s.locked,
        })),
        bestEver: history.bestEver,
      },
      usage: {
        tokensUsed: estimatedTokens,
        wordsProcessed: finalWordCount,
      },
      message: summary.targetReached
        ? `Target score reached in ${summary.iterations} iteration(s)!`
        : `Completed ${summary.iterations} iteration(s). Score improved from ${summary.initialScore.toFixed(1)}% to ${summary.finalScore.toFixed(1)}%`,
    });
  } catch (error) {
    console.error('Error running iteration:', error);
    return NextResponse.json(
      {
        error: 'Failed to run iteration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

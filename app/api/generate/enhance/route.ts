/**
 * Scene Enhancement API Route
 * POST - Improve scene using ExcellenceEnforcer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { StripeService } from '@/services/stripe-service';
import { ExcellenceEnforcer } from '@/services/excellence-enforcer';
import { DraftEvaluator } from '@/services/draft-evaluator';
import { z } from 'zod';

// Validation schema for enhancement
const enhanceSceneSchema = z.object({
  sceneId: z.string().cuid(),
  maxStrategies: z.number().int().min(1).max(5).optional().default(3),
  targetMetric: z.string().optional(), // specific metric to target
});

/**
 * POST /api/generate/enhance
 * Enhance scene using Excellence Enforcer
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
    const validationResult = enhanceSceneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { sceneId, maxStrategies, targetMetric } = validationResult.data;

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
          message: 'Cannot enhance an empty scene',
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

    // Get initial metrics
    const initialMetrics = DraftEvaluator.evaluate(scene.content);

    // Apply enhancement
    let result;
    if (targetMetric) {
      // Target specific metric
      result = await ExcellenceEnforcer.targetMetric(
        scene.content,
        targetMetric,
        scene.project.genre
      );
    } else {
      // Apply multiple strategies
      const enforcementResult = await ExcellenceEnforcer.enforceExcellence(
        scene.content,
        scene.project.genre,
        maxStrategies
      );

      result = {
        strategy: `${enforcementResult.strategies.length} strategies`,
        originalText: scene.content,
        improvedText: enforcementResult.finalText,
        originalMetrics: initialMetrics,
        improvedMetrics: DraftEvaluator.evaluate(enforcementResult.finalText),
        improvement: {
          overallScoreDelta: enforcementResult.totalImprovement,
          glueWordsDelta: 0,
          showVsTellDelta: 0,
          dynamicContentDelta: 0,
          dialogueBalanceDelta: 0,
          aiPatternsDelta: 0,
        },
        success: true,
      };
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Enhancement failed',
          message: result.error || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Calculate word count and token estimate
    const newWordCount = result.improvedText
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;

    const estimatedTokens = Math.ceil(newWordCount * 1.3); // Rough estimate

    // Track usage
    await StripeService.trackUsage({
      userId: session.user.id,
      tokens: estimatedTokens,
      words: newWordCount,
    });

    // Save current version to history
    const currentVersion = {
      content: scene.content,
      wordCount: scene.wordCount,
      uwqesScore: scene.uwqesScore,
      timestamp: new Date().toISOString(),
    };

    // Update scene with improved content
    const updatedScene = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        content: result.improvedText,
        wordCount: newWordCount,
        uwqesScore: result.improvedMetrics.overallScore,
        versions: {
          push: currentVersion,
        },
        updatedAt: new Date(),
      },
    });

    // Update project word count if changed
    const wordCountDelta = newWordCount - scene.wordCount;
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
      enhancement: {
        strategy: result.strategy,
        originalScore: result.originalMetrics.overallScore,
        improvedScore: result.improvedMetrics.overallScore,
        scoreDelta: result.improvement.overallScoreDelta,
        metricsImproved: {
          glueWords: result.improvement.glueWordsDelta,
          showVsTell: result.improvement.showVsTellDelta,
          dynamicContent: result.improvement.dynamicContentDelta,
          dialogueBalance: result.improvement.dialogueBalanceDelta,
          aiPatterns: result.improvement.aiPatternsDelta,
        },
      },
      usage: {
        tokensUsed: estimatedTokens,
        wordsProcessed: newWordCount,
      },
      message: 'Scene enhanced successfully',
    });
  } catch (error) {
    console.error('Error enhancing scene:', error);
    return NextResponse.json(
      {
        error: 'Failed to enhance scene',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

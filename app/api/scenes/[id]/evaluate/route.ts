/**
 * Scene Evaluation API Route
 * POST - Evaluate scene using DraftEvaluator (U-WQES v2.0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DraftEvaluator } from '@/services/draft-evaluator';

/**
 * POST /api/scenes/[id]/evaluate
 * Evaluate scene quality using U-WQES v2.0
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch scene with project info
    const scene = await prisma.scene.findUnique({
      where: { id: params.id },
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
          message: 'Cannot evaluate an empty scene',
        },
        { status: 400 }
      );
    }

    // Evaluate using DraftEvaluator
    const metrics = DraftEvaluator.evaluate(scene.content);
    const suggestions = DraftEvaluator.generateSuggestions(metrics);

    // Update scene with evaluation score
    await prisma.scene.update({
      where: { id: params.id },
      data: {
        uwqesScore: metrics.overallScore,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      sceneId: scene.id,
      sceneTitle: scene.title,
      metrics: {
        overallScore: metrics.overallScore,
        glueWords: metrics.glueWords,
        passiveVoice: metrics.passiveVoice,
        dialogueBalance: metrics.dialogueBalance,
        showVsTell: metrics.showVsTell,
        wordRepetition: metrics.wordRepetition,
        dynamicContent: metrics.dynamicContent,
        reflectiveContent: metrics.reflectiveContent,
        aiPatternCount: metrics.aiPatternCount,
        aiPatterns: metrics.aiPatterns,
        coherenceIssues: metrics.coherenceIssues,
        coherencePenalty: metrics.coherencePenalty,
      },
      breakdown: metrics.breakdown,
      suggestions,
      analysis: {
        wordCount: scene.wordCount,
        passesStandard: metrics.overallScore >= 90,
        needsImprovement: metrics.overallScore < 90,
        criticalIssues: [
          ...(metrics.aiPatternCount > 0 ? [`${metrics.aiPatternCount} AI patterns detected`] : []),
          ...(metrics.showVsTell > 10 ? ['Excessive telling (should show more)'] : []),
          ...(metrics.glueWords > 40 ? ['Too many glue words'] : []),
          ...(metrics.dynamicContent < 70 ? ['Insufficient dynamic content'] : []),
        ],
      },
    });
  } catch (error) {
    console.error('Error evaluating scene:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate scene' },
      { status: 500 }
    );
  }
}

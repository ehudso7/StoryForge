/**
 * Excellence Engine Test API Route
 * POST - Test excellence engine directly with text
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DraftEvaluator } from '@/services/draft-evaluator';
import { ExcellenceEnforcer } from '@/services/excellence-enforcer';
import { z } from 'zod';

// Validation schema for test request
const testExcellenceSchema = z.object({
  text: z.string().min(50).max(10000),
  genre: z.string().min(1).max(100).optional().default('thriller'),
  mode: z.enum(['evaluate', 'improve', 'full']).optional().default('evaluate'),
  maxStrategies: z.number().int().min(1).max(5).optional().default(3),
});

/**
 * POST /api/test/excellence
 * Test the excellence engine with sample text
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
    const validationResult = testExcellenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { text, genre, mode, maxStrategies } = validationResult.data;

    // Evaluate text
    const metrics = DraftEvaluator.evaluate(text);
    const suggestions = DraftEvaluator.generateSuggestions(metrics);

    // Determine strategies needed
    const strategies = ExcellenceEnforcer.determineStrategies(metrics);

    const response: any = {
      evaluation: {
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
        },
        breakdown: metrics.breakdown,
        aiPatterns: metrics.aiPatterns.map(p => ({
          pattern: p.pattern,
          severity: p.severity,
          count: p.count,
        })),
        coherenceIssues: metrics.coherenceIssues,
        suggestions,
        passesStandard: metrics.overallScore >= 90,
      },
      recommendedStrategies: strategies.map(s => ({
        name: s.name,
        description: s.description,
        priority: s.priority,
        targetMetrics: s.targetMetrics,
      })),
    };

    // If mode is 'improve' or 'full', apply improvements
    if (mode === 'improve' || mode === 'full') {
      try {
        const result = await ExcellenceEnforcer.enforceExcellence(
          text,
          genre,
          maxStrategies
        );

        response.improvement = {
          finalText: result.finalText,
          totalImprovement: result.totalImprovement,
          strategiesApplied: result.strategies.map(s => ({
            strategy: s.strategy,
            success: s.success,
            originalScore: s.originalMetrics.overallScore,
            improvedScore: s.improvedMetrics.overallScore,
            scoreDelta: s.improvement.overallScoreDelta,
            metricsImproved: {
              glueWords: s.improvement.glueWordsDelta,
              showVsTell: s.improvement.showVsTellDelta,
              dynamicContent: s.improvement.dynamicContentDelta,
              dialogueBalance: s.improvement.dialogueBalanceDelta,
              aiPatterns: s.improvement.aiPatternsDelta,
            },
          })),
          finalMetrics: DraftEvaluator.evaluate(result.finalText),
        };
      } catch (error) {
        response.improvement = {
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Improvement failed. Evaluation results are still available.',
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error testing excellence engine:', error);
    return NextResponse.json(
      {
        error: 'Failed to test excellence engine',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Scene Generation API Route
 * POST - Generate scene using OpenAI or MechanicalWriter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { StripeService } from '@/services/stripe-service';
import { generateScene } from '@/services/openai-service';
import { z } from 'zod';

// Validation schema for scene generation
const generateSceneSchema = z.object({
  projectId: z.string().cuid(),
  chapterNumber: z.number().int().min(1),
  sceneNumber: z.number().int().min(1),
  outline: z.string().min(10).max(5000),
  pov: z.string().min(1).max(100),
  tone: z.string().min(1).max(100),
  characterNames: z.array(z.string()).min(1),
  targetLength: z.number().int().min(300).max(2000).optional(),
  previousSceneId: z.string().cuid().optional(),
});

/**
 * POST /api/generate/scene
 * Generate a new scene using AI
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
    const validationResult = generateSceneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      projectId,
      chapterNumber,
      sceneNumber,
      outline,
      pov,
      tone,
      characterNames,
      targetLength,
      previousSceneId,
    } = validationResult.data;

    // Verify project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        userId: true,
        genre: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this project' },
        { status: 403 }
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

    // Get previous scene context if provided
    let previousContext: string | undefined;
    if (previousSceneId) {
      const previousScene = await prisma.scene.findUnique({
        where: { id: previousSceneId },
        select: { content: true, projectId: true },
      });
      // Verify previous scene belongs to the same project
      if (previousScene && previousScene.projectId === projectId) {
        previousContext = previousScene.content;
      }
    }

    // Generate scene using OpenAI
    const result = await generateScene({
      outline,
      genre: project.genre,
      pov,
      tone,
      previousContext,
      characterNames,
      targetLength,
    });

    // Calculate word count
    const wordCount = result.text
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;

    // Track usage
    await StripeService.trackUsage({
      userId: session.user.id,
      tokens: result.tokensUsed,
      words: wordCount,
    });

    // Create scene and update project stats atomically
    const scene = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newScene = await tx.scene.create({
        data: {
          projectId,
          chapterNumber,
          sceneNumber,
          title: `Chapter ${chapterNumber}, Scene ${sceneNumber}`,
          content: result.text,
          wordCount,
          status: 'draft',
          metadata: {
            generatedWith: result.model,
            outline,
            pov,
            tone,
            characterNames,
          },
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          totalScenes: { increment: 1 },
          wordCount: { increment: wordCount },
          totalWordsWritten: { increment: wordCount },
        },
      });

      return newScene;
    });

    return NextResponse.json(
      {
        scene: {
          id: scene.id,
          chapterNumber: scene.chapterNumber,
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          content: scene.content,
          wordCount: scene.wordCount,
          status: scene.status,
        },
        generation: {
          model: result.model,
          tokensUsed: result.tokensUsed,
          wordsGenerated: wordCount,
        },
        usage: usageCheck.usage,
        message: 'Scene generated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating scene:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate scene',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

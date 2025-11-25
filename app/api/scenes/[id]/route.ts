/**
 * Scene Detail API Routes
 * GET - Get scene details
 * PUT - Update scene
 * DELETE - Delete scene
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Validation schema for scene update
const updateSceneSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'revised', 'completed']).optional(),
  metadata: z.object({
    hook: z.string().optional(),
    conflict: z.string().optional(),
    resolution: z.string().optional(),
    cliffhanger: z.string().optional(),
    pov: z.string().optional(),
    setting: z.string().optional(),
  }).optional(),
  chapterNumber: z.number().int().min(1).optional(),
  sceneNumber: z.number().int().min(1).optional(),
});

/**
 * GET /api/scenes/[id]
 * Get scene details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const scene = await prisma.scene.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            title: true,
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

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenes/[id]
 * Update scene
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify scene exists and user owns it
    const existingScene = await prisma.scene.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            id: true,
          },
        },
      },
    });

    if (!existingScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    if (existingScene.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this scene' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateSceneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If content is being updated, recalculate word count
    let wordCountDelta = 0;
    if (updateData.content !== undefined) {
      const newWordCount = updateData.content
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length;

      wordCountDelta = newWordCount - existingScene.wordCount;

      // Save current version to history before updating
      const currentVersion = {
        content: existingScene.content,
        wordCount: existingScene.wordCount,
        uwqesScore: existingScene.uwqesScore,
        timestamp: new Date().toISOString(),
      };

      // Update scene and project stats atomically
      const scene = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedScene = await tx.scene.update({
          where: { id: params.id },
      // Update scene with version history
      const scene = await prisma.scene.update({
        where: { id },
        data: {
          ...updateData,
          wordCount: newWordCount,
          versions: {
            push: currentVersion,
          },
          updatedAt: new Date(),
        },
      });

      // Update project word count if content changed
      if (wordCountDelta !== 0) {
        await prisma.project.update({
          where: { id: existingScene.project.id },
          data: {
            wordCount: { increment: wordCountDelta },
            // totalWordsWritten is cumulative - only increment when words are added
            totalWordsWritten: wordCountDelta > 0 ? { increment: wordCountDelta } : undefined,
            ...updateData,
            wordCount: newWordCount,
            versions: {
              push: currentVersion,
            },
            updatedAt: new Date(),
          },
        });

        // Update project word count if content changed
        if (wordCountDelta !== 0) {
          await tx.project.update({
            where: { id: existingScene.project.id },
            data: {
              wordCount: { increment: wordCountDelta },
              totalWordsWritten: { increment: wordCountDelta },
            },
          });
        }

        return updatedScene;
      });

      return NextResponse.json({
        scene,
        message: 'Scene updated successfully',
        wordCountDelta,
      });
    } else {
      // Update without content change
      const scene = await prisma.scene.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        scene,
        message: 'Scene updated successfully',
      });
    }
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenes/[id]
 * Delete scene
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify scene exists and user owns it
    const existingScene = await prisma.scene.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            id: true,
          },
        },
      },
    });

    if (!existingScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    if (existingScene.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this scene' },
        { status: 403 }
      );
    }

    // Delete scene and update project stats atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.scene.delete({
        where: { id },
      });
        where: { id: params.id },
      });
    // Delete scene
    await prisma.scene.delete({
      where: { id },
    });

      await tx.project.update({
        where: { id: existingScene.project.id },
        data: {
          totalScenes: { decrement: 1 },
          wordCount: { decrement: existingScene.wordCount },
          totalWordsWritten: { decrement: existingScene.wordCount },
          completedScenes: existingScene.status === 'completed' ? { decrement: 1 } : undefined,
        },
      });
    });

    return NextResponse.json({
      message: 'Scene deleted successfully',
      sceneTitle: existingScene.title,
    });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 }
    );
  }
}

/**
 * Project Scenes API Routes
 * GET - List scenes for a project
 * POST - Create new scene
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for scene creation
const createSceneSchema = z.object({
  chapterNumber: z.number().int().min(1),
  sceneNumber: z.number().int().min(1),
  title: z.string().min(1).max(500),
  content: z.string().optional().default(''),
  metadata: z.object({
    hook: z.string().optional(),
    conflict: z.string().optional(),
    resolution: z.string().optional(),
    cliffhanger: z.string().optional(),
    pov: z.string().optional(),
    setting: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/projects/[id]/scenes
 * List all scenes for a project
 */
export async function GET(
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

    // Verify project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter');
    const status = searchParams.get('status');

    // Build filter
    const where: any = { projectId: params.id };
    if (chapter) {
      where.chapterNumber = parseInt(chapter);
    }
    if (status) {
      where.status = status;
    }

    const scenes = await prisma.scene.findMany({
      where,
      orderBy: [
        { chapterNumber: 'asc' },
        { sceneNumber: 'asc' },
      ],
    });

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/scenes
 * Create a new scene
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

    // Verify project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createSceneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { chapterNumber, sceneNumber, title, content, metadata } = validationResult.data;

    // Check if scene already exists at this position
    const existingScene = await prisma.scene.findFirst({
      where: {
        projectId: params.id,
        chapterNumber,
        sceneNumber,
      },
    });

    if (existingScene) {
      return NextResponse.json(
        {
          error: 'Scene already exists',
          message: `A scene already exists at Chapter ${chapterNumber}, Scene ${sceneNumber}`,
        },
        { status: 409 }
      );
    }

    // Calculate word count
    const wordCount = content
      ? content.trim().split(/\s+/).filter(w => w.length > 0).length
      : 0;

    // Create scene
    const scene = await prisma.scene.create({
      data: {
        projectId: params.id,
        chapterNumber,
        sceneNumber,
        title: title.trim(),
        content: content || '',
        wordCount,
        status: 'draft',
        metadata: metadata || {},
        versions: [],
      },
    });

    // Update project stats
    await prisma.project.update({
      where: { id: params.id },
      data: {
        totalScenes: { increment: 1 },
        wordCount: { increment: wordCount },
        totalWordsWritten: { increment: wordCount },
      },
    });

    return NextResponse.json(
      {
        scene,
        message: 'Scene created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 }
    );
  }
}

/**
 * Projects API Routes
 * GET - List all user projects
 * POST - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TIER_LIMITS } from '@/services/stripe-service';
import { z } from 'zod';

// Validation schema for project creation
const createProjectSchema = z.object({
  title: z.string().min(1).max(500),
  genre: z.enum(['thriller', 'fantasy', 'romance', 'sci-fi', 'mystery', 'horror', 'literary fiction']),
  synopsis: z.string().min(10).max(5000),
  totalTargetWords: z.number().int().min(1000).max(500000).optional(),
});

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        scenes: {
          select: {
            id: true,
            status: true,
            wordCount: true,
          },
        },
        characters: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        worldBuilding: {
          select: {
            id: true,
            category: true,
          },
        },
        _count: {
          select: {
            scenes: true,
            characters: true,
            worldBuilding: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      projects: projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        genre: project.genre,
        synopsis: project.synopsis,
        coverImageUrl: project.coverImageUrl,
        wordCount: project.wordCount,
        completedScenes: project.completedScenes,
        totalScenes: project.totalScenes,
        progress: project.progress,
        isCompleted: project.isCompleted,
        totalTargetWords: project.totalTargetWords,
        totalWordsWritten: project.totalWordsWritten,
        chaptersComplete: project.chaptersComplete,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats: {
          totalScenes: project._count.scenes,
          totalCharacters: project._count.characters,
          totalWorldElements: project._count.worldBuilding,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
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

    // Check project limit based on subscription tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const tier = (user.subscriptionTier as 'hobby' | 'professional' | 'enterprise') || 'hobby';
    const limits = TIER_LIMITS[tier];

    // Check project limit (only for hobby tier)
    if (limits.maxProjects !== -1 && user._count.projects >= limits.maxProjects) {
      return NextResponse.json(
        {
          error: 'Project limit reached',
          message: `Your ${tier} plan allows ${limits.maxProjects} project(s). Upgrade to create more.`,
          currentCount: user._count.projects,
          limit: limits.maxProjects,
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, genre, synopsis, totalTargetWords } = validationResult.data;

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        genre,
        synopsis: synopsis.trim(),
        totalTargetWords: totalTargetWords || 100000,
        progress: 0,
        wordCount: 0,
        completedScenes: 0,
        totalScenes: 0,
        totalWordsWritten: 0,
        chaptersComplete: 0,
        isCompleted: false,
      },
    });

    return NextResponse.json(
      {
        project: {
          id: project.id,
          title: project.title,
          genre: project.genre,
          synopsis: project.synopsis,
          totalTargetWords: project.totalTargetWords,
          createdAt: project.createdAt,
        },
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

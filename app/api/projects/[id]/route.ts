/**
 * Project Detail API Routes
 * GET - Get project details
 * PUT - Update project
 * DELETE - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for project update
const updateProjectSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  genre: z.enum(['thriller', 'fantasy', 'romance', 'sci-fi', 'mystery', 'horror', 'literary fiction']).optional(),
  synopsis: z.string().min(10).max(5000).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  totalTargetWords: z.number().int().min(1000).max(500000).optional(),
  isCompleted: z.boolean().optional(),
});

/**
 * GET /api/projects/[id]
 * Get project details with all related data
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

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        scenes: {
          orderBy: [
            { chapterNumber: 'asc' },
            { sceneNumber: 'asc' },
          ],
          select: {
            id: true,
            chapterNumber: true,
            sceneNumber: true,
            title: true,
            wordCount: true,
            status: true,
            uwqesScore: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        characters: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        worldBuilding: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        exports: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this project' },
        { status: 403 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update project details
 */
export async function PUT(
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
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (existingProject.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this project' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

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

    // Update project
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project and all related data
 */
export async function DELETE(
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
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        title: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (existingProject.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this project' },
        { status: 403 }
      );
    }

    // Delete project (cascades to scenes, characters, worldBuilding, exports)
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Project deleted successfully',
      projectTitle: existingProject.title,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

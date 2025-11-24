/**
 * Project World Building API Route
 * POST - Create new world building element
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for world building element creation
const createWorldBuildingSchema = z.object({
  category: z.enum(['setting', 'culture', 'history', 'magic', 'technology']),
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(10000),
  details: z.record(z.any()).optional(),
  importance: z.enum(['core', 'major', 'minor']),
});

/**
 * POST /api/projects/[id]/world
 * Create a new world building element for the project
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
    const validationResult = createWorldBuildingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { category, name, description, details, importance } = validationResult.data;

    // Create world building element
    const worldElement = await prisma.worldBuilding.create({
      data: {
        projectId: params.id,
        category,
        name: name.trim(),
        description: description.trim(),
        details: details || {},
        importance,
      },
    });

    return NextResponse.json(
      {
        worldElement,
        message: 'World building element created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating world building element:', error);
    return NextResponse.json(
      { error: 'Failed to create world building element' },
      { status: 500 }
    );
  }
}

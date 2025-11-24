/**
 * Project Characters API Route
 * POST - Create new character
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for character creation
const createCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']),
  description: z.string().min(10).max(5000),
  backstory: z.string().min(10).max(10000),
  motivations: z.string().min(10).max(5000),
  personality: z.string().min(10).max(5000),
  relationships: z.record(z.string()).optional(),
  arc: z.string().min(10).max(10000),
});

/**
 * POST /api/projects/[id]/characters
 * Create a new character for the project
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
    const validationResult = createCharacterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, role, description, backstory, motivations, personality, relationships, arc } = validationResult.data;

    // Create character
    const character = await prisma.character.create({
      data: {
        projectId: params.id,
        name: name.trim(),
        role,
        description: description.trim(),
        backstory: backstory.trim(),
        motivations: motivations.trim(),
        personality: personality.trim(),
        relationships: relationships || {},
        arc: arc.trim(),
      },
    });

    return NextResponse.json(
      {
        character,
        message: 'Character created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

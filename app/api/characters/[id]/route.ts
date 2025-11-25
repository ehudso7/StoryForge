/**
 * Character Detail API Routes
 * PUT - Update character
 * DELETE - Delete character
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for character update
const updateCharacterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
  description: z.string().min(10).max(5000).optional(),
  backstory: z.string().min(10).max(10000).optional(),
  motivations: z.string().min(10).max(5000).optional(),
  personality: z.string().min(10).max(5000).optional(),
  relationships: z.record(z.string()).optional(),
  arc: z.string().min(10).max(10000).optional(),
});

/**
 * PUT /api/characters/[id]
 * Update character
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

    // Verify character exists and user owns it
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    if (existingCharacter.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this character' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCharacterSchema.safeParse(body);

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

    // Update character
    const character = await prisma.character.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      character,
      message: 'Character updated successfully',
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/characters/[id]
 * Delete character
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

    // Verify character exists and user owns it
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    if (existingCharacter.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this character' },
        { status: 403 }
      );
    }

    // Delete character
    await prisma.character.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Character deleted successfully',
      characterName: existingCharacter.name,
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}

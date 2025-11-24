/**
 * World Building Detail API Routes
 * PUT - Update world building element
 * DELETE - Delete world building element
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for world building element update
const updateWorldBuildingSchema = z.object({
  category: z.enum(['setting', 'culture', 'history', 'magic', 'technology']).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(10).max(10000).optional(),
  details: z.record(z.any()).optional(),
  importance: z.enum(['core', 'major', 'minor']).optional(),
});

/**
 * PUT /api/world/[id]
 * Update world building element
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

    // Verify world element exists and user owns it
    const existingElement = await prisma.worldBuilding.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingElement) {
      return NextResponse.json(
        { error: 'World building element not found' },
        { status: 404 }
      );
    }

    if (existingElement.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this world building element' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateWorldBuildingSchema.safeParse(body);

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

    // Update world building element
    const worldElement = await prisma.worldBuilding.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      worldElement,
      message: 'World building element updated successfully',
    });
  } catch (error) {
    console.error('Error updating world building element:', error);
    return NextResponse.json(
      { error: 'Failed to update world building element' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/world/[id]
 * Delete world building element
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

    // Verify world element exists and user owns it
    const existingElement = await prisma.worldBuilding.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingElement) {
      return NextResponse.json(
        { error: 'World building element not found' },
        { status: 404 }
      );
    }

    if (existingElement.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this world building element' },
        { status: 403 }
      );
    }

    // Delete world building element
    await prisma.worldBuilding.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'World building element deleted successfully',
      elementName: existingElement.name,
    });
  } catch (error) {
    console.error('Error deleting world building element:', error);
    return NextResponse.json(
      { error: 'Failed to delete world building element' },
      { status: 500 }
    );
  }
}

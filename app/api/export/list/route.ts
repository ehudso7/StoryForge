/**
 * Export List API Route
 * GET - List user's exports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/export/list
 * List all exports for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const where: any = { userId: session.user.id };
    if (projectId) {
      where.projectId = projectId;
    }
    if (format) {
      where.format = format;
    }

    // Fetch exports
    const exports = await prisma.export.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            genre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.export.count({ where });

    return NextResponse.json({
      exports: exports.map((exp: any) => ({
        id: exp.id,
        format: exp.format,
        fileUrl: exp.fileUrl,
        metadata: exp.metadata,
        createdAt: exp.createdAt,
        project: exp.project,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + exports.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching exports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}

/**
 * Export API Route
 * POST - Export project to various formats (txt/pdf/epub)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ExportService } from '@/services/export-service';
import { TIER_LIMITS } from '@/services/stripe-service';
import * as path from 'path';
import * as fs from 'fs';
import { z } from 'zod';

// Validation schema for export request
const exportProjectSchema = z.object({
  format: z.enum(['txt', 'pdf', 'epub']),
  includeMetadata: z.boolean().optional().default(true),
  includeWordCount: z.boolean().optional().default(true),
});

/**
 * POST /api/export/[projectId]
 * Export project to specified format
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = exportProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { format, includeMetadata, includeWordCount } = validationResult.data;

    // Fetch project with all scenes
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
          },
        },
        scenes: {
          orderBy: [
            { chapterNumber: 'asc' },
            { sceneNumber: 'asc' },
          ],
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

    // Check if project has scenes
    if (project.scenes.length === 0) {
      return NextResponse.json(
        {
          error: 'Project has no scenes',
          message: 'Cannot export an empty project',
        },
        { status: 400 }
      );
    }

    // Check format permissions based on subscription tier
    const tier = (project.user.subscriptionTier as 'hobby' | 'professional' | 'enterprise') || 'hobby';
    const allowedFormats = TIER_LIMITS[tier].exportFormats;

    if (!allowedFormats.includes(format)) {
      return NextResponse.json(
        {
          error: 'Format not allowed',
          message: `Your ${tier} plan does not support ${format.toUpperCase()} exports. Upgrade to access this format.`,
          allowedFormats,
        },
        { status: 403 }
      );
    }

    // Group scenes by chapter
    const chapterMap = new Map<number, typeof project.scenes>();
    for (const scene of project.scenes) {
      if (!chapterMap.has(scene.chapterNumber)) {
        chapterMap.set(scene.chapterNumber, []);
      }
      chapterMap.get(scene.chapterNumber)!.push(scene);
    }

    // Assemble chapters
    const chapters = Array.from(chapterMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([chapterNumber, scenes]) => {
        const chapterContent = scenes
          .sort((a: any, b: any) => a.sceneNumber - b.sceneNumber)
          .map((scene: any) => scene.content)
          .join('\n\n');

        return {
          title: `Chapter ${chapterNumber}`,
          content: chapterContent,
        };
      });

    // Prepare novel data
    const novelData = ExportService.prepareNovelData(chapters, {
      title: project.title,
      author: project.user.name || 'Unknown Author',
      genre: project.genre,
      description: project.synopsis,
      language: 'en',
      publisher: 'StoryForge',
    });

    // Validate novel data
    const validation = ExportService.validateNovelData(novelData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid novel data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedTitle}_${timestamp}.${format}`;
    const outputPath = path.join(exportsDir, filename);

    // Export to specified format
    const exportResult = await ExportService.export(novelData, {
      format,
      outputPath,
      includeMetadata,
      includeWordCount,
    });

    if (!exportResult.success) {
      return NextResponse.json(
        {
          error: 'Export failed',
          message: exportResult.error || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Save export record to database
    const exportRecord = await prisma.export.create({
      data: {
        projectId,
        userId: session.user.id,
        format,
        fileUrl: `/exports/${filename}`,
        metadata: {
          fileName: filename,
          fileSize: exportResult.fileSize,
          wordCount: novelData.totalWordCount,
          chapters: novelData.chapters.length,
          exportedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      export: {
        id: exportRecord.id,
        format: exportRecord.format,
        fileUrl: exportRecord.fileUrl,
        fileName: filename,
        fileSize: exportResult.fileSize,
        createdAt: exportRecord.createdAt,
      },
      project: {
        title: project.title,
        wordCount: novelData.totalWordCount,
        chapters: novelData.chapters.length,
      },
      message: `Project exported successfully as ${format.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    return NextResponse.json(
      {
        error: 'Failed to export project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

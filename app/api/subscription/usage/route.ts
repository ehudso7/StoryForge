/**
 * Subscription Usage API Route
 * GET - Get usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TIER_LIMITS } from '@/services/stripe-service';

/**
 * GET /api/subscription/usage
 * Get detailed usage statistics for the current user
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

    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            wordCount: true,
            totalScenes: true,
            isCompleted: true,
            createdAt: true,
          },
        },
        exports: {
          select: {
            format: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
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

    // Calculate usage percentages
    const tokensPercentage = Math.round((user.tokensUsedThisMonth / limits.tokensPerMonth) * 100);
    const wordsPercentage = Math.round((user.wordsUsedThisMonth / limits.wordsPerMonth) * 100);
    const projectsCount = user.projects.length;
    const projectsPercentage = limits.maxProjects === -1
      ? 0
      : Math.round((projectsCount / limits.maxProjects) * 100);

    // Calculate days until reset
    const now = new Date();
    const resetDate = new Date(user.usageResetDate);
    const daysUntilReset = Math.ceil((resetDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total words written across all projects
    const totalWordsWritten = user.projects.reduce((sum: number, p: any) => sum + p.wordCount, 0);

    // Count exports by format
    const exportsByFormat = user.exports.reduce((acc: Record<string, number>, exp: any) => {
      acc[exp.format] = (acc[exp.format] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      usage: {
        tokens: {
          used: user.tokensUsedThisMonth,
          limit: limits.tokensPerMonth,
          remaining: limits.tokensPerMonth - user.tokensUsedThisMonth,
          percentage: tokensPercentage,
        },
        words: {
          used: user.wordsUsedThisMonth,
          limit: limits.wordsPerMonth,
          remaining: limits.wordsPerMonth - user.wordsUsedThisMonth,
          percentage: wordsPercentage,
        },
        projects: {
          count: projectsCount,
          limit: limits.maxProjects,
          remaining: limits.maxProjects === -1 ? -1 : limits.maxProjects - projectsCount,
          percentage: projectsPercentage,
        },
        reset: {
          date: user.usageResetDate,
          daysUntilReset: Math.max(0, daysUntilReset),
        },
      },
      statistics: {
        totalProjects: projectsCount,
        completedProjects: user.projects.filter((p: any) => p.isCompleted).length,
        totalWordsWritten,
        totalScenes: user.projects.reduce((sum: number, p: any) => sum + p.totalScenes, 0),
        totalExports: user.exports.length,
        exportsByFormat,
        recentExports: user.exports.map((exp: any) => ({
          format: exp.format,
          createdAt: exp.createdAt,
        })),
      },
      projects: user.projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        wordCount: project.wordCount,
        totalScenes: project.totalScenes,
        isCompleted: project.isCompleted,
        createdAt: project.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}

/**
 * Subscription Status API Route
 * GET - Get current subscription details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StripeService } from '@/services/stripe-service';

/**
 * GET /api/subscription/status
 * Get user's subscription status and usage
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

    // Get subscription details from StripeService
    const details = await StripeService.getSubscriptionDetails(session.user.id);

    return NextResponse.json({
      subscription: {
        tier: details.tier,
        status: details.status,
        limits: {
          maxProjects: details.limits.maxProjects,
          tokensPerMonth: details.limits.tokensPerMonth,
          wordsPerMonth: details.limits.wordsPerMonth,
          exportFormats: details.limits.exportFormats,
          generationCooldown: details.limits.generationCooldown,
          supportLevel: details.limits.supportLevel,
        },
        usage: {
          tokensUsed: details.usage.tokensUsed,
          tokensLimit: details.usage.tokensLimit,
          tokensRemaining: details.usage.tokensLimit === -1 ? -1 : details.usage.tokensLimit - details.usage.tokensUsed,
          tokensRemaining: details.usage.tokensLimit - details.usage.tokensUsed,
          tokensPercentage: details.usage.tokensLimit > 0
            ? Math.round((details.usage.tokensUsed / details.usage.tokensLimit) * 100)
            : 0,
          wordsUsed: details.usage.wordsUsed,
          wordsLimit: details.usage.wordsLimit,
          wordsRemaining: details.usage.wordsLimit === -1 ? -1 : details.usage.wordsLimit - details.usage.wordsUsed,
          wordsRemaining: details.usage.wordsLimit - details.usage.wordsUsed,
          wordsPercentage: details.usage.wordsLimit > 0
            ? Math.round((details.usage.wordsUsed / details.usage.wordsLimit) * 100)
            : 0,
          projectsCount: details.usage.projectsCount,
          projectsLimit: details.usage.projectsLimit,
          projectsRemaining: details.usage.projectsLimit === -1 ? -1 : details.usage.projectsLimit - details.usage.projectsCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

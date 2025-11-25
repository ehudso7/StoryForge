/**
 * Subscription Portal API Route
 * POST - Create Stripe customer portal session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StripeService } from '@/services/stripe-service';
import { z } from 'zod';

// Validation schema for portal request
const createPortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

/**
 * Check if a URL has the same origin as the base URL
 * Returns false if URL parsing fails (malformed URL)
 */
function isSameOrigin(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    return urlObj.origin === baseUrlObj.origin;
  } catch {
    return false;
  }
}

/**
 * POST /api/subscription/portal
 * Create a Stripe customer portal session
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPortalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { returnUrl } = validationResult.data;

    // Use trusted server-configured base URL to prevent open redirect attacks
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Validate user-provided URL is same origin to prevent open redirect
    if (returnUrl && !isSameOrigin(returnUrl, baseUrl)) {
      return NextResponse.json({ error: 'Invalid returnUrl' }, { status: 400 });
    }

    // Create portal session
    const portalSession = await StripeService.createPortalSession({
      userId: session.user.id,
      returnUrl: returnUrl || `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

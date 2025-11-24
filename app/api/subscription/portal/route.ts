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

    // Get base URL from request
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

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

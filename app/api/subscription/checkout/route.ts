/**
 * Subscription Checkout API Route
 * POST - Create Stripe checkout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StripeService } from '@/services/stripe-service';
import { z } from 'zod';

// Validation schema for checkout request
const createCheckoutSchema = z.object({
  tier: z.enum(['hobby', 'professional', 'enterprise']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Helper to validate URL is same origin
const isSameOrigin = (url: string, origin: string) => {
  try {
    const parsed = new URL(url);
    const originParsed = new URL(origin);
    return parsed.origin === originParsed.origin;
  } catch {
    return false;
  }
};

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
 * POST /api/subscription/checkout
 * Create a Stripe checkout session for subscription
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
    const validationResult = createCheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { tier, successUrl, cancelUrl } = validationResult.data;

    // Use trusted server-configured base URL to prevent open redirect attacks
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Validate user-provided URLs are same origin to prevent open redirect
    // Validate URLs are same origin to prevent open redirect
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    if (successUrl && !isSameOrigin(successUrl, baseUrl)) {
      return NextResponse.json({ error: 'Invalid successUrl' }, { status: 400 });
    }
    if (cancelUrl && !isSameOrigin(cancelUrl, baseUrl)) {
      return NextResponse.json({ error: 'Invalid cancelUrl' }, { status: 400 });
    }

    // Get base URL from request
    const requestOrigin = request.headers.get('origin') || 'http://localhost:3000';

    // Create checkout session
    const checkoutSession = await StripeService.createCheckoutSession({
      userId: session.user.id,
      tier,
      successUrl: successUrl || `${requestOrigin}/dashboard?checkout=success`,
      cancelUrl: cancelUrl || `${requestOrigin}/pricing?checkout=cancelled`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
      tier,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

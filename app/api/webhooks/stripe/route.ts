/**
 * Stripe Webhooks API Route
 * POST - Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/services/stripe-service';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * IMPORTANT: This route must be configured without authentication middleware
 * and must receive the raw request body for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Get Stripe signature from headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Get raw body as text for signature verification
    const body = await request.text();

    // Handle webhook using StripeService
    const result = await StripeService.handleWebhook({
      body,
      signature,
    });

    return NextResponse.json({
      received: result.received,
      type: result.type,
    });
  } catch (error) {
    console.error('Webhook error:', error);

    // Return 400 for webhook errors (so Stripe doesn't retry)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

/**
 * Configure route to receive raw body
 * This is required for Stripe signature verification
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

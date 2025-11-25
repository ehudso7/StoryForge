/**
 * Stripe Integration Service
 * Handles subscription management, checkout, webhooks, and usage tracking
 */

import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const getStripeClient = (() => {
  let client: Stripe | null = null;
  return () => {
    if (!client) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
      }
      client = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      });
    }
    return client;
  };
})();

export type SubscriptionTier = 'hobby' | 'professional' | 'enterprise';

export interface TierLimits {
  maxProjects: number;
  tokensPerMonth: number;
  wordsPerMonth: number;
  exportFormats: string[];
  generationCooldown: number; // seconds
  supportLevel: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  hobby: {
    maxProjects: 3,
    tokensPerMonth: 25000,
    wordsPerMonth: 20000,
    exportFormats: ['txt'],
    generationCooldown: 10,
    supportLevel: 'community',
  },
  professional: {
    maxProjects: -1, // unlimited
    tokensPerMonth: 150000,
    wordsPerMonth: 120000,
    exportFormats: ['txt', 'pdf'],
    generationCooldown: 3,
    supportLevel: 'priority',
  },
  enterprise: {
    maxProjects: -1, // unlimited
    tokensPerMonth: 500000,
    wordsPerMonth: 400000,
    exportFormats: ['txt', 'pdf', 'epub'],
    generationCooldown: 1,
    supportLevel: 'dedicated',
  },
};

export const TIER_PRICES = {
  hobby: {
    monthly: 9.99,
    priceId: process.env.STRIPE_HOBBY_PRICE_ID!,
  },
  professional: {
    monthly: 49.99,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
  },
  enterprise: {
    monthly: 149.99,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
};

export class StripeService {
  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(params: {
    userId: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, stripeCustomerId: true },
      });

      if (!user || !user.email) {
        throw new Error('User not found or email missing');
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await getStripeClient().customers.create({
          email: user.email,
          metadata: {
            userId: params.userId,
          },
        });

        customerId = customer.id;

        await prisma.user.update({
          where: { id: params.userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await getStripeClient().checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: TIER_PRICES[params.tier].priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          tier: params.tier,
        },
      });

      if (!session.url) {
        throw new Error('Checkout session URL not generated');
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Create a customer portal session for managing subscription
   */
  static async createPortalSession(params: {
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await getStripeClient().billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: params.returnUrl,
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      throw new Error(`Failed to create portal session: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(params: {
    body: string | Buffer;
    signature: string;
  }): Promise<{ received: boolean; type: string }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      const event = getStripeClient().webhooks.constructEvent(
        params.body,
        params.signature,
        webhookSecret
      );

      console.log(`Received webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true, type: event.type };
    } catch (error: any) {
      console.error('Webhook error:', error);
      throw new Error(`Webhook error: ${error.message}`);
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) {
      console.error('Missing metadata in checkout session');
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        stripeCustomerId: session.customer as string,
      },
    });

    console.log(`Subscription activated for user ${userId}: ${tier}`);
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }

    // Determine tier from price ID
    let tier: SubscriptionTier = 'hobby';
    const priceId = subscription.items.data[0]?.price.id;

    if (priceId === TIER_PRICES.professional.priceId) {
      tier = 'professional';
    } else if (priceId === TIER_PRICES.enterprise.priceId) {
      tier = 'enterprise';
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
      },
    });

    console.log(`Subscription updated for user ${user.id}: ${tier} (${subscription.status})`);
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'hobby',
        subscriptionStatus: 'cancelled',
      },
    });

    console.log(`Subscription cancelled for user ${user.id}`);
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) return;

    // Reset usage on successful payment (monthly billing)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'active',
        wordsUsedThisMonth: 0,
        tokensUsedThisMonth: 0,
        usageResetDate: new Date(),
      },
    });

    console.log(`Payment succeeded for user ${user.id}, usage reset`);
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) return;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });

    console.log(`Payment failed for user ${user.id}`);
  }

  /**
   * Check if user has reached usage limits
   */
  static async checkUsageLimits(userId: string): Promise<{
    canGenerate: boolean;
    reason?: string;
    usage: {
      tokensUsed: number;
      tokensLimit: number;
      wordsUsed: number;
      wordsLimit: number;
      projectsCount: number;
      projectsLimit: number;
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        tokensUsedThisMonth: true,
        wordsUsedThisMonth: true,
        projects: { select: { id: true } },
      },
    });

    if (!user) {
      return { canGenerate: false, reason: 'User not found', usage: {} as any };
    }

    const tier = (user.subscriptionTier as SubscriptionTier) || 'hobby';
    const limits = TIER_LIMITS[tier];

    // Check subscription status
    if (user.subscriptionStatus !== 'active') {
      return {
        canGenerate: false,
        reason: `Subscription is ${user.subscriptionStatus}`,
        usage: {
          tokensUsed: user.tokensUsedThisMonth,
          tokensLimit: limits.tokensPerMonth,
          wordsUsed: user.wordsUsedThisMonth,
          wordsLimit: limits.wordsPerMonth,
          projectsCount: user.projects.length,
          projectsLimit: limits.maxProjects,
        },
      };
    }

    // Check token limit
    if (user.tokensUsedThisMonth >= limits.tokensPerMonth) {
      return {
        canGenerate: false,
        reason: 'Monthly token limit reached',
        usage: {
          tokensUsed: user.tokensUsedThisMonth,
          tokensLimit: limits.tokensPerMonth,
          wordsUsed: user.wordsUsedThisMonth,
          wordsLimit: limits.wordsPerMonth,
          projectsCount: user.projects.length,
          projectsLimit: limits.maxProjects,
        },
      };
    }

    // Check word limit
    if (user.wordsUsedThisMonth >= limits.wordsPerMonth) {
      return {
        canGenerate: false,
        reason: 'Monthly word limit reached',
        usage: {
          tokensUsed: user.tokensUsedThisMonth,
          tokensLimit: limits.tokensPerMonth,
          wordsUsed: user.wordsUsedThisMonth,
          wordsLimit: limits.wordsPerMonth,
          projectsCount: user.projects.length,
          projectsLimit: limits.maxProjects,
        },
      };
    }

    return {
      canGenerate: true,
      usage: {
        tokensUsed: user.tokensUsedThisMonth,
        tokensLimit: limits.tokensPerMonth,
        wordsUsed: user.wordsUsedThisMonth,
        wordsLimit: limits.wordsPerMonth,
        projectsCount: user.projects.length,
        projectsLimit: limits.maxProjects,
      },
    };
  }

  /**
   * Track usage for generation
   */
  static async trackUsage(params: {
    userId: string;
    tokens: number;
    words: number;
  }): Promise<void> {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({
        where: { id: params.userId },
        select: {
          subscriptionTier: true,
          tokensUsedThisMonth: true,
          wordsUsedThisMonth: true,
        },
      });

      if (!user) {
        throw new Error('User not found for usage tracking');
      }

      const tier = (user.subscriptionTier as SubscriptionTier) || 'hobby';
      const limits = TIER_LIMITS[tier];

      if (
        user.tokensUsedThisMonth + params.tokens > limits.tokensPerMonth ||
        user.wordsUsedThisMonth + params.words > limits.wordsPerMonth
      ) {
        throw new Error('Usage limit exceeded');
      }

      await tx.user.update({
        where: { id: params.userId },
        data: {
          tokensUsedThisMonth: { increment: params.tokens },
          wordsUsedThisMonth: { increment: params.words },
        },
      });
    });

    console.log(`Usage tracked for user ${params.userId}: +${params.tokens} tokens, +${params.words} words`);
  }

  /**
   * Get user's subscription details
   */
  static async getSubscriptionDetails(userId: string): Promise<{
    tier: SubscriptionTier;
    status: string;
    limits: TierLimits;
    usage: {
      tokensUsed: number;
      tokensLimit: number;
      wordsUsed: number;
      wordsLimit: number;
      projectsCount: number;
      projectsLimit: number;
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        tokensUsedThisMonth: true,
        wordsUsedThisMonth: true,
        projects: { select: { id: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tier = (user.subscriptionTier as SubscriptionTier) || 'hobby';
    const limits = TIER_LIMITS[tier];

    return {
      tier,
      status: user.subscriptionStatus,
      limits,
      usage: {
        tokensUsed: user.tokensUsedThisMonth,
        tokensLimit: limits.tokensPerMonth,
        wordsUsed: user.wordsUsedThisMonth,
        wordsLimit: limits.wordsPerMonth,
        projectsCount: user.projects.length,
        projectsLimit: limits.maxProjects,
      },
    };
  }
}

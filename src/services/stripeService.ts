/**
 * 3WM SONIK - Enterprise Stripe Service
 * Comprehensive implementation covering:
 * 1. Payments (PaymentIntents, Stem Checkouts)
 * 2. Billing (Subscriptions, Customer Portal, Metered Usage)
 * 3. Connect (Express Creator Accounts, Royalty Transfers)
 * 4. Identity (KYC Document & Biometric Selfie Verification)
 * 5. Radar (Risk Evaluation & Early Fraud Warnings)
 * 6. Invoicing (B2B Enterprise Studio Invoices)
 */

import Stripe from 'stripe';
import { SaaSPlan } from '../types';

export interface StripeServiceConfig {
  apiKey?: string;
  webhookSecret?: string;
}

export class StripeService {
  private stripe: Stripe | null = null;
  private webhookSecret: string | undefined;

  constructor(config?: StripeServiceConfig) {
    const apiKey = config?.apiKey || process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-02-24.acacia' as any,
        appInfo: {
          name: '3WM SONIK Audio Engine',
          version: '1.0.0',
        },
      });
    }
  }

  public get isConfigured(): boolean {
    return this.stripe !== null;
  }

  public initialize(): void {
    if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia' as any,
        appInfo: {
          name: '3WM SONIK Audio Engine',
          version: '1.0.0',
        },
      });
    }
  }

  public async createCheckoutSession(
    planId: string,
    userId: string,
    customerEmail?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ url: string; sessionId: string }> {
    const planMap: Record<string, SaaSPlan> = {
      creator: 'CREATOR',
      pro: 'PRO',
      pro_studio: 'PRO',
      studio: 'STUDIO',
      master_label: 'STUDIO',
    };

    const resolvedPlan: SaaSPlan = planMap[planId.toLowerCase()] || 'PRO';
    return this.createSubscriptionCheckout({
      workspaceId: `ws_${userId}`,
      userId,
      customerEmail,
      plan: resolvedPlan,
      billingPeriod: 'MONTHLY',
      successUrl: successUrl || '/#/billing?status=success',
      cancelUrl: cancelUrl || '/#/billing?status=cancelled',
    });
  }

  // ==========================================
  // 1. BILLING & SUBSCRIPTIONS
  // ==========================================

  public async createSubscriptionCheckout(params: {
    workspaceId: string;
    userId: string;
    customerEmail?: string;
    plan: SaaSPlan;
    billingPeriod: 'MONTHLY' | 'YEARLY';
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    if (!this.stripe) {
      return {
        url: `${params.successUrl}?session_id=mock_sub_${Date.now()}&plan=${params.plan}&status=sandbox`,
        sessionId: `cs_mock_${Date.now()}`,
      };
    }

    const priceMap: Record<SaaSPlan, { monthly: number; yearly: number }> = {
      FREE: { monthly: 0, yearly: 0 },
      CREATOR: { monthly: 1900, yearly: 19000 },
      PRO: { monthly: 4900, yearly: 49000 },
      STUDIO: { monthly: 14900, yearly: 149000 },
    };

    const unitAmount =
      params.billingPeriod === 'MONTHLY'
        ? priceMap[params.plan].monthly
        : priceMap[params.plan].yearly;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: params.workspaceId,
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `3WM SONIK - ${params.plan} Tier (${params.billingPeriod})`,
              description: 'AI Music Production & Multi-Agent Council Access',
            },
            unit_amount: unitAmount,
            recurring: {
              interval: params.billingPeriod === 'MONTHLY' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        plan: params.plan,
        billingPeriod: params.billingPeriod,
      },
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    return {
      url: session.url || params.successUrl,
      sessionId: session.id,
    };
  }

  public async createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    if (!this.stripe) {
      return { url: params.returnUrl };
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return { url: portalSession.url };
  }

  // ==========================================
  // 2. PAYMENTS & ONE-OFF STEM PURCHASES
  // ==========================================

  public async createPaymentIntent(params: {
    amountUsd: number;
    currency?: string;
    workspaceId: string;
    userId: string;
    description: string;
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) {
      return {
        clientSecret: `pi_mock_secret_${Date.now()}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amountUsd * 100),
      currency: params.currency || 'usd',
      description: params.description,
      automatic_payment_methods: { enabled: true },
      metadata: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        ...params.metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
    };
  }

  // ==========================================
  // 3. STRIPE CONNECT (CREATOR PAYOUTS)
  // ==========================================

  public async createConnectedAccount(params: {
    email: string;
    country: string;
    creatorName: string;
  }): Promise<{ accountId: string }> {
    if (!this.stripe) {
      return { accountId: `acct_mock_${Date.now()}` };
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: params.country || 'US',
      email: params.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: params.creatorName,
        product_description: 'Music producer / creator on 3WM SONIK platform',
      },
    });

    return { accountId: account.id };
  }

  public async createAccountOnboardingLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    if (!this.stripe) {
      return { url: params.returnUrl };
    }

    const link = await this.stripe.accountLinks.create({
      account: params.accountId,
      refresh_url: params.refreshUrl,
      return_url: params.returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  public async createRoyaltyTransfer(params: {
    destinationAccountId: string;
    amountUsd: number;
    transferGroup: string;
    description: string;
  }): Promise<{ transferId: string }> {
    if (!this.stripe) {
      return { transferId: `tr_mock_${Date.now()}` };
    }

    const transfer = await this.stripe.transfers.create({
      amount: Math.round(params.amountUsd * 100),
      currency: 'usd',
      destination: params.destinationAccountId,
      transfer_group: params.transferGroup,
      description: params.description,
    });

    return { transferId: transfer.id };
  }

  // ==========================================
  // 4. STRIPE IDENTITY (CREATOR KYC)
  // ==========================================

  public async createIdentityVerificationSession(params: {
    userId: string;
    workspaceId: string;
    returnUrl?: string;
  }): Promise<{ sessionId: string; url: string; clientSecret: string }> {
    if (!this.stripe) {
      return {
        sessionId: `vs_mock_${Date.now()}`,
        url: params.returnUrl || 'https://verify.stripe.com/mock',
        clientSecret: `vs_mock_secret_${Date.now()}`,
      };
    }

    const session = await this.stripe.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      metadata: {
        userId: params.userId,
        workspaceId: params.workspaceId,
      },
      return_url: params.returnUrl,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
      clientSecret: session.client_secret || '',
    };
  }

  // ==========================================
  // 5. STRIPE INVOICING (ENTERPRISE LABELS)
  // ==========================================

  public async createStudioInvoice(params: {
    customerId: string;
    items: Array<{ description: string; amountUsd: number; quantity?: number }>;
    daysUntilDue?: number;
    memo?: string;
  }): Promise<{ invoiceId: string; hostedInvoiceUrl: string; pdfUrl?: string }> {
    if (!this.stripe) {
      return {
        invoiceId: `in_mock_${Date.now()}`,
        hostedInvoiceUrl: 'https://invoice.stripe.com/mock',
      };
    }

    // Add invoice line items
    for (const item of params.items) {
      await this.stripe.invoiceItems.create({
        customer: params.customerId,
        amount: Math.round(item.amountUsd * 100),
        currency: 'usd',
        description: item.description,
        quantity: item.quantity || 1,
      });
    }

    // Create & finalize invoice
    const invoice = await this.stripe.invoices.create({
      customer: params.customerId,
      collection_method: 'send_invoice',
      days_until_due: params.daysUntilDue || 30,
      description: params.memo || '3WM SONIK Enterprise Studio License',
    });

    const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);

    return {
      invoiceId: finalizedInvoice.id,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
      pdfUrl: finalizedInvoice.invoice_pdf || undefined,
    };
  }

  // ==========================================
  // 6. STRIPE RADAR & WEBHOOK HANDLING
  // ==========================================

  public constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event | null {
    if (!this.stripe || !this.webhookSecret) {
      return null;
    }

    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  public handleRadarEarlyFraudWarning(event: Stripe.Event): {
    chargeId: string;
    actionable: boolean;
    fraudType: string;
  } {
    const warning = event.data.object as any;
    return {
      chargeId: typeof warning.charge === 'string' ? warning.charge : warning?.charge?.id || '',
      actionable: Boolean(warning.actionable),
      fraudType: warning.fraud_type || 'card_fraud',
    };
  }
}

export const stripeService = new StripeService();

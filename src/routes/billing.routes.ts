import { Router, Request, Response } from 'express';
import { billingService, TOKEN_CREDIT_PACKS } from '../services/billingService';
import { stripeService } from '../services/stripeService';
import { SaaSPlan } from '../types';

const router = Router();

// ============================================================
// 1. PUBLIC PRICING CATALOG & METADATA
// ============================================================
router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    plans: [
      {
        id: 'FREE',
        name: 'Free Starter',
        priceMonthly: 0,
        priceYearly: 0,
        description: 'Core Web Audio DAW & standard stem mixing.',
      },
      {
        id: 'CREATOR',
        name: 'Creator',
        priceMonthly: 19,
        priceYearly: 190,
        description: 'For independent Afrofusion producers and vocalists.',
      },
      {
        id: 'PRO',
        name: 'Pro Studio',
        popular: true,
        priceMonthly: 49,
        priceYearly: 490,
        description: 'Full Three Wise Men intelligence with 3D studio avatars.',
      },
      {
        id: 'STUDIO',
        name: 'Studio Label / Enterprise',
        priceMonthly: 149,
        priceYearly: 1490,
        description: 'Dedicated cloud DSP processing and multi-room routing.',
      },
    ],
    creditPacks: TOKEN_CREDIT_PACKS,
    acceptedCrypto: [
      { symbol: 'USDC', name: 'USD Coin', networks: ['Polygon', 'Solana', 'Base', 'Ethereum'] },
      { symbol: 'USDT', name: 'Tether USD', networks: ['Polygon', 'Ethereum', 'Tron'] },
      { symbol: 'SOL', name: 'Solana', networks: ['Solana'] },
      { symbol: 'ETH', name: 'Ethereum', networks: ['Ethereum', 'Base', 'Arbitrum'] },
    ],
  });
});

// ============================================================
// 2. STRIPE CHECKOUT & SUBSCRIPTIONS
// ============================================================
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userId, plan, billingPeriod, successUrl, cancelUrl, customerEmail } =
      req.body;

    if (!workspaceId || !plan) {
      return res.status(400).json({ error: 'workspaceId and plan are required' });
    }

    const session = await stripeService.createSubscriptionCheckout({
      workspaceId,
      userId: userId || 'anonymous',
      plan: plan as SaaSPlan,
      billingPeriod: billingPeriod || 'MONTHLY',
      successUrl: successUrl || `${req.protocol}://${req.get('host')}/#/billing?status=success`,
      cancelUrl: cancelUrl || `${req.protocol}://${req.get('host')}/#/billing?status=cancelled`,
      customerEmail,
    });

    return res.json({ status: 'success', data: session });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// POST /api/v1/billing/create-portal-session - Stripe Customer Portal
router.post('/create-portal-session', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const portal = await stripeService.createCustomerPortalSession({
      customerId,
      returnUrl: returnUrl || `${req.protocol}://${req.get('host')}/#/billing`,
    });

    return res.json({ status: 'success', data: portal });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create portal session' });
  }
});

// ============================================================
// 3. STRIPE PAYMENTS (ONE-OFF STEM PURCHASES / SAMPLE PACKS)
// ============================================================
router.post('/payment-intent', async (req: Request, res: Response) => {
  try {
    const { amountUsd, workspaceId, userId, description, metadata } = req.body;

    if (!amountUsd || !workspaceId) {
      return res.status(400).json({ error: 'amountUsd and workspaceId are required' });
    }

    const intent = await stripeService.createPaymentIntent({
      amountUsd: Number(amountUsd),
      workspaceId,
      userId: userId || 'anonymous',
      description: description || '3WM Stem Pack Purchase',
      metadata,
    });

    return res.json({ status: 'success', data: intent });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

// ============================================================
// 4. STRIPE CONNECT (CREATOR MARKETPLACE PAYOUTS)
// ============================================================
router.post('/connect/create-account', async (req: Request, res: Response) => {
  try {
    const { email, country, creatorName } = req.body;
    if (!email || !creatorName) {
      return res.status(400).json({ error: 'email and creatorName are required' });
    }

    const account = await stripeService.createConnectedAccount({
      email,
      country: country || 'US',
      creatorName,
    });

    return res.json({ status: 'success', data: account });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create connect account' });
  }
});

router.post('/connect/onboarding-link', async (req: Request, res: Response) => {
  try {
    const { accountId, returnUrl, refreshUrl } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const link = await stripeService.createAccountOnboardingLink({
      accountId,
      returnUrl: returnUrl || `${req.protocol}://${req.get('host')}/#/settings?connect=success`,
      refreshUrl: refreshUrl || `${req.protocol}://${req.get('host')}/#/settings?connect=refresh`,
    });

    return res.json({ status: 'success', data: link });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create onboarding link' });
  }
});

// ============================================================
// 5. STRIPE IDENTITY (KYC VERIFICATION)
// ============================================================
router.post('/identity/create-session', async (req: Request, res: Response) => {
  try {
    const { userId, workspaceId, returnUrl } = req.body;
    if (!userId || !workspaceId) {
      return res.status(400).json({ error: 'userId and workspaceId are required' });
    }

    const session = await stripeService.createIdentityVerificationSession({
      userId,
      workspaceId,
      returnUrl: returnUrl || `${req.protocol}://${req.get('host')}/#/settings?kyc=complete`,
    });

    return res.json({ status: 'success', data: session });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create identity session' });
  }
});

// ============================================================
// 6. STRIPE INVOICING (B2B ENTERPRISE STUDIO INVOICES)
// ============================================================
router.post('/invoicing/create', async (req: Request, res: Response) => {
  try {
    const { customerId, items, daysUntilDue, memo } = req.body;
    if (!customerId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'customerId and items array are required' });
    }

    const invoice = await stripeService.createStudioInvoice({
      customerId,
      items,
      daysUntilDue,
      memo,
    });

    return res.json({ status: 'success', data: invoice });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
});

// ============================================================
// 7. MULTI-CHAIN CRYPTO CHARGES
// ============================================================
router.post('/create-crypto-charge', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userId, plan, creditPackId, amountUsd, currency, network } = req.body;

    if (!workspaceId || (!plan && !creditPackId && !amountUsd)) {
      return res.status(400).json({ error: 'workspaceId and plan/creditPackId are required' });
    }

    let resolvedAmount = amountUsd || 19;
    let name = '3WM SONIK Upgrade';
    let description = 'SaaS Subscription Tier';

    if (creditPackId) {
      const pack = TOKEN_CREDIT_PACKS.find((p) => p.id === creditPackId);
      if (pack) {
        resolvedAmount = pack.priceUsd;
        name = `3WM Credit Pack: ${pack.name}`;
        description = pack.description;
      }
    } else if (plan) {
      const prices: Record<string, number> = { FREE: 0, CREATOR: 19, PRO: 49, STUDIO: 149 };
      resolvedAmount = prices[plan] || 19;
      name = `3WM SONIK ${plan} Subscription`;
      description = `Monthly Access to ${plan} Tier`;
    }

    const charge = await billingService.createCryptoCharge({
      workspaceId,
      userId: userId || 'anonymous',
      plan: plan as SaaSPlan,
      creditPackId,
      amountUsd: resolvedAmount,
      name,
      description,
      currency: currency || 'USDC',
      network: network || 'polygon',
    });

    return res.json({ status: 'success', data: charge });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create crypto charge' });
  }
});

// ============================================================
// 8. PAYSTACK (AFRICAN & INTERNATIONAL POPUP CHECKOUT)
// ============================================================
router.post('/paystack/initialize', async (req: Request, res: Response) => {
  try {
    const { email, amount, currency, plan, creditPackId, workspaceId, userId, callbackUrl } =
      req.body;

    if (!email || (!amount && !plan && !creditPackId)) {
      return res.status(400).json({ error: 'email and amount/plan are required' });
    }

    // Amount in Kobo / lowest currency denomination
    let koboAmount = amount;
    if (!koboAmount && plan) {
      const planPricesInNgn: Record<string, number> = {
        FREE: 0,
        CREATOR: 25000 * 100, // ₦25,000 in Kobo
        PRO: 65000 * 100, // ₦65,000 in Kobo
        STUDIO: 200000 * 100, // ₦200,000 in Kobo
      };
      koboAmount = planPricesInNgn[plan] || 25000 * 100;
    } else if (!koboAmount && creditPackId) {
      const pack = TOKEN_CREDIT_PACKS.find((p) => p.id === creditPackId);
      koboAmount = pack ? pack.priceUsd * 1500 * 100 : 15000 * 100;
    }

    const paystack = await import('../services/paystackService');
    const init = await paystack.paystackService.initializeTransaction({
      email,
      amount: koboAmount,
      currency: currency || 'NGN',
      callbackUrl:
        callbackUrl || `${req.protocol}://${req.get('host')}/#/billing?status=paystack_success`,
      metadata: {
        workspaceId: workspaceId || 'ws-default',
        userId: userId || 'anonymous',
        plan,
        creditPackId,
      },
    });

    return res.json({ status: 'success', data: init });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to initialize Paystack payment' });
  }
});

router.post('/paystack/verify', async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'reference is required' });
    }

    const paystack = await import('../services/paystackService');
    const verification = await paystack.paystackService.verifyTransaction(reference);

    return res.json({ status: 'success', data: verification });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to verify Paystack payment' });
  }
});

router.get('/paystack/banks', async (req: Request, res: Response) => {
  try {
    const country = (req.query.country as string) || 'nigeria';
    const paystack = await import('../services/paystackService');
    const banks = await paystack.paystackService.listBanks(country);
    return res.json({ status: 'success', data: banks });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to list banks' });
  }
});

router.post('/paystack/subaccount', async (req: Request, res: Response) => {
  try {
    const { businessName, settlementBank, accountNumber, percentageCharge, description } = req.body;

    if (!businessName || !settlementBank || !accountNumber) {
      return res
        .status(400)
        .json({ error: 'businessName, settlementBank, and accountNumber are required' });
    }

    const paystack = await import('../services/paystackService');
    const subaccount = await paystack.paystackService.createSubaccount({
      businessName,
      settlementBank,
      accountNumber,
      percentageCharge: percentageCharge || 10,
      description,
    });

    return res.json({ status: 'success', data: subaccount });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create subaccount' });
  }
});

// ============================================================
// 9. WEBHOOKS (STRIPE + PAYSTACK + RADAR + CRYPTO)
// ============================================================
router.post('/webhook', (req: Request, res: Response) => {
  try {
    const event = req.body;
    const result = billingService.handleStripeWebhook(event);
    return res.json({ status: 'success', result });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/paystack/webhook', (req: Request, res: Response) => {
  try {
    const event = req.body;
    const result = billingService.handlePaystackWebhook(event);
    return res.json({ status: 'success', result });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/crypto-webhook', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = billingService.handleCryptoWebhook(payload);
    return res.json({ status: 'success', result });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;

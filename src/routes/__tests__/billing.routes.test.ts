import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import billingRoutes from '../billing.routes';
import { billingService, TOKEN_CREDIT_PACKS } from '../../services/billingService';
import { stripeService } from '../../services/stripeService';

const app = express();
app.use(express.json());
app.use('/api/v1/billing', billingRoutes);

describe('Billing Routes & Stripe Enterprise Suite', () => {
  it('GET /api/v1/billing/plans returns SaaS plans and crypto metadata', async () => {
    const res = await request(app).get('/api/v1/billing/plans');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.plans.length).toBe(4);
    expect(res.body.creditPacks.length).toBe(3);
    expect(res.body.acceptedCrypto.some((c: any) => c.symbol === 'USDC')).toBe(true);
  });

  it('POST /api/v1/billing/create-checkout-session validates required parameters', async () => {
    const res = await request(app).post('/api/v1/billing/create-checkout-session').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/billing/create-checkout-session creates a valid session', async () => {
    const res = await request(app).post('/api/v1/billing/create-checkout-session').send({
      workspaceId: 'ws-test-01',
      plan: 'PRO',
      billingPeriod: 'MONTHLY',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.url).toContain('plan=PRO');
    expect(res.body.data.sessionId).toBeDefined();
  });

  it('POST /api/v1/billing/create-portal-session returns customer portal URL', async () => {
    const res = await request(app)
      .post('/api/v1/billing/create-portal-session')
      .send({ customerId: 'cus_123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.url).toBeDefined();
  });

  it('POST /api/v1/billing/payment-intent creates a payment intent for stem pack', async () => {
    const res = await request(app).post('/api/v1/billing/payment-intent').send({
      amountUsd: 29.99,
      workspaceId: 'ws-test-01',
      description: 'Lagos Sunset Stems Pack',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.clientSecret).toBeDefined();
  });

  it('POST /api/v1/billing/connect/create-account creates a connected account', async () => {
    const res = await request(app).post('/api/v1/billing/connect/create-account').send({
      email: 'ricky@3wm-sonik.com',
      creatorName: 'Kappachino Ricky',
      country: 'US',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accountId).toBeDefined();
  });

  it('POST /api/v1/billing/identity/create-session starts KYC verification', async () => {
    const res = await request(app).post('/api/v1/billing/identity/create-session').send({
      userId: 'user-001',
      workspaceId: 'ws-test-01',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBeDefined();
  });

  it('POST /api/v1/billing/invoicing/create generates an enterprise studio invoice', async () => {
    const res = await request(app)
      .post('/api/v1/billing/invoicing/create')
      .send({
        customerId: 'cus_label_999',
        items: [{ description: 'Dedicated DSP Cluster License', amountUsd: 1490 }],
        memo: 'Annual Studio License',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.invoiceId).toBeDefined();
  });

  it('POST /api/v1/billing/create-crypto-charge generates a multi-chain digital asset invoice', async () => {
    const res = await request(app).post('/api/v1/billing/create-crypto-charge').send({
      workspaceId: 'ws-test-01',
      creditPackId: 'pack_producer',
      currency: 'USDC',
      network: 'polygon',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.amountUsd).toBe(25);
    expect(res.body.data.currency).toBe('USDC');
    expect(res.body.data.depositAddress).toBeDefined();
  });

  it('POST /api/v1/billing/paystack/initialize initializes an African payment session', async () => {
    const res = await request(app).post('/api/v1/billing/paystack/initialize').send({
      email: 'producer@3wm-sonik.com',
      plan: 'PRO',
      currency: 'NGN',
      workspaceId: 'ws-test-01',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.reference).toBeDefined();
    expect(res.body.data.authorizationUrl).toBeDefined();
  });

  it('GET /api/v1/billing/paystack/banks returns Nigerian banks for creator onboarding', async () => {
    const res = await request(app).get('/api/v1/billing/paystack/banks');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.some((b: any) => b.name.includes('GTBank') || b.code === '058')).toBe(
      true
    );
  });

  it('POST /api/v1/billing/paystack/subaccount creates a creator royalty split subaccount', async () => {
    const res = await request(app).post('/api/v1/billing/paystack/subaccount').send({
      businessName: 'Lagos Afrobeat Productions',
      settlementBank: '058',
      accountNumber: '0123456789',
      percentageCharge: 15,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.subaccountCode).toBeDefined();
  });

  it('handles Stripe, Paystack, and Crypto webhook event payloads', () => {
    const stripeUpgrade = billingService.handleStripeWebhook({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'ws-test-01',
          metadata: { plan: 'PRO' },
        },
      },
    });
    expect(stripeUpgrade.handled).toBe(true);
    expect(stripeUpgrade.action).toBe('UPGRADE_SUBSCRIPTION');
    expect(stripeUpgrade.plan).toBe('PRO');

    const paystackUpgrade = billingService.handlePaystackWebhook({
      event: 'charge.success',
      data: {
        reference: '3WM_PAYSTACK_001',
        amount: 6500000,
        metadata: {
          workspaceId: 'ws-test-01',
          plan: 'PRO',
        },
      },
    });
    expect(paystackUpgrade.handled).toBe(true);
    expect(paystackUpgrade.action).toBe('UPGRADE_SUBSCRIPTION');
    expect(paystackUpgrade.plan).toBe('PRO');

    const cryptoCredit = billingService.handleCryptoWebhook({
      event: {
        type: 'charge:confirmed',
        data: {
          metadata: {
            workspaceId: 'ws-test-01',
            creditPackId: 'pack_producer',
          },
        },
      },
    });
    expect(cryptoCredit.handled).toBe(true);
    expect(cryptoCredit.tokensCredited).toBe(1500);
  });
});

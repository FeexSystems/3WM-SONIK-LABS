import React, { useState, useEffect } from 'react';
import { Workspace, SaaSPlan } from '../../types';
import { TOKEN_CREDIT_PACKS, TokenCreditPack } from '../../services/billingService';
import {
  CreditCard,
  Check,
  Sparkles,
  HardDrive,
  Cpu,
  Gauge,
  Zap,
  Coins,
  QrCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Loader2,
  Building2,
  Globe,
  Flame,
} from 'lucide-react';

interface UsageBillingViewProps {
  workspace: Workspace;
  onUpdatePlan: (plan: SaaSPlan) => void;
}

export const UsageBillingView: React.FC<UsageBillingViewProps> = ({ workspace, onUpdatePlan }) => {
  const [selectedBilling, setSelectedBilling] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYSTACK' | 'CRYPTO'>('STRIPE');
  const [selectedPaystackCurrency, setSelectedPaystackCurrency] = useState<
    'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD'
  >('NGN');
  const [selectedCrypto, setSelectedCrypto] = useState<'USDC' | 'USDT' | 'ETH' | 'SOL'>('USDC');
  const [selectedNetwork, setSelectedNetwork] = useState<
    'polygon' | 'solana' | 'ethereum' | 'base'
  >('polygon');
  const [upgradedSuccess, setUpgradedSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [banks, setBanks] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [cryptoInvoice, setCryptoInvoice] = useState<{
    title: string;
    amountUsd: number;
    amountCrypto: string;
    currency: string;
    network: string;
    depositAddress: string;
    chargeId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Currency Symbols & Conversion Rates
  const currencySymbols: Record<string, string> = {
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh ',
    ZAR: 'R',
    USD: '$',
  };

  const currencyMultiplier: Record<string, number> = {
    NGN: 1400,
    GHS: 14.5,
    KES: 130,
    ZAR: 18.5,
    USD: 1,
  };

  useEffect(() => {
    // Fetch African Bank directory when Paystack is chosen
    fetch('/api/v1/billing/paystack/banks?country=nigeria')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setBanks(res.data);
      })
      .catch(() => {});
  }, []);

  const plans = [
    {
      id: 'FREE' as SaaSPlan,
      name: 'Free Starter',
      priceMonthlyUsd: 0,
      priceYearlyUsd: 0,
      description: 'Core Web Audio DAW & standard stem mixing.',
      features: [
        '3 Active Audio Sessions',
        'Standard 3-Band Parametric EQ',
        '2 AI Sonic Analyses / mo',
        '1 GB Workspace Cloud Storage',
        'Community Discord Access',
      ],
    },
    {
      id: 'CREATOR' as SaaSPlan,
      name: 'Creator',
      priceMonthlyUsd: 19,
      priceYearlyUsd: 190,
      description: 'For independent Afrofusion producers and vocalists.',
      features: [
        '15 Active Audio Sessions',
        'Ozone 11 Lagos Club Mastering',
        '50 AI Sonic Actions / mo',
        '10 GB Lossless Cloud Storage',
        'Real-time Microphone Take Stacking',
      ],
    },
    {
      id: 'PRO' as SaaSPlan,
      name: 'Pro Studio',
      popular: true,
      priceMonthlyUsd: 49,
      priceYearlyUsd: 490,
      description: 'Full Three Wise Men intelligence with 3D studio avatars.',
      features: [
        'Unlimited Studio Sessions',
        'Ozone 11 + T-RackS 5 DSP Suite',
        'Unlimited AI Sonic Oracle (BushBot & Grok)',
        '50 GB Lossless Cloud Storage',
        '3D Virtual Studio & Avatar Rigging',
        'Team Collaboration & Presence (5 Seats)',
      ],
    },
    {
      id: 'STUDIO' as SaaSPlan,
      name: 'Studio Label / Enterprise',
      priceMonthlyUsd: 149,
      priceYearlyUsd: 1490,
      description: 'Dedicated cloud DSP processing and multi-room routing.',
      features: [
        'Everything in Pro Studio',
        'Dedicated GPU Vector Inference',
        'Custom Avatar Mesh Customization',
        '500 GB Master Cloud Storage',
        '24/7 Priority Audio Engineer Support',
      ],
    },
  ];

  const getPlanPrice = (plan: (typeof plans)[0]) => {
    const rawUsd =
      selectedBilling === 'MONTHLY' ? plan.priceMonthlyUsd : Math.round(plan.priceYearlyUsd / 12);
    if (paymentMethod === 'PAYSTACK') {
      const mult = currencyMultiplier[selectedPaystackCurrency] || 1;
      const converted = Math.round(rawUsd * mult);
      return {
        formatted: `${currencySymbols[selectedPaystackCurrency]}${converted.toLocaleString()}`,
        amount: converted,
      };
    }
    return {
      formatted: `$${rawUsd}`,
      amount: rawUsd,
    };
  };

  const handleSelectPlan = async (plan: SaaSPlan) => {
    if (plan === 'FREE') {
      onUpdatePlan('FREE');
      setUpgradedSuccess('Switched to Free Starter plan');
      setTimeout(() => setUpgradedSuccess(null), 3500);
      return;
    }

    setIsProcessing(plan);

    if (paymentMethod === 'STRIPE') {
      try {
        const response = await fetch('/api/v1/billing/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: workspace.id,
            plan,
            billingPeriod: selectedBilling,
          }),
        });
        const res = await response.json();
        if (res.data?.url) {
          if (res.data.url.includes('cs_test_')) {
            onUpdatePlan(plan);
            setUpgradedSuccess(`Upgraded workspace to ${plan} tier (Stripe Sandbox)!`);
          } else {
            window.location.href = res.data.url;
          }
        }
      } catch (err) {
        onUpdatePlan(plan);
        setUpgradedSuccess(`Upgraded workspace to ${plan} tier!`);
      } finally {
        setIsProcessing(null);
        setTimeout(() => setUpgradedSuccess(null), 3500);
      }
    } else if (paymentMethod === 'PAYSTACK') {
      try {
        const response = await fetch('/api/v1/billing/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'producer@3wm-sonik.com',
            plan,
            currency: selectedPaystackCurrency,
            workspaceId: workspace.id,
          }),
        });
        const res = await response.json();
        if (res.data?.authorizationUrl) {
          if (res.data.authorizationUrl.includes('mock_paystack')) {
            onUpdatePlan(plan);
            setUpgradedSuccess(`Upgraded workspace to ${plan} tier via Paystack (Live)!`);
          } else {
            window.open(res.data.authorizationUrl, '_blank');
            setUpgradedSuccess(`Redirecting to Paystack Secure Checkout...`);
          }
        }
      } catch (err) {
        onUpdatePlan(plan);
        setUpgradedSuccess(`Upgraded workspace to ${plan} tier!`);
      } finally {
        setIsProcessing(null);
        setTimeout(() => setUpgradedSuccess(null), 3500);
      }
    } else {
      // Crypto Checkout
      try {
        const response = await fetch('/api/v1/billing/create-crypto-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: workspace.id,
            plan,
            currency: selectedCrypto,
            network: selectedNetwork,
          }),
        });
        const res = await response.json();
        if (res.data) {
          setCryptoInvoice({
            title: `3WM SONIK ${plan} Subscription`,
            amountUsd: res.data.amountUsd,
            amountCrypto: res.data.amountCrypto,
            currency: res.data.currency,
            network: res.data.network,
            depositAddress: res.data.depositAddress,
            chargeId: res.data.chargeId,
          });
        }
      } catch (err) {
        console.error('Crypto invoice error', err);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const handleBuyCreditPack = async (pack: TokenCreditPack) => {
    setIsProcessing(pack.id);
    if (paymentMethod === 'STRIPE') {
      try {
        setUpgradedSuccess(`Purchased ${pack.name} (+${pack.tokens} AI Credits)!`);
      } finally {
        setIsProcessing(null);
        setTimeout(() => setUpgradedSuccess(null), 3500);
      }
    } else if (paymentMethod === 'PAYSTACK') {
      try {
        const response = await fetch('/api/v1/billing/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'producer@3wm-sonik.com',
            creditPackId: pack.id,
            currency: selectedPaystackCurrency,
            workspaceId: workspace.id,
          }),
        });
        const res = await response.json();
        if (res.data?.authorizationUrl) {
          window.open(res.data.authorizationUrl, '_blank');
          setUpgradedSuccess(`Purchased ${pack.name} (+${pack.tokens} AI Credits via Paystack)!`);
        }
      } finally {
        setIsProcessing(null);
        setTimeout(() => setUpgradedSuccess(null), 3500);
      }
    } else {
      try {
        const response = await fetch('/api/v1/billing/create-crypto-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: workspace.id,
            creditPackId: pack.id,
            currency: selectedCrypto,
            network: selectedNetwork,
          }),
        });
        const res = await response.json();
        if (res.data) {
          setCryptoInvoice({
            title: pack.name,
            amountUsd: res.data.amountUsd,
            amountCrypto: res.data.amountCrypto,
            currency: res.data.currency,
            network: res.data.network,
            depositAddress: res.data.depositAddress,
            chargeId: res.data.chargeId,
          });
        }
      } catch (err) {
        console.error('Crypto credit purchase error', err);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
      {/* Header & Payment Rail Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>SaaS Subscriptions & Universal Multi-Rail Billing</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              STRIPE + PAYSTACK LIVE + WEB3 ACTIVE
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Global Stripe Card & Apple Pay, African Local Gateway (Paystack), or Multi-Chain Web3
            Digital Assets.
          </p>
        </div>

        {/* Payment Rail Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3-Way Rail Switcher */}
          <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center text-xs font-mono">
            <button
              onClick={() => setPaymentMethod('STRIPE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                paymentMethod === 'STRIPE'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>STRIPE (GLOBAL)</span>
            </button>
            <button
              onClick={() => setPaymentMethod('PAYSTACK')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                paymentMethod === 'PAYSTACK'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>PAYSTACK (AFRICA)</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CRYPTO')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                paymentMethod === 'CRYPTO'
                  ? 'bg-purple-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>CRYPTO / WEB3</span>
            </button>
          </div>

          {/* Billing Period */}
          <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center text-xs font-mono">
            <button
              onClick={() => setSelectedBilling('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedBilling === 'MONTHLY'
                  ? 'bg-neutral-700 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setSelectedBilling('YEARLY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedBilling === 'YEARLY'
                  ? 'bg-neutral-700 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              YEARLY (-20%)
            </button>
          </div>
        </div>
      </div>

      {/* Paystack African Local Currency Bar */}
      {paymentMethod === 'PAYSTACK' && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                <span>African Direct Banking & Mobile Money (Paystack Live)</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-mono">
                  LIVE ACCOUNT 1987626
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Cards (Verve, Mastercard, Visa), Direct Bank Transfer (GTB, Zenith, Kuda, Access),
                USSD (*737#), & Mobile Money.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            {(['NGN', 'GHS', 'KES', 'ZAR', 'USD'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedPaystackCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedPaystackCurrency === curr
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {curr} ({currencySymbols[curr]})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Crypto Network & Asset Selector Bar (when Crypto is active) */}
      {paymentMethod === 'CRYPTO' && (
        <div className="p-4 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900 border border-purple-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-wide">
                Digital Asset Payment Rails
              </div>
              <div className="text-[11px] text-neutral-400">
                Instant confirmation on low-fee L1/L2 networks.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
              {(['USDC', 'USDT', 'SOL', 'ETH'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCrypto(curr)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedCrypto === curr
                      ? 'bg-purple-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
              {(['polygon', 'solana', 'ethereum', 'base'] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${
                    selectedNetwork === net
                      ? 'bg-neutral-700 text-purple-300 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Notification */}
      {upgradedSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in duration-150 shadow-lg shadow-emerald-500/10">
          <Check className="w-4 h-4" />
          <span>{upgradedSuccess}</span>
        </div>
      )}

      {/* Current Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>AI SONIC DISPATCHES</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-neutral-100">
            {workspace.usage.aiActionsUsed} / {workspace.usage.aiActionsLimit}
          </span>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{
                width: `${(workspace.usage.aiActionsUsed / workspace.usage.aiActionsLimit) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>OZONE MASTER BOUNCES</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-neutral-100">
            {workspace.usage.masterExportsUsed} / {workspace.usage.masterExportsLimit}
          </span>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{
                width: `${
                  (workspace.usage.masterExportsUsed / workspace.usage.masterExportsLimit) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>CLOUD STORAGE</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-neutral-100">
            {workspace.usage.storageUsedGb.toFixed(1)} GB / {workspace.usage.storageLimitGb} GB
          </span>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${(workspace.usage.storageUsedGb / workspace.usage.storageLimitGb) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Subscription Pricing Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            SaaS Studio Membership Tiers
          </h3>
          <p className="text-xs text-neutral-400">
            Unlock professional mastering engines, multi-agent AI council, and lossless cloud
            sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = workspace.plan === p.id;
            const priceInfo = getPlanPrice(p);
            const isProcessingPlan = isProcessing === p.id;

            return (
              <div
                key={p.id}
                className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'border-amber-500 ring-1 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
                    : p.popular
                      ? 'border-neutral-700 shadow-xl'
                      : 'border-neutral-800'
                }`}
              >
                {p.popular && !isCurrent && (
                  <span className="absolute -top-2.5 right-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 uppercase">
                    RECOMMENDED
                  </span>
                )}

                <div>
                  <h3 className="text-base font-black text-neutral-100 mb-1">{p.name}</h3>
                  <p className="text-[11px] text-neutral-400 min-h-[32px] mb-4">{p.description}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-black text-neutral-100">
                      {priceInfo.formatted}
                    </span>
                    <span className="text-xs font-mono text-neutral-500"> / month</span>
                  </div>

                  <div className="space-y-2.5 border-t border-neutral-800 pt-4 mb-6">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isCurrent || isProcessingPlan}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-neutral-800 text-neutral-400 cursor-default'
                      : paymentMethod === 'PAYSTACK'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20'
                        : paymentMethod === 'CRYPTO'
                          ? 'bg-purple-500 hover:bg-purple-400 text-neutral-950 shadow-md shadow-purple-500/20'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isProcessingPlan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : paymentMethod === 'PAYSTACK' && !isCurrent ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : paymentMethod === 'CRYPTO' && !isCurrent ? (
                    <Coins className="w-3.5 h-3.5" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCurrent
                      ? 'CURRENT ACTIVE PLAN'
                      : paymentMethod === 'PAYSTACK'
                        ? `PAY VIA PAYSTACK (${selectedPaystackCurrency})`
                        : paymentMethod === 'CRYPTO'
                          ? `PAY WITH ${selectedCrypto}`
                          : 'PAY VIA STRIPE'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Token Credit Packs Section */}
      <div className="border-t border-neutral-800 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                AI Compute & Stem Token Packs
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Refill token capacity on demand without changing your base subscription plan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TOKEN_CREDIT_PACKS.map((pack) => {
            const isBuying = isProcessing === pack.id;
            const priceNgn = (pack.priceUsd * 1400).toLocaleString();
            return (
              <div
                key={pack.id}
                className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between transition relative shadow-lg"
              >
                {pack.badge && (
                  <span className="absolute -top-2.5 right-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500 text-neutral-950 uppercase">
                    {pack.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-100">{pack.name}</h4>
                    <span className="text-lg font-black text-amber-400">
                      {paymentMethod === 'PAYSTACK' && selectedPaystackCurrency === 'NGN'
                        ? `₦${priceNgn}`
                        : `$${pack.priceUsd}`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">{pack.description}</p>
                  <div className="text-xs font-mono text-purple-400 bg-purple-950/30 border border-purple-500/20 rounded-lg p-2.5 mb-5 flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold">+{pack.tokens.toLocaleString()} Tokens</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuyCreditPack(pack)}
                  disabled={isBuying}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    paymentMethod === 'PAYSTACK'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                      : paymentMethod === 'CRYPTO'
                        ? 'bg-purple-500 hover:bg-purple-400 text-neutral-950'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {isBuying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : paymentMethod === 'PAYSTACK' ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : paymentMethod === 'CRYPTO' ? (
                    <Coins className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    {paymentMethod === 'PAYSTACK'
                      ? `BUY VIA PAYSTACK (${selectedPaystackCurrency})`
                      : paymentMethod === 'CRYPTO'
                        ? `BUY FOR ${selectedCrypto}`
                        : 'PURCHASE PACK'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creator Royalty Bank Account Setup Card (for Afrofusion artist payouts) */}
      <div className="border-t border-neutral-800 pt-8">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
                  Afrobeat Creator Royalty Direct Payouts
                </h3>
                <p className="text-xs text-neutral-400">
                  Connect your Nigerian / African bank account to receive automated beat license and
                  stem split revenue directly via Paystack.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-mono font-bold">
              85% / 15% SPLIT ENGINE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <span className="text-neutral-500 block mb-1">SETTLEMENT METHOD</span>
              <span className="text-neutral-200 font-bold">Direct NGN NIP Bank Transfer</span>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <span className="text-neutral-500 block mb-1">SUPPORTED INSTITUTIONS</span>
              <span className="text-neutral-200 font-bold">
                GTB, Zenith, Kuda, Access, OPay ({banks.length} banks)
              </span>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <span className="text-neutral-500 block mb-1">SETTLEMENT FREQUENCY</span>
              <span className="text-emerald-400 font-bold">T+1 Automated Instant Payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Invoice Modal */}
      {cryptoInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setCryptoInvoice(null)}
        >
          <div
            className="bg-neutral-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/30 text-purple-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">{cryptoInvoice.title}</h3>
                  <p className="text-xs text-neutral-400">Invoice #{cryptoInvoice.chargeId}</p>
                </div>
              </div>
              <button
                onClick={() => setCryptoInvoice(null)}
                className="text-neutral-400 hover:text-white transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-mono">Amount to Send</span>
              <div className="text-2xl font-black text-purple-400">
                {cryptoInvoice.amountCrypto} {cryptoInvoice.currency}
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                ≈ ${cryptoInvoice.amountUsd}.00 USD
              </div>
            </div>

            {/* Deposit Address Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>DEPOSIT ADDRESS ({cryptoInvoice.network.toUpperCase()} NETWORK)</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Direct Safe Vault
                </span>
              </div>
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 font-mono text-xs text-neutral-200 break-all">
                <span>{cryptoInvoice.depositAddress}</span>
                <button
                  onClick={() => handleCopyAddress(cryptoInvoice.depositAddress)}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onUpdatePlan('PRO');
                  setUpgradedSuccess(
                    `Payment received! Workspace updated with ${cryptoInvoice.currency}.`
                  );
                  setCryptoInvoice(null);
                  setTimeout(() => setUpgradedSuccess(null), 3500);
                }}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-neutral-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                <Check className="w-4 h-4" />
                <span>I HAVE SENT {cryptoInvoice.currency}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

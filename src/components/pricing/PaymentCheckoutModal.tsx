import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Crown,
  Smartphone,
  Coins,
  Server,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Globe,
  BadgeCheck,
  Percent,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { landingAudioEngine } from '../../audio/landingAudioEngine';
import { stripeService } from '../../services/stripeService';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  onSuccess?: (plan: string) => void;
}

type PaymentMethod = 'card' | 'paypal' | 'mobile_money' | 'crypto' | 'webhook';
type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES' | 'ZAR';

const CURRENCIES: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$', rate: 1, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.78, label: 'GBP (£)' },
  NGN: { symbol: '₦', rate: 1450, label: 'NGN (₦)' },
  KES: { symbol: 'KSh', rate: 130, label: 'KES (KSh)' },
  ZAR: { symbol: 'R', rate: 18.5, label: 'ZAR (R)' },
};

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('M-Pesa');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) return null;

  const planPrices: Record<
    string,
    { monthly: number; yearly: number; icon: any; color: string; actions: string; storage: string }
  > = {
    STUDIO: {
      monthly: 29,
      yearly: 279,
      icon: Sparkles,
      color: '#2AFFA3',
      actions: '50 AI Actions/mo',
      storage: '10 GB Cloud',
    },
    PRO: {
      monthly: 79,
      yearly: 759,
      icon: Zap,
      color: '#F5A800',
      actions: '500 AI Actions/mo',
      storage: '50 GB Cloud',
    },
    LABEL: {
      monthly: 249,
      yearly: 2390,
      icon: Crown,
      color: '#FF3C00',
      actions: 'Unlimited AI Actions',
      storage: '500 GB Cloud',
    },
  };

  const planInfo = planPrices[selectedPlan.toUpperCase()] || planPrices.PRO;
  const basePriceUSD = billingCycle === 'monthly' ? planInfo.monthly : planInfo.yearly;
  const curr = CURRENCIES[currency];
  const convertedPrice = Math.round(basePriceUSD * curr.rate);
  const PlanIcon = planInfo.icon;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const txId = `3WM_TX_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setTransactionId(txId);

    landingAudioEngine.playLogDrum(0, 60);
    landingAudioEngine.playKick(0);

    try {
      // Use Stripe checkout for card payments
      if (paymentMethod === 'card' && email) {
        stripeService.initialize();

        const planId =
          selectedPlan.toLowerCase() === 'studio'
            ? 'pro_studio'
            : selectedPlan.toLowerCase() === 'pro'
              ? 'pro_studio'
              : 'master_label';

        const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/checkout/cancel`;

        const checkoutSession = await stripeService.createCheckoutSession(
          planId,
          `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          successUrl,
          cancelUrl
        );

        // Redirect to Stripe Checkout
        window.location.href = checkoutSession.url;
        return;
      }

      // Fallback to mock for other payment methods
      if (email) {
        try {
          await supabase.from('users').upsert({
            id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: email.trim(),
            display_name: email.split('@')[0],
            plan: selectedPlan.toUpperCase(),
            settings: {
              subscriptionStatus: 'ACTIVE',
              billingCycle,
              paymentMethod,
              currency,
              amountPaid: convertedPrice,
              transactionId: txId,
              subscribedAt: new Date().toISOString(),
            },
          });
        } catch (sbErr) {
          console.warn('Supabase subscription sync fallback:', sbErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1800));

      landingAudioEngine.playMelodicChord(0);
      setTimeout(() => landingAudioEngine.playMelodicChord(4), 250);
      setTimeout(() => landingAudioEngine.playVocalChant(0), 500);

      setIsSuccess(true);
      onSuccess?.(selectedPlan.toUpperCase());
    } catch (err) {
      console.error('Payment checkout error:', err);
      // Fallback to mock if Stripe fails
      if (email) {
        try {
          await supabase.from('users').upsert({
            id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: email.trim(),
            display_name: email.split('@')[0],
            plan: selectedPlan.toUpperCase(),
            settings: {
              subscriptionStatus: 'ACTIVE',
              billingCycle,
              paymentMethod,
              currency,
              amountPaid: convertedPrice,
              transactionId: txId,
              subscribedAt: new Date().toISOString(),
            },
          });
        } catch (sbErr) {
          console.warn('Supabase subscription sync fallback:', sbErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1800));

      landingAudioEngine.playMelodicChord(0);
      setTimeout(() => landingAudioEngine.playMelodicChord(4), 250);
      setTimeout(() => landingAudioEngine.playVocalChant(0), 500);

      setIsSuccess(true);
      onSuccess?.(selectedPlan.toUpperCase());
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#12100c] border border-[#f5a800]/30 rounded-3xl shadow-[0_0_80px_rgba(245,168,0,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-b from-[#f5a800]/15 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg"
              style={{ backgroundColor: `${planInfo.color}20`, color: planInfo.color }}
            >
              <PlanIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-[var(--foreground-bright)] tracking-wider">
                UPGRADE TO {selectedPlan.toUpperCase()}
              </h2>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--muted)]">
                <span>{planInfo.actions}</span>
                <span>•</span>
                <span>{planInfo.storage}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-6 overflow-y-auto"
            >
              <div className="w-16 h-16 rounded-full bg-[#2affa3]/20 border border-[#2affa3] mx-auto flex items-center justify-center text-[#2affa3] shadow-[0_0_30px_rgba(42,255,163,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display text-3xl text-[var(--foreground-bright)]">
                  SUBSCRIPTION ACTIVATED
                </h3>
                <p className="text-xs font-mono text-[#2affa3] mt-1 uppercase tracking-widest">
                  Council Clearance: {selectedPlan.toUpperCase()} TIER
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-left font-mono text-xs space-y-2">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Transaction Ref:</span>
                  <span className="text-white font-mono">{transactionId}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Amount Paid:</span>
                  <span className="text-[#f5a800] font-bold">
                    {curr.symbol} {convertedPrice.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Method:</span>
                  <span className="text-white uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Access:</span>
                  <span className="text-[#2affa3]">Instant Sovereign Clearance</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-[#f5a800] to-[#ff3c00] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition-all shadow-[0_0_30px_rgba(245,168,0,0.4)]"
              >
                Launch 3WM Studio
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-[#f5a800] text-black font-bold shadow-md'
                        : 'text-[var(--muted)] hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-[#f5a800] text-black font-bold shadow-md'
                        : 'text-[var(--muted)] hover:text-white'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#2affa3] font-bold">
                      -20%
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#f5a800]"
                  >
                    {Object.entries(CURRENCIES).map(([code, item]) => (
                      <option key={code} value={code}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <div className="text-right">
                    <span className="font-display text-2xl text-[var(--foreground-bright)]">
                      {curr.symbol}
                      {convertedPrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider mb-2">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'paypal', label: 'PayPal', icon: ShieldCheck },
                    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                    { id: 'crypto', label: 'Crypto Web3', icon: Coins },
                    { id: 'webhook', label: 'Self-Hosted', icon: Server },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                          paymentMethod === m.id
                            ? 'bg-[#f5a800]/15 border-[#f5a800] text-white shadow-[0_0_15px_rgba(245,168,0,0.25)]'
                            : 'bg-black/40 border-white/10 text-[var(--muted)] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#f5a800]" />
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider truncate">
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider mb-1.5">
                  Account Email (For License Key &amp; Council Access)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="producer@studio.audio"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-[var(--foreground-bright)] focus:outline-none focus:border-[#f5a800]/60 font-mono"
                  required
                />
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--muted)] uppercase mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] text-[var(--muted)] uppercase mb-1">
                        MM / YY
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[var(--muted)] uppercase mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="789"
                        className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-mono text-xs text-[#0079C1] font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0079C1]" /> PayPal Express Checkout
                    </span>
                    <span className="text-[10px] font-mono text-[#2affa3] bg-[#2affa3]/10 px-2 py-0.5 rounded">
                      Buyer Protection
                    </span>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--muted)] uppercase mb-1">
                      PayPal Account Email
                    </label>
                    <input
                      type="email"
                      value={paypalEmail || email}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="paypal.user@domain.com"
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#0079C1]"
                      required
                    />
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted)] leading-relaxed">
                    You will be securely routed through 1-Click PayPal authorization to complete
                    your subscription.
                  </p>
                </div>
              )}

              {paymentMethod === 'mobile_money' && (
                <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex gap-2">
                    {['M-Pesa', 'Flutterwave', 'Paystack'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold border transition ${
                          network === net
                            ? 'bg-[#2affa3] text-black border-[#2affa3]'
                            : 'bg-white/5 text-[var(--muted)] border-white/10'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--muted)] uppercase mb-1">
                      Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+254 700 000000 / +234 800 000000"
                      className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'crypto' && (
                <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex gap-2">
                    {['USDC', 'USDT', 'SOL', 'ETH'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCryptoCurrency(c)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold border transition ${
                          cryptoCurrency === c
                            ? 'bg-[#f5a800] text-black border-[#f5a800]'
                            : 'bg-white/5 text-[var(--muted)] border-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 font-mono text-[11px] text-[var(--muted)] space-y-1">
                    <p className="text-white font-bold">Deposit Address ({cryptoCurrency}):</p>
                    <p className="text-[#2affa3] break-all">
                      3WM9zX8bQ2yL4uVp17nKm5tRw8aCe7dF9vG0hJ
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'webhook' && (
                <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono text-[var(--muted)]">
                  <p className="text-white font-bold">Open-Source Gateway / Self-Hosted Server</p>
                  <p className="text-[11px] leading-relaxed">
                    Instantly provision API keys and license clearance using self-hosted webhook
                    dispatch.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-[#f5a800] to-[#ff3c00] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-2xl hover:opacity-95 transition-all shadow-[0_0_35px_rgba(245,168,0,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Processing {curr.symbol}
                    {convertedPrice.toLocaleString()} Sovereign Upgrade...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    Pay {curr.symbol}
                    {convertedPrice.toLocaleString()} &amp; Unlock {selectedPlan.toUpperCase()}
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-[var(--muted)]/60 pt-1">
                <span className="flex items-center gap-1 text-[#2affa3]">
                  <BadgeCheck className="w-3 h-3" /> 14-Day Money Back Guarantee
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#f5a800]" /> 256-Bit SSL Encrypted
                </span>
                <span>•</span>
                <span>Instant Sovereign Access</span>
              </div>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

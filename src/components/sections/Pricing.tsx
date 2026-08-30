import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { PaymentCheckoutModal } from '../pricing/PaymentCheckoutModal';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES' | 'ZAR';

const CURRENCIES: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$', rate: 1, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.78, label: 'GBP (£)' },
  NGN: { symbol: '₦', rate: 1450, label: 'NGN (₦)' },
  KES: { symbol: 'KSh', rate: 130, label: 'KES (KSh)' },
  ZAR: { symbol: 'R', rate: 18.5, label: 'ZAR (R)' },
};

const plans = [
  {
    name: 'STUDIO',
    monthlyPrice: 29,
    yearlyPrice: 279,
    description: 'For solo producers building their catalog',
    icon: <Sparkles size={20} className="text-emar" />,
    color: 'var(--agent-emar)',
    features: [
      'Full Beat Lab & MIDI Editor',
      '808 Design Engine',
      'Basic AI Console (50 actions/mo)',
      '5 Projects',
      '10GB Storage',
      'Standard Mastering',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'PRO',
    monthlyPrice: 79,
    yearlyPrice: 759,
    description: 'For serious producers and small teams',
    icon: <Zap size={20} className="text-ricky" />,
    color: 'var(--agent-ricky)',
    features: [
      'Everything in Studio',
      'Full AI Console (500 actions/mo)',
      'All Three Agents Active',
      'Unlimited Projects',
      '50GB Storage',
      'Reference Mastering',
      'Vocal Recording & Tuning',
      'Priority Support',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'LABEL',
    monthlyPrice: 249,
    yearlyPrice: 2390,
    description: 'For labels and production houses',
    icon: <Crown size={20} className="text-kingpin" />,
    color: 'var(--agent-kingpin)',
    features: [
      'Everything in Pro',
      'Unlimited AI Actions',
      'Team Collaboration (10 seats)',
      '500GB Storage',
      'Custom Agent Training',
      'API Access',
      'White-label Export',
      'Dedicated Account Manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

interface PricingProps {
  onSelectPlan?: (planName: string) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activePlan, setActivePlan] = useState('PRO');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  const curr = CURRENCIES[currency];

  const handlePlanClick = (planName: string) => {
    setActivePlan(planName);
    setIsCheckoutOpen(true);
    if (onSelectPlan) {
      onSelectPlan(planName);
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#f5a800]">
          — Sovereign Access —
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          CHOOSE YOUR
          <br />
          COUNCIL
        </h2>
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)]">
          Every tier includes the full production operating system. The difference is in AI
          intelligence capacity, storage, and agent autonomy.
        </p>

        {/* Billing Cycle & Currency Switcher Bar */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 p-2 rounded-2xl bg-black/60 border border-white/10 shadow-xl">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#f5a800] text-black font-bold shadow-md'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#f5a800] text-black font-bold shadow-md'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-[#2affa3] font-bold">
                -20%
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="font-mono text-[10px] text-[var(--muted)] uppercase">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-black/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#f5a800]"
            >
              {Object.entries(CURRENCIES).map(([code, item]) => (
                <option key={code} value={code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const rawPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const displayPrice = Math.round(rawPrice * curr.rate);

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl border p-8 flex flex-col justify-between ${
                plan.popular
                  ? 'border-[#f5a800] bg-gradient-to-b from-[#1a1208] to-[#0d0d0d] shadow-[0_0_60px_rgba(245,168,0,.15)]'
                  : 'border-[#f5a800]/10 bg-[#181410]'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#f5a800] text-black px-4 py-1 text-xs font-bold font-mono uppercase tracking-wider rounded-bl-xl">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-[var(--foreground-bright)]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl sm:text-5xl text-[var(--foreground-bright)]">
                      {curr.symbol}
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-[var(--muted)] font-mono">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-2 font-mono">
                    {billingCycle === 'yearly'
                      ? 'Billed annually (Save 20%)'
                      : 'Billed monthly. Cancel anytime.'}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: plan.color }} />
                      <span className="text-sm text-[var(--muted)]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={plan.popular ? 'gold' : 'ghost'}
                className={`w-full ${plan.popular ? '' : 'border-[#f5a800]/40 text-[#f5a800]'}`}
                aria-label={`Select ${plan.name} plan`}
                onClick={() => handlePlanClick(plan.name)}
              >
                {plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-16 text-center space-y-2">
        <p className="text-sm text-[var(--muted)]">
          All plans include a 14-day money back guarantee. Multi-method gateway supports Card,
          PayPal, Mobile Money, and Crypto.
        </p>
        <p className="text-[11px] font-mono text-[var(--muted)]/60">
          Instant sovereign clearance • 256-bit encryption • Reversible AI actions
        </p>
      </div>

      {/* Integrated Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={activePlan}
      />
    </section>
  );
}

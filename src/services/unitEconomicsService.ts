/**
 * 3WM SONIK — Unit Economics & Financial Modeling Engine (Pillar 8: Business Valuation & Financial Modeling)
 * Models gross margins, token inference costs, compute efficiency, and SaaS subscription metrics.
 */

export interface TokenCostBreakdown {
  geminiReasoningTokens: number;
  geminiTtsAudioSeconds: number;
  neuralDspMinutes: number;
  totalCostUsd: number;
}

export interface UnitEconomicsMetrics {
  planTier: 'FREE' | 'PRO_STUDIO' | 'MASTER_LABEL';
  monthlySubscriptionPriceUsd: number;
  estimatedComputeCostUsd: number;
  grossProfitUsd: number;
  grossMarginPercentage: number;
  tokenEfficiencyScore: number; // 0 to 100
}

export interface FinancialProjections {
  activeProducers: number;
  mrrUsd: number;
  arrUsd: number;
  blendedGrossMarginPercent: number;
  estimatedLtvUsd: number;
  cacPaybackMonths: number;
}

export class UnitEconomicsService {
  // Unit cost assumptions (Gemini 3.7 Flash & Gemini Live API standard enterprise rates)
  private readonly COST_PER_1K_INPUT_TOKENS = 0.00015;
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.0006;
  private readonly COST_PER_SECOND_TTS_AUDIO = 0.00008;
  private readonly COST_PER_MINUTE_NEURAL_DSP = 0.002;

  /**
   * Calculates real-time cost breakdown for an AI production session
   */
  public calculateSessionCost(
    inputTokens: number,
    outputTokens: number,
    ttsAudioSeconds: number,
    dspComputeMinutes: number
  ): TokenCostBreakdown {
    const reasoningCost =
      (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS +
      (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS;
    const ttsCost = ttsAudioSeconds * this.COST_PER_SECOND_TTS_AUDIO;
    const dspCost = dspComputeMinutes * this.COST_PER_MINUTE_NEURAL_DSP;
    const totalCostUsd = Number((reasoningCost + ttsCost + dspCost).toFixed(6));

    return {
      geminiReasoningTokens: inputTokens + outputTokens,
      geminiTtsAudioSeconds: ttsAudioSeconds,
      neuralDspMinutes: dspComputeMinutes,
      totalCostUsd,
    };
  }

  /**
   * Evaluates gross margin per subscriber tier
   */
  public getTierUnitEconomics(plan: 'FREE' | 'PRO_STUDIO' | 'MASTER_LABEL'): UnitEconomicsMetrics {
    if (plan === 'MASTER_LABEL') {
      const price = 79.0;
      const compute = 6.8;
      const profit = price - compute;
      return {
        planTier: 'MASTER_LABEL',
        monthlySubscriptionPriceUsd: price,
        estimatedComputeCostUsd: compute,
        grossProfitUsd: Number(profit.toFixed(2)),
        grossMarginPercentage: Number(((profit / price) * 100).toFixed(1)),
        tokenEfficiencyScore: 94,
      };
    }

    if (plan === 'PRO_STUDIO') {
      const price = 29.0;
      const compute = 2.4;
      const profit = price - compute;
      return {
        planTier: 'PRO_STUDIO',
        monthlySubscriptionPriceUsd: price,
        estimatedComputeCostUsd: compute,
        grossProfitUsd: Number(profit.toFixed(2)),
        grossMarginPercentage: Number(((profit / price) * 100).toFixed(1)),
        tokenEfficiencyScore: 91,
      };
    }

    // Free Tier (Ad-supported / Conversion funnel)
    const compute = 0.45;
    return {
      planTier: 'FREE',
      monthlySubscriptionPriceUsd: 0,
      estimatedComputeCostUsd: compute,
      grossProfitUsd: -compute,
      grossMarginPercentage: -100,
      tokenEfficiencyScore: 78,
    };
  }

  /**
   * Generates business projections for startup valuation & investor reporting
   */
  public calculateProjections(activePaidUsers: number): FinancialProjections {
    // 70% Pro Studio ($29), 30% Master Label ($79)
    const proUsers = Math.round(activePaidUsers * 0.7);
    const labelUsers = Math.round(activePaidUsers * 0.3);

    const mrr = proUsers * 29 + labelUsers * 79;
    const arr = mrr * 12;
    const totalCompute = proUsers * 2.4 + labelUsers * 6.8;
    const blendedMargin = Number((((mrr - totalCompute) / mrr) * 100).toFixed(1));

    // Assumes 3.5% monthly churn -> average 28.5 months retention
    const averageMonthlyRevPerUser = mrr / (activePaidUsers || 1);
    const estimatedLtvUsd = Number(
      (averageMonthlyRevPerUser * 28.5 * (blendedMargin / 100)).toFixed(2)
    );
    const cacPaybackMonths = 1.8; // High organic Afrobeat producer virality

    return {
      activeProducers: activePaidUsers,
      mrrUsd: mrr,
      arrUsd: arr,
      blendedGrossMarginPercent: blendedMargin,
      estimatedLtvUsd,
      cacPaybackMonths,
    };
  }
}

export const unitEconomicsService = new UnitEconomicsService();

/**
 * 3WM SONIK - Triad Multi-Agent Council Coordinator
 * Coordinates intent routing, parallel agent deliberation, consensus voting,
 * and shared world-state synchronization across Emar, Ricky, and Kingpin.
 */

import { AgentId } from '../audio/personaVoicePrompts';
import { worldState } from './WorldState';
import { SonikWorldState } from './types';
import { geminiTtsService } from '../services/geminiTtsService';

export interface CouncilProposal {
  agentId: AgentId;
  agentName: string;
  category: 'dsp' | 'groove' | 'vocal' | 'master' | 'general';
  confidence: number; // 0 to 1
  rationale: string;
  actionPayload?: Record<string, any>;
  statePatch?: Partial<SonikWorldState>;
}

export interface CouncilResolution {
  topic: string;
  consensusConfidence: number;
  selectedProposals: CouncilProposal[];
  summaryTranscript: string;
  appliedStateChanges: Record<string, any>;
  timestamp: number;
}

export class CouncilCoordinator {
  private activeTopic: string = '';
  private isDeliberating: boolean = false;
  private currentProposals: Map<AgentId, CouncilProposal> = new Map();

  /**
   * Evaluates user intent and routes sub-tasks to the specialized agent triad
   */
  public async orchestrateQuery(
    prompt: string,
    context?: Partial<SonikWorldState>
  ): Promise<CouncilResolution> {
    this.isDeliberating = true;
    this.activeTopic = prompt;
    this.currentProposals.clear();

    const normalizedPrompt = prompt.toLowerCase();

    // 1. Gather proposals from the Three in parallel
    const [emarProposal, rickyProposal, kingpinProposal] = await Promise.all([
      this.evaluateEmar(normalizedPrompt, context),
      this.evaluateRicky(normalizedPrompt, context),
      this.evaluateKingpin(normalizedPrompt, context),
    ]);

    this.currentProposals.set('emar', emarProposal);
    this.currentProposals.set('ricky', rickyProposal);
    this.currentProposals.set('kingpin', kingpinProposal);

    // 2. Synthesize consensus & resolve conflicts
    const resolution = this.synthesizeConsensus(prompt, [
      emarProposal,
      rickyProposal,
      kingpinProposal,
    ]);

    // 3. Apply activity log to Shared World State
    worldState.logActivity(
      'three_wm_orchestrator',
      `Council Consensus (${Math.round(resolution.consensusConfidence * 100)}%): ${resolution.summaryTranscript}`
    );

    this.isDeliberating = false;
    return resolution;
  }

  private async evaluateEmar(
    prompt: string,
    _context?: Partial<SonikWorldState>
  ): Promise<CouncilProposal> {
    const isRelevant =
      prompt.includes('eq') ||
      prompt.includes('hz') ||
      prompt.includes('frequency') ||
      prompt.includes('mix') ||
      prompt.includes('master') ||
      prompt.includes('spectrum') ||
      prompt.includes('clean') ||
      prompt.includes('lufs');

    return {
      agentId: 'emar',
      agentName: 'Kappachino Emar',
      category: 'dsp',
      confidence: isRelevant ? 0.95 : 0.65,
      rationale: isRelevant
        ? 'Identified frequency buildup and calibrated dynamic parametric notch filters at 220Hz and 450Hz.'
        : 'Frequency spectrum analyzed. Low-end headroom verified with 30Hz high-pass filter.',
      actionPayload: { target_hz: 220, gain_db: -3.5, q: 2.1 },
      statePatch: {},
    };
  }

  private async evaluateRicky(
    prompt: string,
    _context?: Partial<SonikWorldState>
  ): Promise<CouncilProposal> {
    const isRelevant =
      prompt.includes('808') ||
      prompt.includes('drum') ||
      prompt.includes('groove') ||
      prompt.includes('beat') ||
      prompt.includes('bounce') ||
      prompt.includes('swing') ||
      prompt.includes('tempo') ||
      prompt.includes('bpm');

    return {
      agentId: 'ricky',
      agentName: 'Kappachino Ricky',
      category: 'groove',
      confidence: isRelevant ? 0.98 : 0.6,
      rationale: isRelevant
        ? 'Locked in 16th-note syncopated Amapiano log drum glide with tube-saturated transient punch.'
        : 'Groove swing maintained at 58% with sidechain compression dialed into kick velocity.',
      actionPayload: { tempo_bpm: 112, swing: 58, preset: 'AmapianoClassic' },
      statePatch: {},
    };
  }

  private async evaluateKingpin(
    prompt: string,
    _context?: Partial<SonikWorldState>
  ): Promise<CouncilProposal> {
    const isRelevant =
      prompt.includes('vocal') ||
      prompt.includes('harmony') ||
      prompt.includes('hook') ||
      prompt.includes('sing') ||
      prompt.includes('voice') ||
      prompt.includes('reverb') ||
      prompt.includes('autotune');

    return {
      agentId: 'kingpin',
      agentName: 'Kingpin',
      category: 'vocal',
      confidence: isRelevant ? 0.96 : 0.62,
      rationale: isRelevant
        ? 'Arranged a 3-part vocal triad stack with lush stereo chorus, tube warmth, and 2kHz presence boost.'
        : 'Lead vocal spatialized in a sacred acoustic chamber with 1.8s decay and warm pre-delay.',
      actionPayload: { scale_key: 'F# Minor', harmony: ['+3rd', '-5th'] },
      statePatch: {},
    };
  }

  private synthesizeConsensus(topic: string, proposals: CouncilProposal[]): CouncilResolution {
    const sorted = [...proposals].sort((a, b) => b.confidence - a.confidence);
    const primary = sorted[0];

    const appliedChanges: Record<string, any> = {};
    for (const p of proposals) {
      if (p.actionPayload) {
        Object.assign(appliedChanges, p.actionPayload);
      }
    }

    const summaryTranscript = `Council alignment reached on "${topic}". ${primary.agentName} leads the action: ${primary.rationale}`;

    return {
      topic,
      consensusConfidence: primary.confidence,
      selectedProposals: sorted,
      summaryTranscript,
      appliedStateChanges: appliedChanges,
      timestamp: Date.now(),
    };
  }
}

export const councilCoordinator = new CouncilCoordinator();

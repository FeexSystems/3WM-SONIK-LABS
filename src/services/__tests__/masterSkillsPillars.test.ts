import { unitEconomicsService } from '../unitEconomicsService';
import { marketIntelligenceService } from '../marketIntelligenceService';
import { organizationService } from '../organizationService';

describe('3WM Master Skills & Business Engines', () => {
  describe('Pillar 5: SaaS Multi-Tenancy & Workspace Service', () => {
    it('initializes default studio workspaces', () => {
      const workspaces = organizationService.getWorkspaces();
      expect(workspaces.length).toBeGreaterThanOrEqual(2);
      expect(workspaces.some((w) => w.plan === 'MASTER_LABEL')).toBe(true);
    });

    it('creates a new workspace and switches active context', () => {
      const newWs = organizationService.createWorkspace('Afro-Tech Studio', 'PRO_STUDIO');
      expect(newWs.name).toBe('Afro-Tech Studio');
      expect(organizationService.getActiveWorkspace().id).toBe(newWs.id);
    });

    it('adds team member with role permissions', () => {
      const activeWs = organizationService.getActiveWorkspace();
      const added = organizationService.addMember(
        activeWs.id,
        'soundgod@3wmsonik.ai',
        'Ricky Sound God',
        'PRODUCER'
      );
      expect(added).toBe(true);
      const updated = organizationService.getActiveWorkspace();
      expect(updated.members.some((m) => m.email === 'soundgod@3wmsonik.ai')).toBe(true);
    });
  });

  describe('Pillar 7: Market Intelligence & Sound Trends', () => {
    it('returns trending parameters for Amapiano', () => {
      const trends = marketIntelligenceService.getGenreTrends('amapiano');
      expect(trends.genre).toBe('Amapiano');
      expect(trends.optimalBpm).toBe(112);
      expect(trends.popularKeys).toContain('F# Minor');
      expect(trends.signatureDrumElements).toContain('Pitched Log Drum');
    });

    it('generates programmatic SEO metadata for stem downloads', () => {
      const seo = marketIntelligenceService.generateProgrammaticSeo(
        'Lagos Midnight',
        'Afrofusion',
        108,
        'D Minor'
      );
      expect(seo.title).toContain('Lagos Midnight');
      expect(seo.title).toContain('108 BPM');
      expect(seo.keywords.length).toBeGreaterThan(3);
    });
  });

  describe('Pillar 8: Unit Economics & Token Financial Modeling', () => {
    it('calculates session AI compute cost breakdown', () => {
      const cost = unitEconomicsService.calculateSessionCost(1500, 500, 10, 1.5);
      expect(cost.geminiReasoningTokens).toBe(2000);
      expect(cost.geminiTtsAudioSeconds).toBe(10);
      expect(cost.totalCostUsd).toBeGreaterThan(0);
    });

    it('evaluates gross margins for Pro Studio and Master Label', () => {
      const pro = unitEconomicsService.getTierUnitEconomics('PRO_STUDIO');
      expect(pro.grossMarginPercentage).toBeGreaterThan(85);

      const label = unitEconomicsService.getTierUnitEconomics('MASTER_LABEL');
      expect(label.grossMarginPercentage).toBeGreaterThan(88);
    });

    it('generates ARR and LTV business projections', () => {
      const projections = unitEconomicsService.calculateProjections(1000);
      expect(projections.arrUsd).toBeGreaterThan(100000);
      expect(projections.blendedGrossMarginPercent).toBeGreaterThan(85);
      expect(projections.cacPaybackMonths).toBeLessThan(3);
    });
  });

  describe('Pillar 9: BigQuery AI/ML Music Intelligence & Vector Stem Matching', () => {
    it('constructs AI.SIMILARITY vector query with cosine distance', async () => {
      const { bigQueryMusicMLService } = await import('../bigQueryMusicMLService');
      const query = bigQueryMusicMLService.buildStemSimilarityQuery([0.1, 0.2, 0.3], 5);
      expect(query).toContain('ML.DISTANCE');
      expect(query).toContain('stem_catalog');
    });

    it('constructs AI.FORECAST stream prediction query', async () => {
      const { bigQueryMusicMLService } = await import('../bigQueryMusicMLService');
      const query = bigQueryMusicMLService.buildHitForecastQuery('track-test-123', 12);
      expect(query).toContain('ML.FORECAST');
      expect(query).toContain('sonik_hit_forecaster_arima');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { BigQueryMusicMLService } from './bigQueryMusicMLService';

describe('BigQueryMusicMLService', () => {
  const service = new BigQueryMusicMLService('sonik-prod-test', 'afro_catalog');

  it('generates valid vector cosine distance similarity query', () => {
    const dummyEmbedding = [0.12, -0.45, 0.88, 0.05];
    const query = service.buildStemSimilarityQuery(dummyEmbedding, 5, 0.85);

    expect(query).toContain('ML.DISTANCE');
    expect(query).toContain('COSINE');
    expect(query).toContain('`sonik-prod-test.afro_catalog.stem_catalog`');
    expect(query).toContain('LIMIT 5');
  });

  it('generates valid ML.FORECAST stream trajectory query', () => {
    const query = service.buildHitForecastQuery('track-lagos-001', 12, 0.9);

    expect(query).toContain('ML.FORECAST');
    expect(query).toContain('`sonik-prod-test.afro_catalog.sonik_hit_forecaster_arima`');
    expect(query).toContain('horizon');
    expect(query).toContain("track_id = 'track-lagos-001'");
  });

  it('generates valid ML.DETECT_ANOMALIES query for mix analysis', () => {
    const query = service.buildSpectralAnomalyDetectionQuery('current_session_mix_32band');

    expect(query).toContain('ML.DETECT_ANOMALIES');
    expect(query).toContain('`sonik-prod-test.afro_catalog.mastering_anomaly_detector`');
    expect(query).toContain('is_anomaly = TRUE');
  });

  it('generates valid ML.GENERATE_TEXT query for harmonic insights', () => {
    const query = service.buildHarmonicAnalysisQuery(
      'Amapiano 112 BPM F# Minor with log drum bass'
    );

    expect(query).toContain('ML.GENERATE_TEXT');
    expect(query).toContain('gemini_pro_music_analyst');
    expect(query).toContain('Kappachino Emar');
  });
});

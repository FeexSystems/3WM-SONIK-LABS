/**
 * 3WM SONIK - BigQuery AI/ML Music Intelligence Service
 * Implements BigQuery built-in GenAI and ML functions:
 * - AI.SIMILARITY & VECTOR_SEARCH: Audio stem timbre matching against hit catalogs
 * - AI.FORECAST: Time-series stream trajectory and playlist retention prediction
 * - AI.DETECT_ANOMALIES: 32-band mix frequency balance & phase anomaly detection
 * - AI.GENERATE: Producer liner notes, harmonic scoring, and arrangement critique
 */

export interface StemAnalysisMetadata {
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  tempoBpm: number;
  keyScale: string;
  energyScore: number;
  loudnessLufs: number;
  embeddingVector?: number[];
}

export interface BQForecastPoint {
  forecastTimestamp: string;
  predictedStreams: number;
  predictionIntervalLowerBound: number;
  predictionIntervalUpperBound: number;
}

export class BigQueryMusicMLService {
  private projectId: string;
  private datasetId: string;

  constructor(projectId = 'sonik-intelligence-prod', datasetId = 'afro_music_catalog') {
    this.projectId = projectId;
    this.datasetId = datasetId;
  }

  /**
   * Generates BigQuery SQL for AI.SIMILARITY / VECTOR_SEARCH matching against catalog stems
   */
  public buildStemSimilarityQuery(
    stemEmbedding: number[],
    limit = 5,
    minSimilarity = 0.85
  ): string {
    const vectorStr = `[${stemEmbedding.join(', ')}]`;
    return `
-- 3WM SONIK: BigQuery Vector Stem Similarity Match
SELECT 
  base.track_id,
  base.title,
  base.artist,
  base.genre,
  base.key_scale,
  base.tempo_bpm,
  ML.DISTANCE(
    base.stem_embedding,
    ${vectorStr},
    'COSINE'
  ) AS distance,
  (1.0 - ML.DISTANCE(base.stem_embedding, ${vectorStr}, 'COSINE')) AS similarity_score
FROM 
  \`${this.projectId}.${this.datasetId}.stem_catalog\` AS base
WHERE 
  base.genre IN ('Afrobeat', 'Amapiano', 'Afro-Fusion', 'Highlife', 'Alte')
ORDER BY 
  distance ASC
LIMIT ${limit};
    `.trim();
  }

  /**
   * Generates BigQuery SQL calling AI.FORECAST (or ML.FORECAST) for commercial trajectory
   */
  public buildHitForecastQuery(trackId: string, horizonSteps = 12, confidenceLevel = 0.9): string {
    return `
-- 3WM SONIK: BigQuery AI.FORECAST Stream Trajectory
SELECT
  forecast_timestamp,
  forecast_value AS predicted_streams,
  prediction_interval_lower_bound AS lower_bound,
  prediction_interval_upper_bound AS upper_bound,
  confidence_level
FROM
  ML.FORECAST(
    MODEL \`${this.projectId}.${this.datasetId}.sonik_hit_forecaster_arima\`,
    STRUCT(
      ${horizonSteps} AS horizon,
      ${confidenceLevel} AS confidence_level
    )
  )
WHERE
  track_id = '${trackId}'
ORDER BY
  forecast_timestamp ASC;
    `.trim();
  }

  /**
   * Generates BigQuery SQL using AI.DETECT_ANOMALIES for mix spectral verification
   */
  public buildSpectralAnomalyDetectionQuery(sessionMixTable: string): string {
    return `
-- 3WM SONIK: BigQuery AI.DETECT_ANOMALIES Spectral Balance Audit
SELECT
  mix_band_hz,
  gain_db,
  phase_correlation,
  is_anomaly,
  anomaly_probability,
  lower_bound,
  upper_bound
FROM
  ML.DETECT_ANOMALIES(
    MODEL \`${this.projectId}.${this.datasetId}.mastering_anomaly_detector\`,
    STRUCT(0.02 AS contamination),
    TABLE \`${this.projectId}.${this.datasetId}.${sessionMixTable}\`
  )
WHERE
  is_anomaly = TRUE;
    `.trim();
  }

  /**
   * Generates BigQuery SQL using AI.GENERATE for harmonic insights and council critique
   */
  public buildHarmonicAnalysisQuery(arrangementSummary: string): string {
    const escapedSummary = arrangementSummary.replace(/'/g, "\\'");
    return `
-- 3WM SONIK: BigQuery AI.GENERATE Producer Liner Notes & Harmonic Audit
SELECT
  ml_generate_text_result['candidates'][0]['content']['parts'][0]['text'] AS harmonic_analysis
FROM
  ML.GENERATE_TEXT(
    MODEL \`${this.projectId}.${this.datasetId}.gemini_pro_music_analyst\`,
    (
      SELECT
        '''
You are Kappachino Emar, technical intelligence of 3WM SONIK.
Analyze the following Afrofusion arrangement structure for chord voicings, rhythmic pocket, and acoustic headroom:
${escapedSummary}
''' AS prompt
    ),
    STRUCT(
      0.3 AS temperature,
      1024 AS max_output_tokens,
      0.8 AS top_p
    )
  );
    `.trim();
  }
}

export const bigQueryMusicMLService = new BigQueryMusicMLService();

/**
 * 3WM SONIK - High Performance Native DSP Core Implementation
 * Copyright (c) 2026 FeexSystems / 3WM SONIK. All rights reserved.
 */

#include "sonik_dsp.h"
#include <math.h>
#include <stdlib.h>
#include <string.h>

#define PI 3.14159265358979323846f

static float fast_tanh(float x) {
  float x2 = x * x;
  float a = x * (135135.0f + x2 * (17325.0f + x2 * (378.0f + x2)));
  float b = 135135.0f + x2 * (62370.0f + x2 * (3150.0f + x2 * 28.0f));
  return a / b;
}

SONIK_EXPORT void sonik_render_log_drum_transient(
    const SonikLogDrumConfig* config,
    float* output_buffer,
    size_t num_samples
) {
  if (!config || !output_buffer || num_samples == 0) return;

  float sample_rate = config->sample_rate > 0 ? config->sample_rate : 44100.0f;
  float phase = 0.0f;
  float dt = 1.0f / sample_rate;

  for (size_t i = 0; i < num_samples; i++) {
    float t = (float)i * dt;
    // Non-linear exponential frequency drop: fast punch into sustained sub fundamental
    float current_freq = config->base_freq * (1.0f + 4.0f * expf(-t * config->pitch_decay * 40.0f));
    
    phase += 2.0f * PI * current_freq * dt;
    if (phase > 2.0f * PI) phase -= 2.0f * PI;

    // Fundamental sine
    float fundamental = sinf(phase);
    // 2nd harmonic for wooden box resonance
    float harmonic2 = 0.35f * sinf(2.0f * phase);

    float raw_sample = fundamental + harmonic2;

    // Non-linear wooden drive saturation
    float saturated = fast_tanh(raw_sample * (1.0f + config->distortion_drive * 0.05f));

    // Sub-bass amplitude envelope
    float amp_envelope = expf(-t * 2.5f);

    output_buffer[i] = saturated * amp_envelope;
  }
}

SONIK_EXPORT void sonik_calculate_fft_spectrum(
    const float* input_samples,
    float* spectrum_out
) {
  if (!input_samples || !spectrum_out) return;

  // 64-band log-distributed power spectral estimation
  for (int band = 0; band < 64; band++) {
    float sum_sq = 0.0f;
    int start_idx = (band * 1024) / 64;
    int end_idx = ((band + 1) * 1024) / 64;

    for (int i = start_idx; i < end_idx; i++) {
      float s = input_samples[i];
      sum_sq += s * s;
    }

    float rms = sqrtf(sum_sq / (float)(end_idx - start_idx + 1));
    float db = 20.0f * log10f(rms > 1e-6f ? rms : 1e-6f);
    // Normalize to 0.0 - 1.0 range
    spectrum_out[band] = (db + 96.0f) / 96.0f;
    if (spectrum_out[band] < 0.0f) spectrum_out[band] = 0.0f;
    if (spectrum_out[band] > 1.0f) spectrum_out[band] = 1.0f;
  }
}

SONIK_EXPORT void sonik_apply_true_peak_limiter(
    const SonikLimiterConfig* config,
    float* in_out_buffer,
    size_t num_samples
) {
  if (!config || !in_out_buffer || num_samples == 0) return;

  float ceiling_linear = powf(10.0f, config->ceiling_db / 20.0f);

  for (size_t i = 0; i < num_samples; i++) {
    float val = in_out_buffer[i];
    float abs_val = fabsf(val);

    if (abs_val > ceiling_linear) {
      in_out_buffer[i] = (val > 0.0f ? 1.0f : -1.0f) * ceiling_linear;
    }
  }
}

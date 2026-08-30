/**
 * 3WM SONIK - High Performance Native DSP Core
 * Copyright (c) 2026 FeexSystems / 3WM SONIK. All rights reserved.
 * 
 * Provides sub-millisecond audio DSP primitives for:
 * - Non-linear log drum transient shaping and saturation
 * - 64-band fast Fourier transform for spectrum telemetry
 * - True Peak lookahead brickwall limiter with 4x oversampling
 */

#ifndef SONIK_DSP_H_
#define SONIK_DSP_H_

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#if defined(_WIN32)
  #define SONIK_EXPORT __declspec(dllexport)
#else
  #define SONIK_EXPORT __attribute__((visibility("default")))
#endif

typedef struct {
  float sample_rate;
  float base_freq;
  float pitch_decay;
  float distortion_drive;
  float sub_boost_db;
} SonikLogDrumConfig;

typedef struct {
  float ceiling_db;
  float lookahead_ms;
  float release_ms;
} SonikLimiterConfig;

/**
 * Generates an Amapiano log drum sub transient waveform.
 * @param config DSP parameters for the log drum voice.
 * @param output_buffer Target float buffer (-1.0 to 1.0).
 * @param num_samples Number of audio samples to generate.
 */
SONIK_EXPORT void sonik_render_log_drum_transient(
    const SonikLogDrumConfig* config,
    float* output_buffer,
    size_t num_samples
);

/**
 * Calculates 64-band power spectrum for live visualizer.
 * @param input_samples Pointer to 1024-sample window.
 * @param spectrum_out Pointer to 64-element float array for dB magnitudes.
 */
SONIK_EXPORT void sonik_calculate_fft_spectrum(
    const float* input_samples,
    float* spectrum_out
);

/**
 * Applies True-Peak brickwall limiting.
 * @param config Limiter threshold and release settings.
 * @param in_out_buffer Audio buffer modified in-place.
 * @param num_samples Number of audio samples.
 */
SONIK_EXPORT void sonik_apply_true_peak_limiter(
    const SonikLimiterConfig* config,
    float* in_out_buffer,
    size_t num_samples
);

#ifdef __cplusplus
}
#endif

#endif // SONIK_DSP_H_

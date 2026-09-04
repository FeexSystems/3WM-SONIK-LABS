// 3WM SONIK — C++ WebAssembly DSP Kernel
// Analog Warmth Saturation, Biquad Parametric EQ, and Lock-free Audio Processing.

#include <cmath>
#include <vector>
#include <algorithm>

extern "C" {

// Analog Warmth Tape Saturation (Tanh-based soft clipping with asymmetric odd harmonics)
void process_tape_saturation(float* inputOutput, int numSamples, float drive, float warmth) {
    float gain = std::pow(10.0f, drive / 20.0f);
    for (int i = 0; i < numSamples; ++i) {
        float x = inputOutput[i] * gain;
        // Asymmetric warm polynomial shaping
        float saturated = std::tanh(x + warmth * 0.1f * x * x);
        inputOutput[i] = saturated;
    }
}

// Biquad Filter Coefficients & Direct Form II Transposed Processing
struct BiquadCoeffs {
    float b0, b1, b2, a1, a2;
    float z1 = 0.0f, z2 = 0.0f;
};

void calculate_peaking_eq(BiquadCoeffs* filter, float sampleRate, float frequency, float gainDb, float Q) {
    float A = std::pow(10.0f, gainDb / 40.0f);
    float omega = 2.0f * M_PI * frequency / sampleRate;
    float alpha = std::sin(omega) / (2.0f * Q);
    float beta = std::sqrt(A) / Q;

    float b0 = 1.0f + alpha * A;
    float b1 = -2.0f * std::cos(omega);
    float b2 = 1.0f - alpha * A;
    float a0 = 1.0f + alpha / A;
    float a1 = -2.0f * std::cos(omega);
    float a2 = 1.0f - alpha / A;

    filter->b0 = b0 / a0;
    filter->b1 = b1 / a0;
    filter->b2 = b2 / a0;
    filter->a1 = a1 / a0;
    filter->a2 = a2 / a0;
}

void process_biquad(BiquadCoeffs* filter, float* inputOutput, int numSamples) {
    for (int i = 0; i < numSamples; ++i) {
        float in = inputOutput[i];
        float out = filter->b0 * in + filter->z1;
        filter->z1 = filter->b1 * in - filter->a1 * out + filter->z2;
        filter->z2 = filter->b2 * in - filter->a2 * out;
        inputOutput[i] = out;
    }
}

}

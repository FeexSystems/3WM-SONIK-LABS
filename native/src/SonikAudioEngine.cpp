// 3WM SONIK — Native Low-Latency C++ Audio Engine Implementation

#include "SonikAudioEngine.h"
#include <cmath>
#include <algorithm>
#include <iostream>

namespace Sonik {

SonikAudioEngine::SonikAudioEngine() = default;

SonikAudioEngine::~SonikAudioEngine() {
    shutdown();
}

bool SonikAudioEngine::initialize(const AudioDeviceSpec& spec) {
    m_currentSpec = spec;
    m_isRunning.store(false);
    m_masterVolume.store(1.0f);
    std::cout << "[3WM SONIK Native Engine] Initialized with SampleRate=" 
              << spec.sampleRate << " BufferSize=" << spec.bufferSize << std::endl;
    return true;
}

void SonikAudioEngine::shutdown() {
    stop();
}

bool SonikAudioEngine::start() {
    m_isRunning.store(true);
    return true;
}

bool SonikAudioEngine::stop() {
    m_isRunning.store(false);
    return true;
}

void SonikAudioEngine::setMasterVolume(float volume) {
    m_masterVolume.store(std::clamp(volume, 0.0f, 2.0f));
}

PeakMeterLevels SonikAudioEngine::getPeakLevels() const {
    PeakMeterLevels levels;
    levels.peakLeft = m_peakLeft.load();
    levels.peakRight = m_peakRight.load();
    levels.lufsIntegrated = m_lufsIntegrated.load();
    return levels;
}

std::vector<AudioDeviceSpec> SonikAudioEngine::enumerateDevices() {
    std::vector<AudioDeviceSpec> devices;
    AudioDeviceSpec defaultAsio;
    defaultAsio.id = "sonik-native-asio-0";
    defaultAsio.name = "3WM SONIK Studio Low-Latency Audio Driver";
    defaultAsio.driverType = AudioDriverType::ASIO;
    defaultAsio.sampleRate = 48000;
    defaultAsio.bufferSize = 256;
    defaultAsio.inputChannels = 2;
    defaultAsio.outputChannels = 8;
    devices.push_back(defaultAsio);
    return devices;
}

void SonikAudioEngine::processAudioBlock(float** outputBuffers, int numChannels, int numSamples) {
    if (!m_isRunning.load() || outputBuffers == nullptr) return;

    float vol = m_masterVolume.load();
    float maxL = 0.0f;
    float maxR = 0.0f;

    for (int ch = 0; ch < numChannels; ++ch) {
        float* channelData = outputBuffers[ch];
        if (!channelData) continue;

        for (int i = 0; i < numSamples; ++i) {
            channelData[i] *= vol;
            float absVal = std::abs(channelData[i]);
            if (ch == 0 && absVal > maxL) maxL = absVal;
            if (ch == 1 && absVal > maxR) maxR = absVal;
        }
    }

    // Convert peak linear amplitudes to dB
    float dbL = (maxL > 1e-5f) ? 20.0f * std::log10(maxL) : -60.0f;
    float dbR = (maxR > 1e-5f) ? 20.0f * std::log10(maxR) : -60.0f;

    m_peakLeft.store(dbL);
    m_peakRight.store(dbR);
    m_lufsIntegrated.store(std::max(dbL, dbR) - 0.5f);
}

} // namespace Sonik

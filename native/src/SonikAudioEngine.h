// 3WM SONIK — Native Low-Latency C++ Audio Engine
// Real-time audio engine with multi-driver support (ASIO / CoreAudio / WASAPI).

#pragma once

#include <vector>
#include <string>
#include <memory>
#include <atomic>
#include <functional>

namespace Sonik {

enum class AudioDriverType {
    ASIO,
    CoreAudio,
    WASAPI,
    DirectSound,
    ALSA
};

struct AudioDeviceSpec {
    std::string id;
    std::string name;
    AudioDriverType driverType;
    int sampleRate = 48000;
    int bufferSize = 256;
    int inputChannels = 2;
    int outputChannels = 8;
};

struct PeakMeterLevels {
    float peakLeft = -60.0f;
    float peakRight = -60.0f;
    float lufsIntegrated = -24.0f;
};

class SonikAudioEngine {
public:
    SonikAudioEngine();
    ~SonikAudioEngine();

    bool initialize(const AudioDeviceSpec& spec);
    void shutdown();

    bool start();
    bool stop();
    bool isRunning() const { return m_isRunning.load(); }

    void setMasterVolume(float volume);
    float getMasterVolume() const { return m_masterVolume.load(); }

    PeakMeterLevels getPeakLevels() const;
    std::vector<AudioDeviceSpec> enumerateDevices();

    // Internal audio callback loop
    void processAudioBlock(float** outputBuffers, int numChannels, int numSamples);

private:
    std::atomic<bool> m_isRunning{false};
    std::atomic<float> m_masterVolume{1.0f};
    std::atomic<float> m_peakLeft{-60.0f};
    std::atomic<float> m_peakRight{-60.0f};
    std::atomic<float> m_lufsIntegrated{-24.0f};
    AudioDeviceSpec m_currentSpec;
};

} // namespace Sonik

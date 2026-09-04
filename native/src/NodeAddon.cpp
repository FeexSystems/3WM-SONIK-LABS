// 3WM SONIK — Node.js N-API C++ Addon Bridge
// Connects the high-performance C++ SonikAudioEngine and Vst3PluginHost to Node.js / Electron.

#include "SonikAudioEngine.h"
#include "Vst3PluginHost.h"
#include <memory>
#include <iostream>

static std::unique_ptr<Sonik::SonikAudioEngine> g_engine = nullptr;
static std::unique_ptr<Sonik::Vst3PluginHost> g_host = nullptr;

extern "C" {

// C-linkage export symbols for direct Node FFI or N-API loading
int sonik_engine_init(int sampleRate, int bufferSize) {
    if (!g_engine) g_engine = std::make_unique<Sonik::SonikAudioEngine>();
    Sonik::AudioDeviceSpec spec;
    spec.sampleRate = sampleRate;
    spec.bufferSize = bufferSize;
    return g_engine->initialize(spec) ? 1 : 0;
}

int sonik_engine_start() {
    return (g_engine && g_engine->start()) ? 1 : 0;
}

int sonik_engine_stop() {
    return (g_engine && g_engine->stop()) ? 1 : 0;
}

void sonik_engine_set_master_volume(float volume) {
    if (g_engine) g_engine->setMasterVolume(volume);
}

float sonik_engine_get_peak_left() {
    return g_engine ? g_engine->getPeakLevels().peakLeft : -60.0f;
}

float sonik_engine_get_peak_right() {
    return g_engine ? g_engine->getPeakLevels().peakRight : -60.0f;
}

float sonik_engine_get_lufs() {
    return g_engine ? g_engine->getPeakLevels().lufsIntegrated : -24.0f;
}

int sonik_vst3_scan_count() {
    if (!g_host) g_host = std::make_unique<Sonik::Vst3PluginHost>();
    return static_cast<int>(g_host->scanPlugins({}).size());
}

}

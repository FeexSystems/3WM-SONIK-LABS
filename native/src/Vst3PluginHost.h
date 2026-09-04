// 3WM SONIK — Native VST3 / AU Plugin Hosting Engine
// Scans, loads, automates, and renders external third-party VST3 and AU plugins.

#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace Sonik {

struct PluginParameterInfo {
    int id = 0;
    std::string name;
    float defaultValue = 0.0f;
    float currentValue = 0.0f;
    float minValue = 0.0f;
    float maxValue = 1.0f;
};

struct PluginDescriptor {
    std::string id;
    std::string name;
    std::string vendor;
    std::string version;
    std::string path;
    std::string format; // "VST3" or "AU"
    bool isInstrument = false;
};

class Vst3PluginInstance {
public:
    Vst3PluginInstance(const PluginDescriptor& desc);
    ~Vst3PluginInstance();

    bool load();
    void unload();

    void setParameter(int paramId, float value);
    float getParameter(int paramId) const;
    std::vector<PluginParameterInfo> getParameters() const;

    void process(float** inBuffers, float** outBuffers, int numChannels, int numSamples);

private:
    PluginDescriptor m_desc;
    bool m_isLoaded = false;
    std::unordered_map<int, float> m_parameters;
    std::vector<PluginParameterInfo> m_paramList;
};

class Vst3PluginHost {
public:
    Vst3PluginHost();
    ~Vst3PluginHost();

    std::vector<PluginDescriptor> scanPlugins(const std::vector<std::string>& searchPaths);
    std::shared_ptr<Vst3PluginInstance> instantiatePlugin(const std::string& pluginPath);

private:
    std::vector<PluginDescriptor> m_discoveredPlugins;
};

} // namespace Sonik

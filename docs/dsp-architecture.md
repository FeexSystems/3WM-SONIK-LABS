# 3WM SONIK - Real-time DSP Architecture

**Architecture Version:** 1.0  
**Date:** 2026-08-22  
**Scope:** Web Audio node-based DSP for plugin engine

---

## Overview

This architecture defines the real-time Digital Signal Processing (DSP) system for the 3WM SONIK plugin engine, enabling professional-grade audio effects with Web Audio nodes and AudioWorklet processors.

## Design Principles

1. **Real-time Processing**: All DSP operations must run in real-time with <10ms latency
2. **Modular Architecture**: Each effect is a self-contained, reusable DSP node
3. **Parameter Smoothing**: All parameter changes are smoothed to prevent audio glitches
4. **Serialization**: DSP graphs can be serialized/deserialized for state persistence
5. **Performance**: CPU-efficient processing with adaptive quality scaling

## Core Components

### 1. DSP Graph Builder

The DSP Graph Builder is responsible for constructing and managing audio processing graphs:

```typescript
interface DSPGraph {
  nodes: Map<string, DSPNode>;
  connections: Connection[];
  parameters: ParameterMap;
}

interface DSPNode {
  id: string;
  type: DSPNodeType;
  audioNode: AudioNode | AudioWorkletNode;
  parameters: Map<string, AudioParam>;
  state: any;
}

enum DSPNodeType {
  SOURCE = 'source',
  GAIN = 'gain',
  EQ = 'eq',
  COMPRESSOR = 'compressor',
  SATURATION = 'saturation',
  REVERB = 'reverb',
  DELAY = 'delay',
  FILTER = 'filter',
  LIMITER = 'limiter',
  OUTPUT = 'output',
}
```

### 2. AudioWorklet Processors

All DSP effects use AudioWorklet processors for real-time processing:

- **EQ Processor**: 3-band parametric EQ with adjustable frequency, Q, and gain
- **Compressor Processor**: Dynamic range compression with threshold, ratio, attack, release
- **Saturation Processor**: Analog-style saturation with multiple drive modes
- **Reverb Processor**: Algorithmic reverb with decay time and pre-delay
- **Delay Processor**: Tempo-synced delay with feedback and filtering

### 3. Parameter Smoothing System

Parameter smoothing ensures glitch-free automation:

```typescript
interface ParameterSmoother {
  targetValue: number;
  currentValue: number;
  smoothingTime: number;
  sampleRate: number;
  rampType: 'linear' | 'exponential';
}

class ParameterSmoothingEngine {
  smoothers: Map<string, ParameterSmoother>;
  process(): void; // Called each audio frame
}
```

### 4. DSP Serialization

DSP graphs can be serialized for state persistence:

```typescript
interface SerializedDSPGraph {
  version: string;
  nodes: SerializedNode[];
  connections: SerializedConnection[];
  parameters: SerializedParameters[];
}

interface SerializedNode {
  id: string;
  type: DSPNodeType;
  position: { x: number; y: number };
  state: any;
}
```

## Signal Flow

```
Input Source → [DSP Graph] → Output
                ↓
         [Parameter Smoothing]
                ↓
         [AudioWorklet Processors]
                ↓
         [Metering & Analysis]
```

## Performance Considerations

1. **CPU Budget**: Each DSP node has a CPU budget allocation
2. **Adaptive Quality**: Quality scales based on device capabilities
3. **Processing Priority**: Critical effects have higher processing priority
4. **Buffer Management**: Adaptive buffer sizes for different devices

## Integration Points

### Plugin Engine Integration

The DSP system integrates with the existing plugin engine:

```typescript
class PluginEngine {
  dspGraph: DSPGraph;
  parameterSmoothing: ParameterSmoothingEngine;

  applyEffect(effectId: string, parameters: any): void;
  removeEffect(effectId: string): void;
  getDSPState(): SerializedDSPGraph;
  loadDSPState(state: SerializedDSPGraph): void;
}
```

### Project Store Integration

DSP state integrates with the project store for persistence:

```typescript
interface TrackDSPState {
  effects: EffectState[];
  graph: SerializedDSPGraph;
  automation: AutomationData[];
}
```

## Implementation Phases

### Phase 1: Core DSP Architecture

- DSP Graph Builder
- AudioWorklet base processor
- Parameter smoothing engine
- DSP serialization system

### Phase 2: Effect Processors

- EQ AudioWorklet processor
- Compressor AudioWorklet processor
- Saturation AudioWorklet processor
- Reverb AudioWorklet processor
- Delay AudioWorklet processor

### Phase 3: Integration

- Plugin engine integration
- Project store integration
- UI integration
- Testing and optimization

## Quality Metrics

- **Latency**: <10ms end-to-end
- **CPU Usage**: <30% on mid-range devices
- **Glitch-free**: 100% smooth parameter transitions
- **Accuracy**: <0.1dB deviation from target response

## Future Enhancements

1. **Custom DSP Nodes**: User-defined DSP processors
2. **DSP Presets**: Pre-configured effect chains
3. **Visual DSP Editor**: Graphical DSP graph editor
4. **Machine Learning DSP**: AI-powered audio processing
5. **Hardware DSP**: External DSP hardware integration

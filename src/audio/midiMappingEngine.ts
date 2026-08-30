// 3WM MIDI Controller Mapping & Hardware Knobs Engine
// Supports Web MIDI API, MIDI Learn, CC Modulation, and Hardware Presets

export interface MidiMapping {
  id: string;
  name: string;
  target:
    | 'volume'
    | 'bpm'
    | 'eq_low'
    | 'eq_mid'
    | 'eq_high'
    | 'filter_cutoff'
    | 'saturation'
    | 'reverb'
    | 'ducking_threshold'
    | 'eight_oh_eight_drive'
    | 'vocal_gain';
  ccNumber: number;
  channel: number; // 1-16, 0 for all channels
  minValue: number;
  maxValue: number;
  currentNormalizedValue: number; // 0.0 to 1.0
  inverted?: boolean;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export type MidiListener = (mapping: MidiMapping, rawValue: number, mappedValue: number) => void;

class MidiMappingEngine {
  private midiAccess: any = null;
  private isSupported: boolean = false;
  private isConnected: boolean = false;
  private connectedDevices: MidiDevice[] = [];
  private mappings: MidiMapping[] = [];
  private isLearning: boolean = false;
  private learningTarget: MidiMapping['target'] | null = null;
  private listeners: Set<MidiListener> = new Set();
  private lastActivityTime: number = 0;
  private lastCcReceived: { cc: number; value: number; channel: number } | null = null;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    this.loadDefaultMappings();
  }

  public async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[MIDI Engine] Web MIDI API not supported in this browser environment.');
      return false;
    }

    try {
      this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.isConnected = true;
      this.updateDevices();

      this.midiAccess.onstatechange = () => {
        this.updateDevices();
      };

      // Attach message listeners to all inputs
      this.midiAccess.inputs.forEach((input: any) => {
        input.onmidimessage = this.handleMidiMessage.bind(this);
      });

      return true;
    } catch (err) {
      console.warn('[MIDI Engine] MIDI Access request rejected or unavailable:', err);
      this.isConnected = false;
      return false;
    }
  }

  private updateDevices() {
    if (!this.midiAccess) return;
    const devices: MidiDevice[] = [];
    this.midiAccess.inputs.forEach((input: any) => {
      devices.push({
        id: input.id,
        name: input.name || 'Generic MIDI Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state || 'connected',
      });
      // Re-attach message handler
      input.onmidimessage = this.handleMidiMessage.bind(this);
    });
    this.connectedDevices = devices;
  }

  private handleMidiMessage(event: any) {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const command = status >> 4;
    const channel = (status & 0x0f) + 1;
    const data1 = data[1]; // Note number or CC number
    const data2 = data[2]; // Velocity or CC value

    // Check for Control Change (0xB0 to 0xBF, command 11)
    if (command === 11) {
      const ccNumber = data1;
      const ccValue = data2; // 0 to 127
      const normalized = ccValue / 127;

      this.lastActivityTime = Date.now();
      this.lastCcReceived = { cc: ccNumber, value: ccValue, channel };

      // If in MIDI Learn mode, bind this CC to the selected target
      if (this.isLearning && this.learningTarget) {
        this.bindCcToTarget(this.learningTarget, ccNumber, channel);
        this.isLearning = false;
        this.learningTarget = null;
      }

      // Check existing mappings and trigger updates
      this.mappings.forEach((mapping) => {
        if (
          mapping.ccNumber === ccNumber &&
          (mapping.channel === 0 || mapping.channel === channel)
        ) {
          const finalNorm = mapping.inverted ? 1 - normalized : normalized;
          mapping.currentNormalizedValue = finalNorm;
          const mappedVal = mapping.minValue + finalNorm * (mapping.maxValue - mapping.minValue);
          this.notifyListeners(mapping, ccValue, mappedVal);
        }
      });
    }
  }

  public startMidiLearn(target: MidiMapping['target']) {
    this.isLearning = true;
    this.learningTarget = target;
  }

  public cancelMidiLearn() {
    this.isLearning = false;
    this.learningTarget = null;
  }

  public bindCcToTarget(target: MidiMapping['target'], ccNumber: number, channel: number = 0) {
    const existingIndex = this.mappings.findIndex((m) => m.target === target);
    if (existingIndex >= 0) {
      this.mappings[existingIndex].ccNumber = ccNumber;
      this.mappings[existingIndex].channel = channel;
    } else {
      const def = this.getDefaultMappingForTarget(target);
      this.mappings.push({
        ...def,
        ccNumber,
        channel,
      });
    }
  }

  public updateMapping(id: string, patch: Partial<MidiMapping>) {
    const idx = this.mappings.findIndex((m) => m.id === id);
    if (idx >= 0) {
      this.mappings[idx] = { ...this.mappings[idx], ...patch };
    }
  }

  public removeMapping(id: string) {
    this.mappings = this.mappings.filter((m) => m.id !== id);
  }

  public loadPreset(presetName: 'default' | 'mpk_mini' | 'launchkey' | 'arturia') {
    switch (presetName) {
      case 'mpk_mini':
        this.mappings = [
          {
            id: 'm1',
            name: 'Master Volume',
            target: 'volume',
            ccNumber: 7,
            channel: 1,
            minValue: 0,
            maxValue: 1,
            currentNormalizedValue: 0.9,
          },
          {
            id: 'm2',
            name: 'Low EQ (Bass)',
            target: 'eq_low',
            ccNumber: 70,
            channel: 1,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.6,
          },
          {
            id: 'm3',
            name: 'Mid EQ (Body)',
            target: 'eq_mid',
            ccNumber: 71,
            channel: 1,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.5,
          },
          {
            id: 'm4',
            name: 'High EQ (Air)',
            target: 'eq_high',
            ccNumber: 72,
            channel: 1,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.6,
          },
          {
            id: 'm5',
            name: 'Filter Cutoff',
            target: 'filter_cutoff',
            ccNumber: 73,
            channel: 1,
            minValue: 200,
            maxValue: 18000,
            currentNormalizedValue: 0.8,
          },
          {
            id: 'm6',
            name: '808 Sub Saturation',
            target: 'eight_oh_eight_drive',
            ccNumber: 74,
            channel: 1,
            minValue: 0,
            maxValue: 100,
            currentNormalizedValue: 0.4,
          },
          {
            id: 'm7',
            name: 'Kalakuta Reverb',
            target: 'reverb',
            ccNumber: 75,
            channel: 1,
            minValue: 0,
            maxValue: 100,
            currentNormalizedValue: 0.35,
          },
          {
            id: 'm8',
            name: 'Master BPM',
            target: 'bpm',
            ccNumber: 76,
            channel: 1,
            minValue: 80,
            maxValue: 160,
            currentNormalizedValue: 0.45,
          },
        ];
        break;
      case 'launchkey':
        this.mappings = [
          {
            id: 'm1',
            name: 'Master Volume',
            target: 'volume',
            ccNumber: 21,
            channel: 16,
            minValue: 0,
            maxValue: 1,
            currentNormalizedValue: 0.9,
          },
          {
            id: 'm2',
            name: 'Low EQ (Bass)',
            target: 'eq_low',
            ccNumber: 22,
            channel: 16,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.6,
          },
          {
            id: 'm3',
            name: 'Mid EQ (Body)',
            target: 'eq_mid',
            ccNumber: 23,
            channel: 16,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.5,
          },
          {
            id: 'm4',
            name: 'High EQ (Air)',
            target: 'eq_high',
            ccNumber: 24,
            channel: 16,
            minValue: -12,
            maxValue: 12,
            currentNormalizedValue: 0.6,
          },
          {
            id: 'm5',
            name: 'Filter Cutoff',
            target: 'filter_cutoff',
            ccNumber: 25,
            channel: 16,
            minValue: 200,
            maxValue: 18000,
            currentNormalizedValue: 0.8,
          },
          {
            id: 'm6',
            name: '808 Sub Saturation',
            target: 'eight_oh_eight_drive',
            ccNumber: 26,
            channel: 16,
            minValue: 0,
            maxValue: 100,
            currentNormalizedValue: 0.4,
          },
          {
            id: 'm7',
            name: 'Kalakuta Reverb',
            target: 'reverb',
            ccNumber: 27,
            channel: 16,
            minValue: 0,
            maxValue: 100,
            currentNormalizedValue: 0.35,
          },
          {
            id: 'm8',
            name: 'Master BPM',
            target: 'bpm',
            ccNumber: 28,
            channel: 16,
            minValue: 80,
            maxValue: 160,
            currentNormalizedValue: 0.45,
          },
        ];
        break;
      default:
        this.loadDefaultMappings();
        break;
    }
  }

  private loadDefaultMappings() {
    this.mappings = [
      {
        id: 'map-vol',
        name: 'Master Console Volume',
        target: 'volume',
        ccNumber: 7,
        channel: 0,
        minValue: 0,
        maxValue: 1,
        currentNormalizedValue: 0.9,
      },
      {
        id: 'map-bpm',
        name: 'Studio Tempo / BPM',
        target: 'bpm',
        ccNumber: 14,
        channel: 0,
        minValue: 80,
        maxValue: 160,
        currentNormalizedValue: 0.45,
      },
      {
        id: 'map-eq-low',
        name: '3WM Log Drum Bass EQ',
        target: 'eq_low',
        ccNumber: 16,
        channel: 0,
        minValue: -12,
        maxValue: 12,
        currentNormalizedValue: 0.62,
      },
      {
        id: 'map-eq-mid',
        name: 'Vocal Mid EQ',
        target: 'eq_mid',
        ccNumber: 17,
        channel: 0,
        minValue: -12,
        maxValue: 12,
        currentNormalizedValue: 0.5,
      },
      {
        id: 'map-eq-high',
        name: 'Shekere / Shaker Air EQ',
        target: 'eq_high',
        ccNumber: 18,
        channel: 0,
        minValue: -12,
        maxValue: 12,
        currentNormalizedValue: 0.6,
      },
      {
        id: 'map-cutoff',
        name: 'Master Analog Filter Cutoff',
        target: 'filter_cutoff',
        ccNumber: 74,
        channel: 0,
        minValue: 200,
        maxValue: 20000,
        currentNormalizedValue: 0.85,
      },
      {
        id: 'map-808-drive',
        name: '808 Trap Saturation Drive',
        target: 'eight_oh_eight_drive',
        ccNumber: 19,
        channel: 0,
        minValue: 0,
        maxValue: 100,
        currentNormalizedValue: 0.45,
      },
      {
        id: 'map-rev',
        name: 'Lagos Shrine Plate Reverb',
        target: 'reverb',
        ccNumber: 91,
        channel: 0,
        minValue: 0,
        maxValue: 100,
        currentNormalizedValue: 0.35,
      },
      {
        id: 'map-duck',
        name: 'Vocal Sidechain Threshold',
        target: 'ducking_threshold',
        ccNumber: 20,
        channel: 0,
        minValue: -40,
        maxValue: -6,
        currentNormalizedValue: 0.5,
      },
    ];
  }

  private getDefaultMappingForTarget(target: MidiMapping['target']): MidiMapping {
    const defaults: Record<MidiMapping['target'], Partial<MidiMapping>> = {
      volume: { name: 'Master Console Volume', minValue: 0, maxValue: 1 },
      bpm: { name: 'Studio Tempo / BPM', minValue: 80, maxValue: 160 },
      eq_low: { name: 'Low Bass EQ', minValue: -12, maxValue: 12 },
      eq_mid: { name: 'Mid EQ', minValue: -12, maxValue: 12 },
      eq_high: { name: 'High Air EQ', minValue: -12, maxValue: 12 },
      filter_cutoff: { name: 'Filter Cutoff', minValue: 200, maxValue: 20000 },
      saturation: { name: 'Warmth Saturation', minValue: 0, maxValue: 100 },
      reverb: { name: 'Shrine Reverb Amount', minValue: 0, maxValue: 100 },
      ducking_threshold: { name: 'Vocal Ducking Threshold', minValue: -40, maxValue: -6 },
      eight_oh_eight_drive: { name: '808 Sub Saturation Drive', minValue: 0, maxValue: 100 },
      vocal_gain: { name: 'Live Mic Vocal Gain', minValue: 0, maxValue: 100 },
    };
    const def = defaults[target] || { name: target, minValue: 0, maxValue: 100 };
    return {
      id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: def.name || target,
      target,
      ccNumber: 1,
      channel: 0,
      minValue: def.minValue || 0,
      maxValue: def.maxValue || 100,
      currentNormalizedValue: 0.5,
    };
  }

  public subscribe(listener: MidiListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(mapping: MidiMapping, rawValue: number, mappedValue: number) {
    this.listeners.forEach((l) => {
      try {
        l(mapping, rawValue, mappedValue);
      } catch (e) {
        console.error('Error in MIDI listener callback:', e);
      }
    });
  }

  // Helper to simulate CC event manually from UI slider
  public simulateCc(ccNumber: number, value: number, channel: number = 0) {
    const normalized = value / 127;
    this.lastActivityTime = Date.now();
    this.lastCcReceived = { cc: ccNumber, value, channel };

    this.mappings.forEach((mapping) => {
      if (mapping.ccNumber === ccNumber && (mapping.channel === 0 || mapping.channel === channel)) {
        const finalNorm = mapping.inverted ? 1 - normalized : normalized;
        mapping.currentNormalizedValue = finalNorm;
        const mappedVal = mapping.minValue + finalNorm * (mapping.maxValue - mapping.minValue);
        this.notifyListeners(mapping, value, mappedVal);
      }
    });
  }

  public getStatus() {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      devices: this.connectedDevices,
      mappings: [...this.mappings],
      isLearning: this.isLearning,
      learningTarget: this.learningTarget,
      lastCcReceived: this.lastCcReceived,
      lastActivityTime: this.lastActivityTime,
    };
  }
}

export const midiMappingEngine = new MidiMappingEngine();

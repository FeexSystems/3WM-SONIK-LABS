// 3WM SONIK - Professional Mixer
// Industry-standard console-style mixer with channel strips, sends/returns, and grouping

export interface ChannelStrip {
  id: string;
  name: string;
  trackId: string;

  // Fader
  fader: number; // 0-1 (linear) or dB scale
  faderDb: number; // -inf to +10 dB

  // Pan
  pan: number; // -1 (left) to 1 (right)

  // Mute/Solo
  muted: boolean;
  soloed: boolean;

  // Sends
  sends: SendSlot[];

  // Inserts
  inserts: InsertSlot[];

  // Channel Processing
  eq: ParametricEQ;
  dynamics: DynamicsProcessor;

  // Phase/Polarity
  phaseInverted: boolean;

  // Grouping
  groupId: string | null;
  vcaGroupId: string | null;

  // Metering
  peakLevel: number; // dB
  rmsLevel: number; // dB
}

export interface SendSlot {
  id: string;
  targetBusId: string;
  amount: number; // 0-1
  prePost: 'pre' | 'post';
  enabled: boolean;
}

export interface InsertSlot {
  id: string;
  effectId: string;
  enabled: boolean;
  bypass: boolean;
  wetDry: number; // 0-1
}

export interface ParametricEQ {
  enabled: boolean;
  bands: EQBand[];
}

export interface EQBand {
  frequency: number; // Hz
  gain: number; // dB
  q: number; // Quality factor
  type: 'low-shelf' | 'high-shelf' | 'peaking' | 'low-pass' | 'high-pass';
  enabled: boolean;
}

export interface DynamicsProcessor {
  enabled: boolean;
  type: 'compressor' | 'limiter' | 'expander' | 'gate';
  threshold: number; // dB
  ratio: number; // e.g., 4:1 = 4
  attack: number; // ms
  release: number; // ms
  makeupGain: number; // dB
  knee: number; // dB (soft knee)
  wetDry: number; // 0-1
}

export interface MixBus {
  id: string;
  name: string;
  type: 'aux' | 'master' | 'submix';

  // Fader
  fader: number;
  faderDb: number;

  // Pan
  pan: number;

  // Mute/Solo
  muted: boolean;
  soloed: boolean;

  // Processing
  eq: ParametricEQ;
  dynamics: DynamicsProcessor;

  // Metering
  peakLevel: number;
  rmsLevel: number;

  // Routing
  inputChannels: string[]; // Channel IDs routed to this bus
}

export interface VCAGroup {
  id: string;
  name: string;
  channelIds: string[];
  masterFader: number;
  masterMute: boolean;
}

export class ProfessionalMixer {
  private audioContext: AudioContext | null = null;
  private channels: Map<string, ChannelStrip> = new Map();
  private buses: Map<string, MixBus> = new Map();
  private vcaGroups: Map<string, VCAGroup> = new Map();
  private masterBus: MixBus | null = null;

  constructor() {
    this.initializeMasterBus();
  }

  /**
   * Initialize mixer with audio context
   */
  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Initialize master bus
   */
  private initializeMasterBus(): void {
    this.masterBus = {
      id: 'master',
      name: 'Master',
      type: 'master',
      fader: 0.8,
      faderDb: 0,
      pan: 0,
      muted: false,
      soloed: false,
      eq: this.createDefaultEQ(),
      dynamics: this.createDefaultDynamics(),
      peakLevel: -60,
      rmsLevel: -60,
      inputChannels: [],
    };
    this.buses.set('master', this.masterBus);
  }

  /**
   * Create default EQ settings
   */
  private createDefaultEQ(): ParametricEQ {
    return {
      enabled: false,
      bands: [
        { frequency: 80, gain: 0, q: 1, type: 'low-shelf', enabled: true },
        { frequency: 1000, gain: 0, q: 1, type: 'peaking', enabled: true },
        { frequency: 3000, gain: 0, q: 1, type: 'peaking', enabled: true },
        { frequency: 12000, gain: 0, q: 1, type: 'high-shelf', enabled: true },
      ],
    };
  }

  /**
   * Create default dynamics processor
   */
  private createDefaultDynamics(): DynamicsProcessor {
    return {
      enabled: false,
      type: 'compressor',
      threshold: -20,
      ratio: 4,
      attack: 10,
      release: 100,
      makeupGain: 0,
      knee: 4,
      wetDry: 1,
    };
  }

  /**
   * Create a new channel strip
   */
  public createChannel(trackId: string, name: string): ChannelStrip {
    const channel: ChannelStrip = {
      id: `channel_${trackId}`,
      name,
      trackId,
      fader: 0.8,
      faderDb: 0,
      pan: 0,
      muted: false,
      soloed: false,
      sends: [],
      inserts: [],
      eq: this.createDefaultEQ(),
      dynamics: this.createDefaultDynamics(),
      phaseInverted: false,
      groupId: null,
      vcaGroupId: null,
      peakLevel: -60,
      rmsLevel: -60,
    };

    this.channels.set(channel.id, channel);
    return channel;
  }

  /**
   * Get channel by ID
   */
  public getChannel(channelId: string): ChannelStrip | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get all channels
   */
  public getAllChannels(): ChannelStrip[] {
    return Array.from(this.channels.values());
  }

  /**
   * Update channel fader
   */
  public setChannelFader(channelId: string, fader: number): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.fader = Math.max(0, Math.min(1, fader));
    channel.faderDb = this.linearToDb(channel.fader);
  }

  /**
   * Update channel fader in dB
   */
  public setChannelFaderDb(channelId: string, db: number): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.faderDb = Math.max(-60, Math.min(10, db));
    channel.fader = this.dbToLinear(channel.faderDb);
  }

  /**
   * Update channel pan
   */
  public setChannelPan(channelId: string, pan: number): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.pan = Math.max(-1, Math.min(1, pan));
  }

  /**
   * Toggle channel mute
   */
  public toggleChannelMute(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    channel.muted = !channel.muted;
    return channel.muted;
  }

  /**
   * Toggle channel solo
   */
  public toggleChannelSolo(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    // If soloing, unsolo all other channels
    if (!channel.soloed) {
      for (const ch of this.channels.values()) {
        ch.soloed = false;
      }
    }

    channel.soloed = !channel.soloed;
    return channel.soloed;
  }

  /**
   * Add send to channel
   */
  public addSend(
    channelId: string,
    targetBusId: string,
    prePost: 'pre' | 'post' = 'post'
  ): SendSlot {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const send: SendSlot = {
      id: `send_${channelId}_${targetBusId}_${Date.now()}`,
      targetBusId,
      amount: 0,
      prePost,
      enabled: true,
    };

    channel.sends.push(send);
    return send;
  }

  /**
   * Update send amount
   */
  public setSendAmount(channelId: string, sendId: string, amount: number): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const send = channel.sends.find((s) => s.id === sendId);
    if (!send) return;

    send.amount = Math.max(0, Math.min(1, amount));
  }

  /**
   * Remove send from channel
   */
  public removeSend(channelId: string, sendId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.sends = channel.sends.filter((s) => s.id !== sendId);
  }

  /**
   * Add insert to channel
   */
  public addInsert(channelId: string, effectId: string): InsertSlot {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const insert: InsertSlot = {
      id: `insert_${channelId}_${effectId}_${Date.now()}`,
      effectId,
      enabled: true,
      bypass: false,
      wetDry: 1,
    };

    channel.inserts.push(insert);
    return insert;
  }

  /**
   * Remove insert from channel
   */
  public removeInsert(channelId: string, insertId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.inserts = channel.inserts.filter((i) => i.id !== insertId);
  }

  /**
   * Update channel EQ
   */
  public setChannelEQ(channelId: string, eq: ParametricEQ): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.eq = eq;
  }

  /**
   * Update channel dynamics
   */
  public setChannelDynamics(channelId: string, dynamics: DynamicsProcessor): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.dynamics = dynamics;
  }

  /**
   * Toggle channel phase
   */
  public toggleChannelPhase(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    channel.phaseInverted = !channel.phaseInverted;
    return channel.phaseInverted;
  }

  /**
   * Create mix bus
   */
  public createBus(id: string, name: string, type: 'aux' | 'submix' = 'aux'): MixBus {
    const bus: MixBus = {
      id,
      name,
      type,
      fader: 0.8,
      faderDb: 0,
      pan: 0,
      muted: false,
      soloed: false,
      eq: this.createDefaultEQ(),
      dynamics: this.createDefaultDynamics(),
      peakLevel: -60,
      rmsLevel: -60,
      inputChannels: [],
    };

    this.buses.set(id, bus);
    return bus;
  }

  /**
   * Get bus by ID
   */
  public getBus(busId: string): MixBus | undefined {
    return this.buses.get(busId);
  }

  /**
   * Get all buses
   */
  public getAllBuses(): MixBus[] {
    return Array.from(this.buses.values());
  }

  /**
   * Update bus fader
   */
  public setBusFader(busId: string, fader: number): void {
    const bus = this.buses.get(busId);
    if (!bus) return;

    bus.fader = Math.max(0, Math.min(1, fader));
    bus.faderDb = this.linearToDb(bus.fader);
  }

  /**
   * Create VCA group
   */
  public createVCAGroup(id: string, name: string): VCAGroup {
    const vca: VCAGroup = {
      id,
      name,
      channelIds: [],
      masterFader: 1,
      masterMute: false,
    };

    this.vcaGroups.set(id, vca);
    return vca;
  }

  /**
   * Add channel to VCA group
   */
  public addChannelToVCA(channelId: string, vcaGroupId: string): void {
    const channel = this.channels.get(channelId);
    const vca = this.vcaGroups.get(vcaGroupId);

    if (!channel || !vca) return;

    // Remove from previous VCA group
    if (channel.vcaGroupId) {
      const prevVca = this.vcaGroups.get(channel.vcaGroupId);
      if (prevVca) {
        prevVca.channelIds = prevVca.channelIds.filter((id) => id !== channelId);
      }
    }

    channel.vcaGroupId = vcaGroupId;
    vca.channelIds.push(channelId);
  }

  /**
   * Remove channel from VCA group
   */
  public removeChannelFromVCA(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel || !channel.vcaGroupId) return;

    const vca = this.vcaGroups.get(channel.vcaGroupId);
    if (vca) {
      vca.channelIds = vca.channelIds.filter((id) => id !== channelId);
    }

    channel.vcaGroupId = null;
  }

  /**
   * Update VCA master fader
   */
  public setVCAFader(vcaGroupId: string, fader: number): void {
    const vca = this.vcaGroups.get(vcaGroupId);
    if (!vca) return;

    vca.masterFader = Math.max(0, Math.min(1, fader));

    // Apply to所有 channels in group
    for (const channelId of vca.channelIds) {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.fader = vca.masterFader;
        channel.faderDb = this.linearToDb(channel.fader);
      }
    }
  }

  /**
   * Toggle VCA master mute
   */
  public toggleVCAMute(vcaGroupId: string): boolean {
    const vca = this.vcaGroups.get(vcaGroupId);
    if (!vca) return false;

    vca.masterMute = !vca.masterMute;

    // Apply to all channels in group
    for (const channelId of vca.channelIds) {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.muted = vca.masterMute;
      }
    }

    return vca.masterMute;
  }

  /**
   * Convert linear to dB
   */
  private linearToDb(linear: number): number {
    if (linear <= 0) return -60;
    return 20 * Math.log10(linear);
  }

  /**
   * Convert dB to linear
   */
  private dbToLinear(db: number): number {
    if (db <= -60) return 0;
    return Math.pow(10, db / 20);
  }

  /**
   * Update channel metering
   */
  public updateChannelMetering(channelId: string, peak: number, rms: number): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.peakLevel = peak;
    channel.rmsLevel = rms;
  }

  /**
   * Update bus metering
   */
  public updateBusMetering(busId: string, peak: number, rms: number): void {
    const bus = this.buses.get(busId);
    if (!bus) return;

    bus.peakLevel = peak;
    bus.rmsLevel = rms;
  }

  /**
   * Get master bus
   */
  public getMasterBus(): MixBus | null {
    return this.masterBus;
  }

  /**
   * Delete channel
   */
  public deleteChannel(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    // Remove from VCA group
    if (channel.vcaGroupId) {
      this.removeChannelFromVCA(channelId);
    }

    this.channels.delete(channelId);
  }

  /**
   * Delete bus
   */
  public deleteBus(busId: string): void {
    if (busId === 'master') return; // Cannot delete master bus
    this.buses.delete(busId);
  }

  /**
   * Delete VCA group
   */
  public deleteVCAGroup(vcaGroupId: string): void {
    const vca = this.vcaGroups.get(vcaGroupId);
    if (!vca) return;

    // Remove all channels from group
    for (const channelId of vca.channelIds) {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.vcaGroupId = null;
      }
    }

    this.vcaGroups.delete(vcaGroupId);
  }

  /**
   * Reset all channels
   */
  public resetAllChannels(): void {
    for (const channel of this.channels.values()) {
      channel.fader = 0.8;
      channel.faderDb = 0;
      channel.pan = 0;
      channel.muted = false;
      channel.soloed = false;
      channel.phaseInverted = false;
      channel.eq = this.createDefaultEQ();
      channel.dynamics = this.createDefaultDynamics();
    }
  }

  /**
   * Reset all buses
   */
  public resetAllBuses(): void {
    for (const bus of this.buses.values()) {
      bus.fader = 0.8;
      bus.faderDb = 0;
      bus.pan = 0;
      bus.muted = false;
      bus.soloed = false;
      bus.eq = this.createDefaultEQ();
      bus.dynamics = this.createDefaultDynamics();
    }
  }
}

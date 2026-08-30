/**
 * 3WM SONIK — Asset Quality & LOD Manager
 *
 * Dynamically selects optimal asset variants (4K GLB, 2K GLB, 1K GLB, USDZ)
 * and rendering budgets based on device GPU, memory, network RTT, and viewport.
 */

export type QualityTier = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'AR';
export type AssetFormat = 'glb-4k' | 'glb-2k' | 'glb-1k' | 'glb-low' | 'usdz';

export interface DeviceProfile {
  tier: QualityTier;
  maxTextureResolution: 4096 | 2048 | 1024 | 512;
  recommendedVariant: AssetFormat;
  particleLimit: number;
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  antialias: boolean;
  pixelRatio: number;
  isAppleDevice: boolean;
  isMobile: boolean;
}

export interface AssetPerformanceMetrics {
  loadTimeMs: number;
  triangleCount: number;
  drawCalls: number;
  gpuMemoryMB: number;
  fps: number;
}

class AssetQualityManager {
  private profile: DeviceProfile;
  private metrics: AssetPerformanceMetrics = {
    loadTimeMs: 0,
    triangleCount: 0,
    drawCalls: 0,
    gpuMemoryMB: 0,
    fps: 60,
  };
  private listeners: Set<(profile: DeviceProfile) => void> = new Set<
    (profile: DeviceProfile) => void
  >();

  constructor() {
    this.profile = this.evaluateDeviceCapabilities();
    this.initNetworkListener();
  }

  public getProfile(): DeviceProfile {
    return this.profile;
  }

  public getMetrics(): AssetPerformanceMetrics {
    return this.metrics;
  }

  public updateMetrics(partial: Partial<AssetPerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...partial };
    if (this.metrics.fps < 30 && this.profile.tier !== 'LOW') {
      this.downgradeQuality();
    }
  }

  public subscribe(callback: (profile: DeviceProfile) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public selectAssetUrl(variants: {
    glb4k?: string;
    glb2k?: string;
    glb1k?: string;
    glb?: string;
    usdz?: string;
  }): string {
    if (this.profile.tier === 'AR' && variants.usdz) {
      return variants.usdz;
    }

    switch (this.profile.recommendedVariant) {
      case 'glb-4k':
        return variants.glb4k ?? variants.glb2k ?? variants.glb ?? variants.glb1k ?? '';
      case 'glb-2k':
        return variants.glb2k ?? variants.glb ?? variants.glb4k ?? variants.glb1k ?? '';
      case 'glb-1k':
      case 'glb-low':
        return variants.glb1k ?? variants.glb ?? variants.glb2k ?? '';
      case 'usdz':
        return variants.usdz ?? variants.glb ?? '';
      default:
        return variants.glb ?? variants.glb2k ?? variants.glb1k ?? '';
    }
  }

  private evaluateDeviceCapabilities(): DeviceProfile {
    if (typeof window === 'undefined') {
      return this.getDefaultProfile();
    }

    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const cores = navigator.hardwareConcurrency ?? 4;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceMemory = (navigator as any).deviceMemory ?? 4;
    const width = window.innerWidth;

    let tier: QualityTier = 'MEDIUM';
    if (isMobile) {
      tier = deviceMemory >= 6 && cores >= 8 ? 'MEDIUM' : 'LOW';
    } else {
      if (deviceMemory >= 8 && cores >= 8 && width >= 1440) {
        tier = 'ULTRA';
      } else if (deviceMemory >= 4 && cores >= 4) {
        tier = 'HIGH';
      } else {
        tier = 'MEDIUM';
      }
    }

    return this.buildProfileForTier(tier, isIOS, isMobile);
  }

  private buildProfileForTier(
    tier: QualityTier,
    isApple: boolean,
    isMobile: boolean
  ): DeviceProfile {
    switch (tier) {
      case 'ULTRA':
        return {
          tier: 'ULTRA',
          maxTextureResolution: 4096,
          recommendedVariant: 'glb-4k',
          particleLimit: 2000,
          postProcessingEnabled: true,
          shadowsEnabled: true,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio ?? 1, 2),
          isAppleDevice: isApple,
          isMobile,
        };
      case 'HIGH':
        return {
          tier: 'HIGH',
          maxTextureResolution: 2048,
          recommendedVariant: 'glb-2k',
          particleLimit: 1200,
          postProcessingEnabled: true,
          shadowsEnabled: true,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio ?? 1, 2),
          isAppleDevice: isApple,
          isMobile,
        };
      case 'MEDIUM':
        return {
          tier: 'MEDIUM',
          maxTextureResolution: 2048,
          recommendedVariant: 'glb-2k',
          particleLimit: 600,
          postProcessingEnabled: true,
          shadowsEnabled: false,
          antialias: true,
          pixelRatio: 1.5,
          isAppleDevice: isApple,
          isMobile,
        };
      case 'LOW':
      default:
        return {
          tier: 'LOW',
          maxTextureResolution: 1024,
          recommendedVariant: 'glb-1k',
          particleLimit: 300,
          postProcessingEnabled: false,
          shadowsEnabled: false,
          antialias: false,
          pixelRatio: 1,
          isAppleDevice: isApple,
          isMobile,
        };
    }
  }

  private getDefaultProfile(): DeviceProfile {
    return {
      tier: 'HIGH',
      maxTextureResolution: 2048,
      recommendedVariant: 'glb-2k',
      particleLimit: 1000,
      postProcessingEnabled: true,
      shadowsEnabled: true,
      antialias: true,
      pixelRatio: 1,
      isAppleDevice: false,
      isMobile: false,
    };
  }

  private downgradeQuality(): void {
    if (this.profile.tier === 'ULTRA') {
      this.profile = this.buildProfileForTier(
        'HIGH',
        this.profile.isAppleDevice,
        this.profile.isMobile
      );
    } else if (this.profile.tier === 'HIGH') {
      this.profile = this.buildProfileForTier(
        'MEDIUM',
        this.profile.isAppleDevice,
        this.profile.isMobile
      );
    } else if (this.profile.tier === 'MEDIUM') {
      this.profile = this.buildProfileForTier(
        'LOW',
        this.profile.isAppleDevice,
        this.profile.isMobile
      );
    }
    this.notifyListeners();
  }

  private initNetworkListener(): void {
    if (typeof window === 'undefined' || !('connection' in navigator)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', () => {
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          this.profile = this.buildProfileForTier(
            'LOW',
            this.profile.isAppleDevice,
            this.profile.isMobile
          );
          this.notifyListeners();
        }
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.profile));
  }
}

export const assetQualityManager = new AssetQualityManager();

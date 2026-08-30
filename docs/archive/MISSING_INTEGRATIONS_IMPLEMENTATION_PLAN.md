# 3WM SONIK — Missing Integrations Implementation Plan

**"ONE VISION. THREE MINDS. INFINITE SOUND."**

---

## EXECUTIVE SUMMARY

This document outlines the implementation strategy for completing the 8 key missing integrations identified from the Master Skills Megaplan pillars. Each integration is prioritized by business impact, technical complexity, and dependency requirements.

**Priority Levels:**

- 🔴 **HIGH** - Critical for production readiness, revenue generation, or core functionality
- 🟡 **MEDIUM** - Important for scalability, user experience, or operational efficiency
- 🟢 **LOW** - Nice-to-have enhancements that improve polish but aren't blocking

---

## 1. UPSTASH QSTASH — ASYNC BACKGROUND PROCESSING

**Pillar:** Pillar 1 (Triad Multi-Agent Intelligence)
**Priority:** 🔴 HIGH
**Estimated Effort:** 3-5 days
**Dependencies:** None (standalone integration)

### Business Value

- Offload heavy AI operations (stem separation, neural rendering) without blocking DAW UI
- Enable queue-based processing for large batch operations
- Improve user experience by maintaining 60 FPS during heavy compute

### Implementation Steps

#### Phase 1: Infrastructure Setup (Day 1)

1. **Install Dependencies**

   ```bash
   npm install @upstash/qstash
   ```

2. **Environment Configuration**
   - Add `QSTASH_URL` and `QSTASH_TOKEN` to `.env`
   - Create QStash project in Upstash dashboard
   - Configure rate limits and retry policies

3. **Create QStash Service Layer**
   - File: `src/services/qstashService.ts`
   - Implement queue client initialization
   - Create job scheduling interface
   - Add error handling and retry logic

#### Phase 2: Job Queue Implementation (Days 2-3)

1. **Define Job Types**

   ```typescript
   enum JobType {
     STEM_SEPARATION = 'stem_separation',
     NEURAL_DSP_RENDER = 'neural_dsp_render',
     AI_VIDEO_GENERATION = 'ai_video_generation',
     BATCH_AUDIO_EXPORT = 'batch_audio_export',
   }
   ```

2. **Create Job Schemas**
   - File: `src/schemas/job.schemas.ts`
   - Define input/output contracts for each job type
   - Add validation with Zod

3. **Implement Worker Functions**
   - File: `src/workers/qstashWorkers.ts`
   - Stem separation worker (demucs integration)
   - Neural DSP rendering worker
   - Batch export worker

#### Phase 3: Integration with Existing Services (Days 4-5)

1. **Update Audio Engine**
   - Modify `src/audio/stemSeparation.ts` to use QStash
   - Add job status polling
   - Update UI to show queue progress

2. **Update Export System**
   - Integrate with `src/components/export/ExportConfirmationModal.tsx`
   - Add background export capability
   - Implement notification system for job completion

3. **Testing & Monitoring**
   - Add job queue monitoring to dashboard
   - Implement job failure alerts
   - Add integration tests for queue operations

### Success Criteria

- ✅ Stem separation jobs complete in background without UI freeze
- ✅ Job status visible in real-time dashboard
- ✅ Failed jobs auto-retry up to 3 times
- ✅ Queue processing handles 100+ concurrent jobs

---

## 2. REMOTION — SOCIAL VIDEO RENDERING ENGINE

**Pillar:** Pillar 4 (Social Virality & Content)
**Priority:** 🔴 HIGH
**Estimated Effort:** 5-7 days
**Dependencies:** None (can parallel with QStash)

### Business Value

- Enable actual MP4 export for TikTok/Reels (currently only canvas preview)
- Programmatic video generation with audio-reactive visuals
- Viral content distribution capability for creators

### Implementation Steps

#### Phase 1: Remotion Setup (Day 1)

1. **Install Remotion**

   ```bash
   npm install remotion @remotion/cli
   npx remotion init
   ```

2. **Project Structure**
   - Create `remotion/` directory at root
   - Set up Remotion config (`remotion.config.ts`)
   - Configure composition entry points

3. **Integrate with Vite Build**
   - Update `vite.config.ts` for Remotion compatibility
   - Add Remotion build scripts to `package.json`

#### Phase 2: Video Composition Development (Days 2-4)

1. **Create Base Composition**
   - File: `remotion/src/SocialTeaser.tsx`
   - Port existing canvas logic from `SocialVideoGeneratorModal.tsx`
   - Implement Remotion's `<Sequence>` and `<Audio>` components

2. **Audio-Reactive Visuals**
   - File: `remotion/src/components/AudioVisualizer.tsx`
   - Use Remotion's `useCurrentFrame()` for frame-perfect sync
   - Implement FFT data visualization with `useAudioData()`

3. **Agent Reaction Overlays**
   - File: `remotion/src/components/AgentReaction.tsx`
   - Animated typography for agent quotes
   - Theme-based color transitions (Lagos Fire, Scientist Neon, Oracle Gold)

4. **Branding & Metadata**
   - Add 3WM SONIK logo animation
   - Implement track metadata overlays (BPM, key, mastered status)
   - Add TikTok/Reels format badges

#### Phase 3: Export Integration (Days 5-7)

1. **Backend Rendering Service**
   - File: `src/services/remotionRenderService.ts`
   - Implement Remotion render API calls
   - Add progress tracking and webhook notifications

2. **Update Frontend Modal**
   - Modify `SocialVideoGeneratorModal.tsx` to trigger real renders
   - Replace mock progress with actual render progress
   - Add download functionality for completed MP4s

3. **Quality Optimization**
   - Configure H.264 encoding settings
   - Optimize for 9:16 portrait (1080×1920)
   - Add bitrate control for file size limits

4. **Testing**
   - Render test videos across all themes
   - Verify audio sync accuracy
   - Performance benchmark for render times

### Success Criteria

- ✅ Export 30-second 9:16 video in under 2 minutes
- ✅ Audio-visual sync within 1 frame accuracy
- ✅ File size under 15MB for 30s video
- ✅ All three themes render correctly

---

## 3. STRIPE / LEMONSQUEEZY — PAYMENT INTEGRATION

**Pillar:** Pillar 5 (Enterprise SaaS & Monetization)
**Priority:** 🔴 HIGH
**Estimated Effort:** 5-7 days
**Dependencies:** Organization service (already implemented)

### Business Value

- Enable actual subscription payments (currently only mock pricing)
- PCI-compliant checkout flow
- Recurring billing and subscription management

### Implementation Steps

#### Phase 1: Payment Provider Setup (Day 1)

1. **Choose Provider**
   - Recommendation: **Stripe** (better for recurring subscriptions, webhooks)
   - Alternative: LemonSqueezy (simpler setup, but less flexible)

2. **Account Configuration**
   - Create Stripe account
   - Configure products (Free, Pro Studio $29, Master Label $79)
   - Set up webhook endpoints
   - Enable test mode for development

3. **Install SDK**
   ```bash
   npm install stripe
   ```

#### Phase 2: Backend Integration (Days 2-4)

1. **Stripe Service Layer**
   - File: `src/services/stripeService.ts`
   - Initialize Stripe client with API key
   - Implement checkout session creation
   - Add customer management

2. **Webhook Handlers**
   - File: `src/routes/webhooks/stripe.ts`
   - Handle `checkout.session.completed`
   - Handle `customer.subscription.updated`
   - Handle `invoice.payment_succeeded/failed`

3. **Subscription Management**
   - Update `organizationService.ts` with Stripe subscription IDs
   - Sync plan changes with Stripe
   - Implement proration logic for upgrades/downgrades

4. **AI Credit System**
   - Integrate with existing `deductAiCredits()` method
   - Add credit top-up via Stripe payment intent
   - Implement overage billing

#### Phase 3: Frontend Checkout Flow (Days 5-7)

1. **Update Payment Modal**
   - File: `src/components/pricing/PaymentCheckoutModal.tsx`
   - Integrate Stripe Checkout (redirect mode)
   - Add pricing display with feature comparison
   - Implement trial period offers

2. **Subscription Management UI**
   - File: `src/components/views/UsageBillingView.tsx`
   - Display current plan and usage
   - Add upgrade/downgrade buttons
   - Show payment history and invoices

3. **Auth Flow Integration**
   - Link Stripe customer to Firebase auth user
   - Handle post-checkout redirects
   - Update user context with subscription status

4. **Testing**
   - Test checkout flow in Stripe test mode
   - Verify webhook processing
   - Test subscription lifecycle (trial → active → cancel)

### Success Criteria

- ✅ Complete checkout flow in under 2 minutes
- ✅ Subscription status updates within 5 seconds of webhook
- ✅ AI credits correctly allocated after payment
- ✅ PCI compliance with Stripe Checkout

---

## 4. APIFY — MARKET INTELLIGENCE SCRAPING

**Pillar:** Pillar 7 (Market Intelligence & Growth)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 4-5 days
**Dependencies:** None

### Business Value

- Automated trending data collection (BPMs, chord progressions, viral sounds)
- Influencer discovery for marketing campaigns
- Programmatic SEO content generation

### Implementation Steps

#### Phase 1: Apify Setup (Day 1)

1. **Account Configuration**
   - Create Apify account
   - Configure API tokens
   - Set up actors for scraping targets

2. **Install SDK**

   ```bash
   npm install apify
   ```

3. **Environment Variables**
   - Add `APIFY_API_TOKEN` to `.env`
   - Configure rate limits and quotas

#### Phase 2: Scraping Actors (Days 2-3)

1. **Trend Scraping Actor**
   - File: `src/services/apify/actors/trendScraper.ts`
   - Target: TikTok trending sounds, Spotify viral charts
   - Extract: BPM, key, genre tags, engagement metrics
   - Schedule: Daily runs

2. **Influencer Discovery Actor**
   - File: `src/services/apify/actors/influencerScraper.ts`
   - Target: Instagram/TikTok Afrobeat producers
   - Extract: Follower count, engagement rate, content themes
   - Schedule: Weekly runs

3. **Sound Pattern Analysis**
   - File: `src/services/apify/actors/soundPatternScraper.ts`
   - Target: YouTube tutorials, SoundCloud trending
   - Extract: Drum patterns, synth presets, vocal styles
   - Schedule: Bi-weekly runs

#### Phase 3: Data Integration (Days 4-5)

1. **Update Market Intelligence Service**
   - File: `src/services/marketIntelligenceService.ts`
   - Replace static `GENRE_MARKET_TRENDS` with Apify data
   - Add data freshness indicators
   - Implement trend velocity calculations

2. **Automated SEO Generation**
   - File: `src/services/apify/seoGenerator.ts`
   - Generate landing pages for trending sounds
   - Create programmatic blog posts
   - Update sitemap with new pages

3. **Dashboard Integration**
   - Add trend visualization to dashboard
   - Display influencer recommendations
   - Show viral sound opportunity scores

4. **Testing**
   - Verify data accuracy against manual checks
   - Test actor scheduling and retries
   - Validate SEO output quality

### Success Criteria

- ✅ Daily trend data updates with 95% accuracy
- ✅ Identify 50+ relevant influencers per week
- ✅ Generate 100+ SEO pages per month automatically
- ✅ Trend predictions within 10% of actual viral hits

---

## 5. VITEST MIGRATION & PRE-SHIP GATES

**Pillar:** Pillar 6 (Quality Engineering)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 3-4 days
**Dependencies:** Existing Jest test suite

### Business Value

- Faster test execution (Vitest is 10x faster than Jest)
- Native ESM support (better compatibility with Vite)
- Automated pre-ship quality gates

### Implementation Steps

#### Phase 1: Vitest Setup (Day 1)

1. **Install Vitest**

   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   ```

2. **Configuration**
   - File: `vitest.config.ts`
   - Migrate Jest config to Vitest
   - Configure coverage thresholds
   - Set up UI mode for debugging

3. **Update Scripts**
   ```json
   {
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest --coverage"
   }
   ```

#### Phase 2: Test Migration (Days 2-3)

1. **Batch Migration**
   - Update import statements (Jest → Vitest globals)
   - Replace Jest mocks with Vitest mocks
   - Update async test patterns

2. **Audio Test Enhancements**
   - File: `src/audio/__tests__/audioWorklet.test.ts` (new)
   - Add Web Audio API mock for Vitest
   - Test AudioWorklet processor lifecycle
   - Verify DSP parameter modulation

3. **WebGL Leak Detection**
   - File: `src/three/__tests__/webglLeaks.test.ts` (new)
   - Track geometry/material disposal
   - Test context loss recovery
   - Verify texture cleanup

#### Phase 3: Pre-Ship Gates (Day 4)

1. **CI/CD Integration**
   - File: `.github/workflows/pre-ship.yml`
   - Add test run as PR requirement
   - Configure coverage gates (80% minimum)
   - Add bundle size checks

2. **Automated Audits**
   - Memory leak detection
   - Performance regression tests
   - Bundle size validation (<250kb initial)

3. **Release Checklist**
   - File: `scripts/pre-ship-checklist.sh`
   - Automated version bumping
   - Changelog generation
   - Git tag creation

### Success Criteria

- ✅ All 30+ existing tests pass in Vitest
- ✅ Test suite runs in under 30 seconds (vs 3+ minutes in Jest)
- ✅ Coverage maintained at 80%+
- ✅ Pre-ship gates block failing PRs

---

## 6. PWA SERVICE WORKER — OFFLINE CAPABILITIES

**Pillar:** Pillar 3 (Audio DSP Engine)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 2-3 days
**Dependencies:** Vite PWA plugin

### Business Value

- Offline DAW functionality for producers without internet
- Faster load times with asset caching
- Mobile app-like experience

### Implementation Steps

#### Phase 1: PWA Setup (Day 1)

1. **Install PWA Plugin**

   ```bash
   npm install -D vite-plugin-pwa
   ```

2. **Configuration**
   - File: `vite.config.ts` (update)
   - Add workbox configuration
   - Define caching strategies (audio files, samples, fonts)
   - Configure offline fallback

3. **Manifest Generation**
   - File: `public/manifest.json`
   - Add app metadata (name, icons, theme colors)
   - Define display mode (standalone)
   - Configure orientation (landscape for DAW)

#### Phase 2: Asset Caching (Day 2)

1. **Audio Asset Caching**
   - Cache drum samples and soundfonts
   - Implement cache-first strategy for large files
   - Add version-based cache invalidation

2. **Offline Mode Detection**
   - File: `src/hooks/useOfflineMode.ts`
   - Detect network status changes
   - Show offline indicator in UI
   - Queue operations for sync when online

3. **Sync Queue**
   - File: `src/services/offlineSync.ts`
   - Queue project saves during offline
   - Sync with Firebase on reconnection
   - Handle conflict resolution

#### Phase 3: Testing & Deployment (Day 3)

1. **Offline Testing**
   - Test DAW functionality without network
   - Verify audio playback from cache
   - Test project save/load offline

2. **Mobile Testing**
   - Test on iOS Safari (add to home screen)
   - Test on Android Chrome
   - Verify orientation handling

3. **Deployment**
   - Configure service worker scope
   - Test update flow (new version detection)
   - Add skip-waiting for immediate updates

### Success Criteria

- ✅ DAW fully functional offline after first load
- ✅ Audio samples cached and playable without network
- ✅ Project changes sync automatically on reconnection
- ✅ Installable as mobile app

---

## 7. 3D ENHANCEMENTS — GLTF AVATARS & AUDIO-REACTIVE SHADERS

**Pillar:** Pillar 2 (Immersive 3D Visual Studio)
**Priority:** 🟢 LOW
**Estimated Effort:** 4-5 days
**Dependencies:** Three.js components (already implemented)

### Business Value

- Visual representation of agents as 3D avatars
- Enhanced immersion with audio-reactive effects
- Premium visual polish for brand identity

### Implementation Steps

#### Phase 1: Avatar Creation (Days 1-2)

1. **3D Modeling**
   - Create GLTF 2.0 models for Emar, Ricky, Kingpin
   - Use Blender or external 3D artist
   - Optimize for low draw calls (<10k polygons each)
   - Add rigging for subtle animations

2. **Asset Integration**
   - Directory: `public/models/agents/`
   - Add `emar.glb`, `ricky.glb`, `kingpin.glb`
   - Create fallback placeholder models
   - Optimize file sizes (<2MB each)

3. **Avatar Component**
   - File: `src/three/components/AgentAvatar.tsx`
   - Load GLTF models with useGLTF
   - Implement idle animations
   - Add state-based reactions (analyzing, processing, error)

#### Phase 2: Audio-Reactive Shaders (Days 3-4)

1. **Shader Uniforms**
   - File: `src/three/shaders/audioReactiveShader.ts`
   - Define uniforms: `u_bassEnergy`, `u_trebleFlux`, `u_bpmPhase`
   - Create vertex shader for mesh deformation
   - Create fragment shader for color/emission

2. **Integration with Audio Engine**
   - Update `src/three/hooks/useAudioAnalyzer.ts`
   - Extract FFT bands for uniforms
   - Calculate BPM phase from transport
   - Pass data to shader via R3F useFrame

3. **Agent-Specific Effects**
   - Emar: Mint glow pulses on spectral analysis
   - Ricky: Gold fire bursts on 808 transients
   - Kingpin: Crimson aura intensity on vocal detection

#### Phase 3: Performance Optimization (Day 5)

1. **LOD System**
   - Reduce detail when agents are distant
   - Disable audio reactivity when not visible
   - Use instanced rendering for particles

2. **Fallback System**
   - Detect WebGL capability level
   - Fall back to simple geometry on low-end devices
   - Disable shaders if performance <30 FPS

3. **Testing**
   - Test across devices (desktop, mobile, tablet)
   - Profile GPU memory usage
   - Verify 60 FPS target

### Success Criteria

- ✅ Agent avatars load in under 2 seconds
- ✅ Audio reactivity maintains 60 FPS
- ✅ Fallback system works on low-end devices
- ✅ GPU memory usage <200MB

---

## 8. AUDIOWORKLET — LOW-LATENCY DSP

**Pillar:** Pillar 3 (Audio DSP Engine)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 4-5 days
**Dependencies:** Existing DSP pipeline

### Business Value

- Sub-5ms audio latency for real-time processing
- Better performance than main-thread AudioNodes
- Professional-grade DAW responsiveness

### Implementation Steps

#### Phase 1: AudioWorklet Processor (Days 1-2)

1. **Processor Architecture**
   - File: `src/audio/worklets/dspProcessor.ts`
   - Implement AudioWorkletProcessor class
   - Define parameter descriptors (gain, frequency, Q)
   - Add message port for control signals

2. **DSP Algorithms**
   - Implement EQ biquad filters
   - Add compressor with attack/release
   - Create saturation curve
   - Implement reverb impulse convolution

3. **Parameter Smoothing**
   - Prevent zipper noise on parameter changes
   - Implement exponential smoothing
   - Add automation ramp support

#### Phase 2: Integration (Days 3-4)

1. **Worklet Loader**
   - File: `src/audio/workletLoader.ts`
   - Dynamically load processor files
   - Handle browser compatibility
   - Add fallback to AudioNodes if unsupported

2. **Update DSP Graph Builder**
   - File: `src/audio/dspGraphBuilder.ts`
   - Replace AudioNodes with AudioWorkletNodes
   - Maintain backward compatibility
   - Add worklet node factory

3. **Performance Testing**
   - Measure latency with timing API
   - Profile CPU usage per processor
   - Test with 20+ concurrent processors

#### Phase 3: Browser Compatibility (Day 5)

1. **Feature Detection**
   - Detect AudioWorklet support
   - Provide graceful degradation
   - Show warning if not supported

2. **Safari Support**
   - Test on Safari (limited AudioWorklet support)
   - Implement fallback for iOS
   - Document known limitations

3. **Testing Suite**
   - File: `src/audio/__tests__/audioWorklet.test.ts`
   - Test processor lifecycle
   - Verify parameter modulation
   - Test automation curves

### Success Criteria

- ✅ Audio latency <5ms (vs 20-50ms with AudioNodes)
- ✅ CPU usage reduced by 30%+
- ✅ All existing DSP effects work with Worklets
- ✅ Fallback to AudioNodes on unsupported browsers

---

## IMPLEMENTATION TIMELINE

### Sprint 1 (Week 1-2): Critical Revenue & Performance

- **Week 1:** Stripe Payment Integration (Days 1-7)
- **Week 2:** Upstash QStash + Remotion Video (Days 1-7)

### Sprint 2 (Week 3-4): Quality & Scalability

- **Week 3:** Vitest Migration + Pre-Ship Gates (Days 1-4)
- **Week 4:** PWA Service Worker (Days 1-3)

### Sprint 3 (Week 5-6): Growth & Polish

- **Week 5:** Apify Market Intelligence (Days 1-5)
- **Week 6:** AudioWorklet DSP (Days 1-5)

### Sprint 4 (Week 7): Visual Enhancements

- **Week 7:** 3D Avatars & Audio-Reactive Shaders (Days 1-5)

---

## RISK MITIGATION

| Risk                         | Impact | Mitigation                                                |
| ---------------------------- | ------ | --------------------------------------------------------- |
| Stripe webhook delays        | Medium | Implement idempotent handlers, add retry logic            |
| Remotion render timeouts     | High   | Add job queuing via QStash, implement progress monitoring |
| AudioWorklet browser support | Medium | Graceful fallback to AudioNodes, clear user messaging     |
| Apify rate limits            | Low    | Cache results, implement exponential backoff              |
| PWA cache invalidation bugs  | Medium | Version-based cache busting, manual clear option          |

---

## SUCCESS METRICS

### Technical Metrics

- **Test Execution Time:** <30 seconds (Vitest vs 3+ minutes Jest)
- **Audio Latency:** <5ms (AudioWorklet vs 20-50ms AudioNodes)
- **Video Render Time:** <2 minutes for 30s video
- **Offline Functionality:** 100% DAW features available offline

### Business Metrics

- **Conversion Rate:** +15% with Stripe checkout
- **Viral Content:** +50 social videos exported/week
- **User Engagement:** +20% session time with PWA
- **Market Intelligence:** 100+ SEO pages generated/month

---

🔱 **3WM SONIK: ONE VISION. THREE MINDS. INFINITE SOUND.**

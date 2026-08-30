# 3WM SONIK - Next Steps Implementation Plan

## Overview

This document outlines the implementation plan for integrating the newly created features into the 3WM SONIK core system, along with future enhancements to expand capabilities.

---

## Phase 1: Audio Engine Integration (High Priority)

### 1.1 Connect dspManager to Existing Audio Engine

**Objective**: Integrate the new AudioWorklet DSP system with the existing audio engine.

**Tasks**:

- Locate the existing audio engine entry point (`src/audio/engine.ts`)
- Import `dspManager` singleton
- Initialize `dspManager` with the existing AudioContext
- Add DSP node creation to track/channel initialization
- Implement DSP node routing in the audio graph

**Acceptance Criteria**:

- dspManager initializes successfully with audio engine
- DSP nodes are created for each track
- Audio flows through DSP chain without errors
- Fallback mode activates when AudioWorklet unavailable

**Estimated Time**: 2-3 days

**Dependencies**: None

---

### 1.2 Wire Audio Analysis from Master Bus to AgentAvatarContainer

**Objective**: Connect real-time audio analysis to the 3D avatar system.

**Tasks**:

- Identify master bus output in audio engine
- Create AnalyserNode connected to master bus
- Pass analyser to AgentAvatarContainer via props or context
- Optimize analysis frequency for performance (60fps target)
- Implement audio data smoothing for smoother animations

**Acceptance Criteria**:

- Bass energy, treble flux, and BPM phase are calculated in real-time
- Avatar animations respond smoothly to audio changes
- Performance impact is minimal (<5% CPU)
- Audio analysis works in both worklet and fallback modes

**Estimated Time**: 1-2 days

**Dependencies**: 1.1 (dspManager integration)

---

### 1.3 Implement Parameter Automation from UI Controls

**Objective**: Enable UI controls to manipulate DSP parameters in real-time.

**Tasks**:

- Create DSP parameter UI components (sliders, knobs)
- Connect UI controls to dspManager parameter setters
- Implement parameter automation recording/playback
- Add preset save/load functionality for DSP settings
- Create visual feedback for parameter changes

**Acceptance Criteria**:

- All DSP parameters are controllable via UI
- Parameter changes apply in real-time with <10ms latency
- Presets can be saved and loaded
- Automation can be recorded and played back
- UI reflects current parameter values

**Estimated Time**: 3-4 days

**Dependencies**: 1.1 (dspManager integration)

---

## Phase 2: Agent System Integration (High Priority)

### 2.1 Connect useAgentAvatarIntegration to ThreeWMOrchestrator

**Objective**: Bridge the avatar system with the agent orchestration layer.

**Tasks**:

- Review ThreeWMOrchestrator state management
- Create event emitter or state subscription mechanism
- Connect avatar state updates to orchestrator events
- Implement bidirectional communication (avatar → orchestrator)
- Add error handling for connection failures

**Acceptance Criteria**:

- Avatar states reflect actual agent states from orchestrator
- State changes propagate in <100ms
- Connection is resilient to failures
- No memory leaks from event subscriptions

**Estimated Time**: 2-3 days

**Dependencies**: None

---

### 2.2 Map Agent States to Avatar Animations

**Objective**: Ensure avatar animations accurately represent agent states.

**Tasks**:

- Define state-to-animation mapping for each agent
- Implement animation transitions with smooth blending
- Add state-specific visual effects (colors, particles)
- Create animation state machine for complex transitions
- Test all state combinations

**Acceptance Criteria**:

- Each agent state has a corresponding animation
- Transitions between states are smooth (<500ms)
- Visual effects match agent personality (Emar: data viz, Ricky: energetic, Kingpin: commanding)
- No animation glitches during rapid state changes

**Estimated Time**: 2-3 days

**Dependencies**: 2.1 (Orchestrator connection)

---

### 2.3 Display Agent Responses in Avatar Reactions

**Objective**: Visualize agent responses through avatar reactions.

**Tasks**:

- Parse agent response text for emotional content
- Map emotional content to avatar reactions
- Implement text-to-speech lip-sync for Kingpin
- Add gesture animations for Ricky based on response type
- Create data visualization overlays for Emar's technical responses

**Acceptance Criteria**:

- Avatar reactions match agent response content
- Lip-sync is accurate within 50ms
- Gestures are contextually appropriate
- Data visualizations are clear and informative
- Reactions enhance producer understanding

**Estimated Time**: 4-5 days

**Dependencies**: 2.2 (State mapping), GLTF models

---

## Phase 3: 3D Asset Creation (High Priority)

### 3.1 Create GLTF 3D Models for Agents

**Objective**: Create production-ready 3D models for Emar, Ricky, and Kingpin.

**Tasks**:

- Design character concepts for each agent
- Create base meshes in Blender/Maya
- Rig models for animation
- Create animations: idle, analyzing, processing, success, error
- Export as GLTF with embedded animations
- Optimize models for web (poly count, texture size)
- Test models in AgentAvatar component

**Acceptance Criteria**:

- Models load successfully in browser
- Animations play smoothly at 60fps
- Total model size <5MB per agent
- Models match agent visual identity
- Fallback geometry works if models fail to load

**Estimated Time**: 5-7 days

**Dependencies**: None (can be done in parallel)

---

## Phase 4: CI/CD Configuration (Medium Priority)

### 4.1 Configure GitHub Actions Repository Secrets

**Objective**: Set up secrets for automated workflows.

**Tasks**:

- Identify required secrets (codecov token, etc.)
- Add secrets to GitHub repository settings
- Update workflow files to use secrets
- Test workflows with secrets
- Document secret management process

**Acceptance Criteria**:

- All workflows run successfully with secrets
- Secrets are not exposed in logs
- Secret rotation process is documented

**Estimated Time**: 0.5-1 day

**Dependencies**: None

---

### 4.2 Enable Codecov Integration

**Objective**: Set up code coverage reporting and tracking.

**Tasks**:

- Create Codecov account
- Connect GitHub repository to Codecov
- Configure coverage thresholds
- Set up coverage badges in README
- Configure coverage comments on PRs

**Acceptance Criteria**:

- Coverage reports appear on Codecov dashboard
- Coverage badges display in README
- PR comments show coverage changes
- Coverage thresholds are enforced in CI

**Estimated Time**: 0.5-1 day

**Dependencies**: 4.1 (GitHub secrets)

---

## Phase 5: Advanced DSP Features (Low Priority)

### 5.1 Add Chorus, Phaser, Flanger Effects

**Objective**: Expand DSP effect palette with modulation effects.

**Tasks**:

- Implement chorus algorithm (LFO-modulated delay)
- Implement phaser algorithm (all-pass filter sweep)
- Implement flanger algorithm (short delay with feedback)
- Add to AudioWorklet processor
- Create fallback AudioNode implementations
- Add UI controls for new effects

**Acceptance Criteria**:

- All effects produce characteristic sound
- Effects work in both worklet and fallback modes
- CPU usage remains acceptable
- UI controls are intuitive

**Estimated Time**: 3-4 days

**Dependencies**: Phase 1 complete

---

### 5.2 Implement Sidechain Compression

**Objective**: Add sidechain compression for ducking effects.

**Tasks**:

- Implement sidechain signal routing
- Add sidechain threshold/ratio controls
- Create sidechain source selection
- Implement lookahead for timing accuracy
- Add visual feedback for sidechain activity

**Acceptance Criteria**:

- Sidechain triggers correctly from source
- Ducking is smooth and musical
- Multiple tracks can sidechain from same source
- Visual feedback shows sidechain activity

**Estimated Time**: 2-3 days

**Dependencies**: Phase 1 complete

---

### 5.3 Add Spectral Analysis Visualization

**Objective**: Create real-time frequency spectrum display.

**Tasks**:

- Implement FFT analysis in worklet
- Create spectrum visualization component
- Add frequency band highlighting
- Implement peak hold and decay
- Optimize for 60fps rendering

**Acceptance Criteria**:

- Spectrum updates smoothly at 60fps
- Frequency bands are accurate
- Peak hold works correctly
- Performance impact is minimal

**Estimated Time**: 2-3 days

**Dependencies**: Phase 1 complete, Phase 2 complete

---

## Phase 6: Avatar AI Enhancements (Low Priority)

### 6.1 Implement Lip-Sync for Kingpin

**Objective**: Synchronize Kingpin's mouth movements with speech.

**Tasks**:

- Integrate text-to-speech API
- Implement phoneme extraction
- Create mouth shape blend shapes
- Map phonemes to blend shapes
- Smooth transitions between shapes

**Acceptance Criteria**:

- Lip-sync is accurate within 50ms
- Transitions are smooth
- Works with all supported TTS voices
- Performance impact is minimal

**Estimated Time**: 4-5 days

**Dependencies**: 3.1 (GLTF models with blend shapes)

---

### 6.2 Add Gesture Animations for Ricky

**Objective**: Create context-aware gestures for Ricky.

**Tasks**:

- Design gesture library (approving, questioning, excited, etc.)
- Create gesture animations in 3D software
- Integrate gesture triggers based on response content
- Implement gesture blending with base animations
- Add gesture intensity controls

**Acceptance Criteria**:

- Gestures match response context
- Blending is smooth
- Gestures enhance communication
- Performance impact is minimal

**Estimated Time**: 3-4 days

**Dependencies**: 3.1 (GLTF models)

---

### 6.3 Create Data Visualization for Emar

**Objective**: Display technical data through Emar's avatar.

**Tasks**:

- Design data visualization concepts (waveforms, spectra, parameters)
- Implement visualization components
- Integrate with Emar's response data
- Create holographic projection effect
- Add interactive data exploration

**Acceptance Criteria**:

- Visualizations are clear and informative
- Match Emar's technical personality
- Interactive elements work smoothly
- Performance impact is minimal

**Estimated Time**: 4-5 days

**Dependencies**: Phase 2 complete

---

## Phase 7: Market Intelligence UI (Low Priority)

### 7.1 Create Trend Visualization Dashboard

**Objective**: Build UI for displaying market trend data.

**Tasks**:

- Design dashboard layout
- Create trend chart components (BPM, keys, genres)
- Implement real-time data updates
- Add filtering and comparison tools
- Create trend history views

**Acceptance Criteria**:

- Dashboard displays all trend data clearly
- Updates in real-time
- Filtering works correctly
- Performance is smooth

**Estimated Time**: 3-4 days

**Dependencies**: None (Apify integration complete)

---

### 7.2 Add Influencer Discovery Interface

**Objective**: Build UI for discovering and filtering influencers.

**Tasks**:

- Design influencer list/grid layout
- Implement filtering (genre, followers, engagement)
- Add sorting options
- Create influencer detail views
- Implement contact/export functionality

**Acceptance Criteria**:

- Influencers display with key metrics
- Filtering and sorting work correctly
- Detail views show comprehensive info
- Export functionality works

**Estimated Time**: 3-4 days

**Dependencies**: None (Apify integration complete)

---

### 7.3 Implement Trend-Based Preset Recommendations

**Objective**: Suggest presets based on current trends.

**Tasks**:

- Analyze trend data for preset patterns
- Create recommendation algorithm
- Build preset suggestion UI
- Implement one-click preset application
- Add recommendation confidence scores

**Acceptance Criteria**:

- Recommendations are relevant to trends
- UI is clear and actionable
- Presets apply correctly
- Confidence scores are accurate

**Estimated Time**: 2-3 days

**Dependencies**: 7.1 (Trend dashboard)

---

## Phase 8: Testing Expansion (Medium Priority)

### 8.1 Write Comprehensive Test Suite for New Features

**Objective**: Ensure all new features are thoroughly tested.

**Tasks**:

- Write unit tests for Apify services
- Write unit tests for DSP components
- Write unit tests for avatar components
- Write integration tests for audio engine
- Achieve 80%+ coverage

**Acceptance Criteria**:

- All new features have unit tests
- Coverage threshold met
- Tests pass consistently
- No flaky tests

**Estimated Time**: 4-5 days

**Dependencies**: All feature phases complete

---

### 8.2 Add E2E Tests for PWA Functionality

**Objective**: Test PWA installation and offline functionality.

**Tasks**:

- Write Playwright tests for PWA installation
- Test offline mode functionality
- Test service worker caching
- Test update mechanisms
- Test across browsers

**Acceptance Criteria**:

- PWA installs correctly
- Offline mode works as expected
- Caching strategies work correctly
- Updates apply smoothly
- Tests pass on all target browsers

**Estimated Time**: 2-3 days

**Dependencies**: Phase 3 (PWA) complete

---

### 8.3 Performance Testing for AudioWorklet

**Objective**: Ensure AudioWorklet performance meets requirements.

**Tasks**:

- Measure latency in various scenarios
- Test CPU usage under load
- Test with multiple concurrent DSP nodes
- Profile memory usage
- Optimize bottlenecks

**Acceptance Criteria**:

- Latency <5ms in worklet mode
- CPU usage <30% at 48kHz
- Memory usage stable over time
- No audio glitches under load

**Estimated Time**: 2-3 days

**Dependencies**: Phase 1 complete

---

## Timeline Summary

| Phase                             | Priority | Estimated Time | Dependencies     |
| --------------------------------- | -------- | -------------- | ---------------- |
| Phase 1: Audio Engine Integration | High     | 6-9 days       | None             |
| Phase 2: Agent System Integration | High     | 8-11 days      | None             |
| Phase 3: 3D Asset Creation        | High     | 5-7 days       | None (parallel)  |
| Phase 4: CI/CD Configuration      | Medium   | 1-2 days       | None             |
| Phase 5: Advanced DSP Features    | Low      | 7-9 days       | Phase 1          |
| Phase 6: Avatar AI Enhancements   | Low      | 11-14 days     | Phase 2, Phase 3 |
| Phase 7: Market Intelligence UI   | Low      | 8-11 days      | None             |
| Phase 8: Testing Expansion        | Medium   | 8-11 days      | All features     |

**Total Estimated Time**: 54-74 days (approximately 8-11 weeks)

---

## Risk Mitigation

### High Priority Risks

1. **Audio Engine Integration Complexity**
   - Risk: Existing audio engine may not easily integrate with new DSP system
   - Mitigation: Create integration branch, implement incrementally, maintain fallback

2. **3D Model Creation Delays**
   - Risk: Model creation may take longer than estimated
   - Mitigation: Use fallback geometry during development, outsource if needed

3. **Performance Issues with Audio Analysis**
   - Risk: Real-time audio analysis may impact DAW performance
   - Mitigation: Optimize analysis frequency, use Web Workers if needed

### Medium Priority Risks

1. **Orchestrator State Management**
   - Risk: Current orchestrator may not expose state for avatar integration
   - Mitigation: Extend orchestrator with state subscription API

2. **CI/CD Configuration Issues**
   - Risk: GitHub Actions may have configuration issues
   - Mitigation: Test workflows locally with act, start with simple checks

### Low Priority Risks

1. **Advanced DSP Complexity**
   - Risk: Complex effects may be difficult to implement in AudioWorklet
   - Mitigation: Implement simpler versions first, iterate

2. **Avatar AI Accuracy**
   - Risk: Lip-sync and gestures may not be accurate enough
   - Mitigation: Use proven libraries, accept reasonable approximation

---

## Success Criteria

### Phase Completion Criteria

- **Phase 1**: Audio flows through DSP chain, parameters controllable via UI
- **Phase 2**: Avatars reflect agent states and respond to audio
- **Phase 3**: GLTF models load and animate correctly
- **Phase 4**: CI/CD workflows run successfully
- **Phase 5**: New DSP effects work in both modes
- **Phase 6**: Avatar AI features enhance communication
- **Phase 7**: Market intelligence UI is usable and informative
- **Phase 8**: Test coverage meets thresholds, performance acceptable

### Overall Success Criteria

- All high-priority phases complete
- Test coverage ≥80%
- PWA works offline
- AudioWorklet latency <5ms
- Avatars enhance producer experience
- Market intelligence data is actionable
- CI/CD prevents regressions

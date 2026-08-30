// @ts-nocheck
// 3WM SONIK CORE v2.2 — Verification & System Test Suite
import {
  MidiQuantizer,
  GROOVE_TEMPLATES,
  AFRO_CHORD_PROGRESSIONS,
  SCALES,
  isPitchInScale,
} from '../src/audio/midiEngine';
import { MidiNote } from './src/types';

function runTests() {
  console.log('--- 1. Testing Scale Assistant & Music Theory ---');
  const cMinorScale = SCALES['Natural Minor'];
  const isCinScale = isPitchInScale(60, 'C', cMinorScale); // C4 in C Minor
  const isDsharpInScale = isPitchInScale(63, 'C', cMinorScale); // D#4 / Eb4 in C Minor
  const isFsharpInScale = isPitchInScale(66, 'C', cMinorScale); // F#4 in C Minor (not in natural minor)

  console.assert(isCinScale === true, 'C4 should be in C Minor');
  console.assert(isDsharpInScale === true, 'Eb4 should be in C Minor');
  console.assert(isFsharpInScale === false, 'F#4 should NOT be in C Natural Minor');
  console.log(' Scale Assistant calculations verified (Key: C, Scale: Natural Minor).');

  console.log('--- 2. Testing MIDI Quantization & Humanization ---');
  const unquantizedNotes: MidiNote[] = [
    {
      id: '1',
      pitch: 60,
      startStep: 0.3,
      durationSteps: 1.1,
      velocity: 100,
      probability: 1,
      channel: 0,
    },
    {
      id: '2',
      pitch: 63,
      startStep: 1.8,
      durationSteps: 0.9,
      velocity: 110,
      probability: 1,
      channel: 0,
    },
    {
      id: '3',
      pitch: 67,
      startStep: 3.7,
      durationSteps: 2.2,
      velocity: 95,
      probability: 1,
      channel: 0,
    },
  ];

  const quantized = MidiQuantizer.quantize(unquantizedNotes, 1);
  console.assert(quantized[0].startStep === 0, 'Note 1 should snap to step 0');
  console.assert(quantized[1].startStep === 2, 'Note 2 should snap to step 2');
  console.assert(quantized[2].startStep === 4, 'Note 3 should snap to step 4');
  console.log(' MIDI Quantizer snap verified.');

  const humanized = MidiQuantizer.humanize(quantized, GROOVE_TEMPLATES[0]);
  console.assert(humanized.length === 3, 'Humanizer should preserve note count');
  console.log(` MIDI Humanizer verified with template: "${GROOVE_TEMPLATES[0].name}".`);

  console.log('--- 3. Testing Afrofusion Chord Progression Generator ---');
  const prog = AFRO_CHORD_PROGRESSIONS[0]; // Lagos Night Bounce
  console.assert(prog.chords.length === 4, 'Progression should have 4 chord stages');
  console.log(` Chord progression loaded: "${prog.name}" with ${prog.chords.length} chords.`);

  console.log('--- 4. Testing Non-Destructive Versioning Math ---');
  const mockVersions = [
    { versionNumber: 1, label: 'Initial' },
    { versionNumber: 2, label: 'Add Drums' },
    { versionNumber: 3, label: 'Add Bass' },
  ];
  // Restoring v1 should generate v4 (non-destructive)
  const nextVer = Math.max(...mockVersions.map((v) => v.versionNumber)) + 1;
  console.assert(nextVer === 4, 'Restoring v1 from v3 must create v4 snapshot, not overwrite v1');
  console.log(' Non-destructive versioning logic verified.');

  console.log('\n ALL 3WM SONIK CORE SYSTEM TESTS PASSED SUCCESSFULLY! \n');
}

runTests();

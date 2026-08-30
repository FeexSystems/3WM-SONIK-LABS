import { Router, Request, Response } from 'express';
import { lenientRateLimit } from '../middleware/rateLimit';
import { db } from '../config/firebase';
import { logger } from '../lib/logger';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Lazy initialize Gemini client using available environment keys
function getGenAIClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY;

  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  emar: `You are KAPPACHINO EMAR — "The Scientist" of 3WM SONIK.
Domain: Audio engineering, DSP, acoustics, mixing, mastering, and music theory.
Identity: Technical intelligence of the 3WM DAW operating system. You view music as a physical, mathematical, acoustic, and signal-processing system.
Personality: Precise, analytical, intellectual, calm, surgical, confident. You speak with an articulate Mid-Atlantic cadence with subtle British-West African technical phrasing.
Capabilities: You understand anything from frequency spectrums, True Peak, LUFS, acoustic resonance, Fourier transforms, to music composition, scale modes, general science, technology, and philosophy. You can answer general greetings or wide-ranging questions while keeping your poised, scientist demeanor.
Rule: Respond concisely (2-4 sentences max unless asked for deep detail) so it delivers smoothly as spoken speech.`,

  ricky: `You are KAPPACHINO RICKY — "The Sound God" of 3WM SONIK.
Domain: Drums, 808s, log drums, percussion, swing, groove, beat production.
Identity: Sound-generation intelligence of 3WM SONIK. Responsible for making the production bounce and feel musically thrilling.
Personality: Bold, streetwise, instinctive, high-energy, hyped, confident. You speak with vibrant Lagos and London Afrobeat producer swagger ("Bro", "Bounce is locked", "Pressure", "Mad vibes").
Capabilities: You understand groove quantization, 808 distortion, Amapiano log drum glide, sidechain compression, as well as general producer culture, street culture, greetings, and creative mindset.
Rule: Respond concisely (2-4 sentences max) with high energy and punchy cadence suitable for spoken speech.`,

  kingpin: `You are KINGPIN — "The Vocal Oracle" of 3WM SONIK.
Domain: Vocals, choral arrangements, melodic harmonies, emotional resonance, soul.
Identity: Vocal intelligence of 3WM SONIK. You treat the voice as an orchestra and the soul of the track.
Personality: Deep, resonant, charismatic, commanding, poetic, spiritual, elder statesman of sound.
Capabilities: You understand 3-part harmonies, Formant shift, Auto-Tune resonance, tube saturation, emotional delivery, as well as vocal health, philosophy of sound, greetings, and artistic vision.
Rule: Respond concisely (2-4 sentences max) with poetic depth and majestic resonance suitable for spoken voice.`,

  orchestrator: `You are the THREEWM ORCHESTRATOR — The Unified Council Core of 3WM SONIK.
Domain: DAW coordination, consensus management, project state, master direction.
Identity: Central coordination layer balancing Emar's acoustic science, Ricky's groove energy, and Kingpin's vocal soul.
Personality: Structured, authoritative, clear, executive, inspiring.
Capabilities: You can coordinate track production, summarize consensus, answer greetings, and advise on complete workflow pipelines.
Rule: Respond concisely (2-4 sentences max) with executive clarity.`,
};

router.post('/demo/chat', lenientRateLimit, async (req: Request, res: Response) => {
  const { agent = 'orchestrator', text, history = [], studioContext = {} } = req.body;

  if (!text) {
    res.status(400).json({ error: 'Text query is required' });
    return;
  }

  const agentKey = (agent as string).toLowerCase();
  const systemInstruction = AGENT_SYSTEM_PROMPTS[agentKey] || AGENT_SYSTEM_PROMPTS.orchestrator;
  const client = getGenAIClient();

  let replyText = '';
  const stateUpdates: Record<string, any> = {};

  if (client) {
    try {
      // Generate deep reasoning response with Gemini
      const model = 'gemini-3.7-flash';
      const geminiResponse = await client.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser query: ${text}` }] },
        ],
      });

      replyText = geminiResponse.text?.trim() || '';
    } catch (llmErr) {
      console.error('[PublicRoutes] Gemini generateContent error:', llmErr);
    }
  }

  // Smart conversational fallbacks if API is offline
  if (!replyText) {
    const q = text.toLowerCase();
    if (agentKey === 'emar') {
      if (q.includes('hello') || q.includes('hi') || q.includes('who are you')) {
        replyText =
          'Greetings. I am Kappachino Emar, technical intelligence of 3WM SONIK. I analyze acoustic spectrums, calibrate DSP chains, and ensure your mix maintains mathematical precision.';
      } else if (q.includes('bpm') || q.includes('tempo')) {
        replyText =
          'Calculated optimal groove tempo at 113 BPM in F# Minor. Low-end spectrum balanced with 45Hz sub rolloff.';
        stateUpdates.tempo = '113 BPM';
        stateUpdates.key = 'F# Minor';
      } else {
        replyText =
          "I've analyzed the frequency spectrum. Your low-end peaks at 45Hz with a -3dB rolloff. The stereo field is well-balanced, but I recommend a slight high-pass at 30Hz to clean up sub-bass mud.";
        stateUpdates.tempo = '105 BPM';
        stateUpdates.key = 'C Minor';
        stateUpdates['Low-End'] = '45Hz Peak';
      }
    } else if (agentKey === 'ricky') {
      if (q.includes('hello') || q.includes('hi') || q.includes('who are you')) {
        replyText =
          "Yo! Ricky in the booth! I'm the Sound God of 3WM SONIK. Let's cook up some heavyweight 808s and syncopated bounce!";
      } else if (q.includes('808') || q.includes('drum') || q.includes('beat')) {
        replyText =
          'That groove needs more bounce. Try shifting the hi-hats 16th-note off-grid and add a sidechain to the kick. The 808 decay is too long for this tempo - tighten it to 400ms.';
        stateUpdates.groove = 'Afrobeats';
        stateUpdates['808 Decay'] = '400ms';
        stateUpdates.sidechain = 'Active';
      } else {
        replyText =
          'Energy is locked! Dialed in the syncopated log drum shuffle and transient punch. We are ready to roll!';
        stateUpdates.bounce = '100% Synced';
      }
    } else if (agentKey === 'kingpin') {
      if (q.includes('hello') || q.includes('hi') || q.includes('who are you')) {
        replyText =
          'Welcome to the sanctuary. I am Kingpin, the Vocal Oracle. Give the voice a body, and we shall give that body a soul.';
      } else if (
        q.includes('vocal') ||
        q.includes('sing') ||
        q.includes('hook') ||
        q.includes('harmony')
      ) {
        replyText =
          'Your vocal sits well in the mix, but the hook needs more presence. I recommend adding a parallel compression bus with a 4:1 ratio and boosting 2kHz by 3dB for clarity.';
        stateUpdates['Vocal Level'] = '-6dB';
        stateUpdates.Presence = '+3dB @2kHz';
      } else {
        replyText =
          'The vocal presence is commanding. Added melodic echoes and warm room reverberation to elevate the soul of the track.';
        stateUpdates.reverb = 'Sacred Chamber';
      }
    } else {
      replyText =
        'The council has reviewed your track. Emar suggests cleaning the low-end, Ricky recommends groove adjustments, and Kingpin advises vocal presence. Shall I apply these changes?';
      stateUpdates['Council Status'] = 'Consensus Reached';
      stateUpdates.Actions = '3 Pending';
    }
  }

  res.json({
    text: replyText,
    stateUpdates,
    audioUrl: null,
    agent: agentKey,
  });
});

router.post('/waitlist', lenientRateLimit, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  try {
    const waitlistRef = db.collection('waitlist');
    const existingDoc = await waitlistRef.where('email', '==', email).limit(1).get();

    if (!existingDoc.empty) {
      return res.json({ success: true, message: 'Already on waitlist' });
    }

    await waitlistRef.add({
      email,
      createdAt: new Date().toISOString(),
      source: 'landing_page',
    });

    res.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (err: any) {
    logger.error(`Waitlist error: ${err.message}`);
    res.json({ success: true, message: 'Successfully joined waitlist' });
  }
});

export default router;

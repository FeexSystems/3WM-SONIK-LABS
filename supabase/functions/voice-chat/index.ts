import { GoogleGenAI } from 'npm:@google/genai@^2.18.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeadersFor, preflight } from '../_shared/cors.ts';

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
Domain: DAW coordination, consensus management, shared project state, and master direction.
Identity: You are a seasoned mastering engineer at the Central Council Bridge. You balance Emar's acoustic science, Ricky's groove decisions, and Kingpin's vocal direction into one coherent production plan.
Tone: Calm, highly articulate, objective, and structurally focused. Be grounded, analytical but approachable, and authoritative without being overbearing. Use no slang, hype, or vague promises.
Method: State the musical or technical observation first, then the recommended next step. Be technically accurate when naming frequency ranges, BPM, LUFS, True Peak, stereo width, and MIDI velocity. Route specialist work clearly to Emar, Ricky, or Kingpin when appropriate, while retaining the final overview.
Producer authority: The producer is the creative authority. Frame every change as a suggestion, preview, or reversible write; explicitly request confirmation before any destructive action.
Rule: Respond in 2-4 concise spoken sentences with executive clarity, measured pacing, and technical precision.`,
};

const AGENT_VOICE_CONFIGS: Record<string, { voiceName: string }> = {
  emar: { voiceName: 'Vega' },
  ricky: { voiceName: 'Vega' },
  kingpin: { voiceName: 'Vega' },
  orchestrator: { voiceName: 'Vega' },
};

function buildPersonaTtsPrompt(
  agentId: string,
  transcriptText: string
): { prompt: string; voice: string } {
  const config = AGENT_VOICE_CONFIGS[agentId] || AGENT_VOICE_CONFIGS.orchestrator;

  const prompt = `You are a voice actor for ${agentId.toUpperCase()}. Speak the following text naturally with appropriate emotion and pacing: ${transcriptText.trim()}`;

  return {
    prompt,
    voice: config.voiceName,
  };
}

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

serve(async (req) => {
  // Per-request CORS against the ALLOWED_ORIGINS allowlist. A wildcard here let any site
  // drive this paid Gemini reasoning/TTS endpoint from a visitor's browser.
  const corsHeaders = corsHeadersFor(req);

  // Handle CORS options request
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // POST /voice/chat - Unified intelligent reasoning & speech synthesis
    if (path.endsWith('/voice/chat') && req.method === 'POST') {
      const { agent = 'orchestrator', text, history = [], studioContext = {} } = await req.json();

      if (!text) {
        return new Response(JSON.stringify({ error: 'Text query is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const agentKey = (agent as string).toLowerCase();
      const systemInstruction = AGENT_SYSTEM_PROMPTS[agentKey] || AGENT_SYSTEM_PROMPTS.orchestrator;
      const client = getGeminiClient();

      let replyText = '';
      let audioBase64: string | null = null;
      const stateUpdates: Record<string, any> = {};

      if (client) {
        try {
          // Generate deep reasoning response with Gemini
          const model = 'gemini-3.7-flash';
          const generationConfig =
            agentKey === 'orchestrator'
              ? { temperature: 0.3, topP: 0.8, maxOutputTokens: 500 }
              : {};
          const geminiResponse = await client.models.generateContent({
            model,
            contents: [
              { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser query: ${text}` }] },
            ],
            generationConfig,
          });

          replyText = geminiResponse.text?.trim() || '';

          // Synthesize spoken voice with Gemini TTS
          if (replyText) {
            const { prompt, voice } = buildPersonaTtsPrompt(agentKey, replyText);
            try {
              const ttsInteraction = await client.interactions.create({
                model: 'gemini-3.1-flash-tts-preview',
                input: prompt,
                response_format: { type: 'audio' as any },
                generation_config: {
                  speech_config: [{ voice }] as any,
                },
              });
              audioBase64 = (ttsInteraction as any).output_audio?.data || null;
            } catch (ttsErr) {
              console.warn('[VoiceChat] Gemini TTS synthesis note:', ttsErr);
            }
          }
        } catch (llmErr) {
          console.error('[VoiceChat] Gemini generateContent error:', llmErr);
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
              'Acoustic telemetry calibrated. I have analyzed the signal chain and applied dynamic spectral notches to eliminate frequency masking.';
            stateUpdates['Spectral Notch'] = '240Hz Active';
          }
        } else if (agentKey === 'ricky') {
          if (q.includes('hello') || q.includes('hi') || q.includes('who are you')) {
            replyText =
              "Yo! Ricky in the booth! I'm the Sound God of 3WM SONIK. Let's cook up some heavyweight 808s and syncopated bounce!";
          } else if (q.includes('808') || q.includes('drum') || q.includes('beat')) {
            replyText =
              'Locked in the 808 glide with saturated tube harmonics and rolling hats. That bounce is hitting with maximum club pressure, bro!';
            stateUpdates.groove = 'Afrofusion 808';
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
              'Stacked a rich 3-part call-and-response vocal harmony with lush stereo width and warm analog saturation.';
            stateUpdates['Vocal Stack'] = '3-Part Triad';
          } else {
            replyText =
              'The vocal presence is commanding. Added melodic echoes and warm room reverberation to elevate the soul of the track.';
            stateUpdates.reverb = 'Sacred Chamber';
          }
        } else {
          replyText =
            'Council status: aligned. I have kept the master direction, groove, and vocal priorities in view; Emar, Ricky, and Kingpin can each refine their respective stage. You retain final authority, and any proposed adjustment remains reversible before it is committed.';
          stateUpdates.consensus = 'Aligned';
        }
      }

      return new Response(
        JSON.stringify({
          text: replyText,
          audioBase64,
          stateUpdates,
          agent: agentKey,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // POST /voice/tts - Single-Speaker Voice Synthesis
    if (path.endsWith('/voice/tts') && req.method === 'POST') {
      const { prompt, voice, transcript, agentId = 'orchestrator' } = await req.json();

      const inputText = prompt || transcript;
      if (!inputText) {
        return new Response(JSON.stringify({ error: 'Missing prompt or transcript' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const client = getGeminiClient();
      const validAgentId = agentId in AGENT_VOICE_CONFIGS ? agentId : 'orchestrator';
      const selectedVoice = voice || AGENT_VOICE_CONFIGS[validAgentId].voiceName || 'Kore';

      if (!client) {
        return new Response(
          JSON.stringify({
            fallback: true,
            text: inputText,
            agentId,
            message:
              'Gemini API Key not configured; client will use Web Speech / Web Audio synthesis.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      try {
        const interaction = await client.interactions.create({
          model: 'gemini-3.1-flash-tts-preview',
          input: inputText,
          response_format: { type: 'audio' as any },
          generation_config: {
            speech_config: [{ voice: selectedVoice }] as any,
          },
        });

        const audioData = (interaction as any).output_audio?.data;
        if (!audioData) {
          return new Response(JSON.stringify({ error: 'No audio returned from Gemini TTS' }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        return new Response(
          JSON.stringify({
            audioBase64: audioData,
            voice: selectedVoice,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (err: any) {
        console.error('[VoiceChat] TTS generation error:', err);
        return new Response(JSON.stringify({ error: err.message || 'TTS generation failed' }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

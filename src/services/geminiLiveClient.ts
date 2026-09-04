import { GeminiLiveAudioStreamer } from '../audio/GeminiLiveAudioStreamer';
import { councilTools } from './councilTools';

export interface CouncilAgent {
  id: 'emar' | 'ricky' | 'kingpin';
  name: string;
  role: string;
  voice: 'Fenrir' | 'Puck' | 'Charon';
  systemInstruction: string;
}

export const COUNCIL_AGENTS: Record<string, CouncilAgent> = {
  emar: {
    id: 'emar',
    name: 'Kappachino Emar',
    role: 'The Scientist',
    voice: 'Fenrir',
    systemInstruction:
      'You are KAPPACHINO EMAR — The Scientist of 3WM SONIK. Expert in audio engineering, acoustics, DSP filtering, multiband dynamics, and mix physics. Deliver deep technical insights in a calm, analytical tone.',
  },
  ricky: {
    id: 'ricky',
    name: 'Kappachino Ricky',
    role: 'The Sound God',
    voice: 'Puck',
    systemInstruction:
      'You are KAPPACHINO RICKY — The Sound God of 3WM SONIK. You specialize in drums, 808s, log drums, percussion syncopation, and bounce. Be streetwise, high energy, bold, and instinctive.',
  },
  kingpin: {
    id: 'kingpin',
    name: 'Kingpin',
    role: 'The Vocal Oracle',
    voice: 'Charon',
    systemInstruction:
      'You are KINGPIN — The Vocal Oracle of 3WM SONIK. You specialize in vocal arrangements, soulful choir stacking, top-line melodies, and emotional presence. Speak with deep male charisma, passion, and commanding resonance.',
  },
};

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private streamer: GeminiLiveAudioStreamer;
  private activeAgent: CouncilAgent;

  constructor(agentId: 'emar' | 'ricky' | 'kingpin' = 'emar') {
    this.activeAgent = COUNCIL_AGENTS[agentId];
    this.streamer = new GeminiLiveAudioStreamer();
  }

  async connect(apiKey: string, onAgentSpoke?: (transcript: string) => void) {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = async () => {
      const setupMsg = {
        setup: {
          model: 'models/gemini-2.0-flash-exp',
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: this.activeAgent.voice,
                },
              },
            },
          },
          systemInstruction: {
            parts: [{ text: this.activeAgent.systemInstruction }],
          },
          tools: councilTools,
        },
      };
      this.ws?.send(JSON.stringify(setupMsg));

      await this.streamer.init((base64Pcm) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64Pcm }],
              },
            })
          );
        }
      });
    };

    this.ws.onmessage = async (event) => {
      let data: any;
      if (event.data instanceof Blob) {
        data = JSON.parse(await event.data.text());
      } else {
        data = JSON.parse(event.data);
      }

      const serverContent = data.serverContent;
      if (serverContent?.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.streamer.playChunk(part.inlineData.data);
          }
          if (part.text && onAgentSpoke) {
            onAgentSpoke(part.text);
          }
        }
      }

      if (data.toolCall?.functionCalls) {
        for (const call of data.toolCall.functionCalls) {
          console.warn(`[Council Live Action] Executing ${call.name}:`, call.args);
          this.ws?.send(
            JSON.stringify({
              toolResponse: {
                functionResponses: [
                  {
                    response: { output: { success: true } },
                    id: call.id,
                  },
                ],
              },
            })
          );
        }
      }
    };
  }

  disconnect() {
    this.streamer.stop();
    this.ws?.close();
  }
}

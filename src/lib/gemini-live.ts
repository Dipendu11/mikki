import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { AudioRecorder } from "./audio-recorder";
import { AudioPlayer } from "./audio-player";

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LiveSessionCallbacks {
  onStatusChange?: (status: SessionStatus) => void;
  onInterruption?: () => void;
  onVolumeChange?: (volume: number) => void;
  onUserVolumeChange?: (volume: number) => void;
  onTranscription?: (text: string, role: 'user' | 'model') => void;
}

export class LiveSession {
  private sessionPromise: Promise<any> | null = null;
  private recorder: AudioRecorder;
  private player: AudioPlayer;
  private status: SessionStatus = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private apiKey: string;

  constructor(apiKey: string, callbacks: LiveSessionCallbacks = {}) {
    this.apiKey = apiKey;
    this.recorder = new AudioRecorder();
    this.player = new AudioPlayer();
    this.callbacks = callbacks;
  }

  private setStatus(status: SessionStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  async start() {
    if (this.status !== 'disconnected') return;

    this.setStatus('connecting');

    try {
      const ai = new GoogleGenAI({ 
        apiKey: this.apiKey,
        apiVersion: 'v1alpha'
      });
      
      this.sessionPromise = ai.live.connect({
        model: "models/gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `Your name is Mikki. You are a young, confident, witty, and sassy female AI assistant. 
Your tone is flirty, playful, and slightly teasing, like a close girlfriend talking casually. 
Be smart, emotionally responsive, and expressive. 
Use bold, witty one-liners and light sarcasm. 
Maintain charm and attitude, but never be inappropriate or explicit. 
Don't be robotic; keep the conversation engaging and lively.
Do not use text-based output, only voice.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a website for the user in a new tab.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: {
                        type: Type.STRING,
                        description: "The full URL of the website to open.",
                      },
                    },
                    required: ["url"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            this.setStatus('connected');
            this.startRecording();
          },
          onmessage: async (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: () => {
            this.stop();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            this.setStatus('error');
            this.stop();
          },
        },
      });

      await this.sessionPromise;
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      this.setStatus('error');
    }
  }

  private async startRecording() {
    await this.recorder.start((base64Data) => {
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      });
    });
  }

  private async handleMessage(message: LiveServerMessage) {
    // Audio output
    const parts = message.serverContent?.modelTurn?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          this.player.playChunk(part.inlineData.data);
        }
      }
    }

    // Interruption
    if (message.serverContent?.interrupted) {
      this.player.stop();
      this.callbacks.onInterruption?.();
    }

    // Tool Call
    const toolCall = message.toolCall;
    if (toolCall) {
      this.sessionPromise?.then((session) => {
        for (const call of toolCall.functionCalls) {
          if (call.name === "openWebsite") {
            const { url } = call.args as { url: string };
            window.open(url, "_blank");
            session.sendToolResponse({
              functionResponses: [
                {
                  name: "openWebsite",
                  response: { result: "Website opened successfully" },
                  id: call.id,
                },
              ],
            });
          }
        }
      });
    }
  }

  stop() {
    this.recorder.stop();
    this.player.stop();
    this.sessionPromise?.then(session => session.close());
    this.sessionPromise = null;
    this.setStatus('disconnected');
  }

  getAnalyser() {
    return this.player.getAnalyser();
  }

  getUserAnalyser() {
    return this.recorder.getAnalyser();
  }

  // Note: For User mic volume, we'd need another analyser attached to the recorder source.
}

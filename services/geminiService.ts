
import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { Message, Role, Attachment, GroundingSource, MessageMood } from "../types";
import { IBRAHIM_SYSTEM_INSTRUCTION } from "../constants";

// Switched to gemini-3-flash-preview for maximum compatibility and speed.
// This model supports search grounding and complex reasoning while being less prone to 403 errors.
const CORE_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamChatResponse = async (
  history: Message[],
  userMessage: string,
  attachments: Attachment[],
  onUpdate: (text: string, imageUrl?: string, sources?: GroundingSource[], mood?: MessageMood) => void
): Promise<void> => {
  const ai = getAiClient();
  
  try {
    const chatHistory = history.map((msg) => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [
        { text: msg.mood ? `[MOOD:${msg.mood}] ${msg.content}` : msg.content },
        ...(msg.attachments?.map(att => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ],
    }));

    const currentDateTime = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
    
    const systemInstructionWithContext = `${IBRAHIM_SYSTEM_INSTRUCTION}
\n[System Context]\nCurrent Date/Time: ${currentDateTime}
`;

    const chat: Chat = ai.chats.create({
      model: CORE_MODEL,
      history: chatHistory,
      config: {
        systemInstruction: systemInstructionWithContext,
        temperature: 0.8,
        // Using googleSearch tool for grounding. Note: 403 can occur if the key doesn't have Search enabled.
        tools: [{ googleSearch: {} }],
      },
    });

    const currentParts: any[] = [];
    if (userMessage.trim()) currentParts.push({ text: userMessage });
    
    attachments.forEach(att => {
      currentParts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });

    if (currentParts.length === 0) currentParts.push({ text: "Hello" });

    const result = await chat.sendMessageStream({ 
      message: currentParts
    });

    let fullText = "";
    let currentMood: MessageMood | undefined;

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      
      const sources: GroundingSource[] = [];
      const chunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((gc: any) => {
          if (gc.web) {
            sources.push({ title: gc.web.title, url: gc.web.uri });
          }
        });
      }

      if (c.candidates?.[0]?.content?.parts) {
        for (const part of c.candidates[0].content.parts) {
          if (part.text) {
            fullText += part.text;
            
            // Extract Mood Tag: [MOOD:MoodName]
            const moodMatch = fullText.match(/\[MOOD:(\w+)\]/);
            if (moodMatch && !currentMood) {
              currentMood = moodMatch[1] as MessageMood;
            }

            // Clean text for display by removing the mood tag
            const displayText = fullText.replace(/\[MOOD:\w+\]/, "").trim();
            onUpdate(displayText, undefined, sources.length > 0 ? sources : undefined, currentMood);
          }
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            onUpdate("", imageUrl);
          }
        }
      }
    }
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: `Speak this as Ibrahim's AI: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioData = decodeBase64(base64Audio);
  return await decodeAudioData(audioData, audioContext, 24000, 1);
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

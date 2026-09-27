
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  type: 'image' | 'audio';
  data: string; // base64
  mimeType: string;
  url?: string; // object URL for preview
}

export interface GroundingSource {
  title: string;
  url: string;
}

export type MessageMood = 'Thoughtful' | 'Empathetic' | 'Inspired' | 'Calm' | 'Cheerful' | 'Protective' | 'Curious' | 'Analytical';

export interface Message {
  id: string;
  role: Role;
  content: string;
  mood?: MessageMood;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  isStreaming?: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

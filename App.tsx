
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import InputArea from './components/InputArea';
import { Message, Role, Attachment, GroundingSource, MessageMood } from './types';
import { streamChatResponse } from './services/geminiService';
import { playAssistantVoice } from './services/audioService';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleSendMessage = useCallback(async (content: string, attachments: Attachment[]) => {
    if (!content.trim() && attachments.length === 0) return;

    const hasAudioInput = attachments.some(a => a.type === 'audio');

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content,
      attachments,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiMessageId = uuidv4();
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: Role.MODEL,
        content: '',
        attachments: [],
        sources: [],
        isStreaming: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, initialAiMessage]);

      const seenImageUrls = new Set<string>();
      const seenSourceUrls = new Set<string>();
      let finalAiContent = '';
      
      await streamChatResponse(
        messages, 
        content,
        attachments,
        (text, imageUrl, sources, mood) => {
          setMessages((prev) => 
            prev.map((msg) => {
              if (msg.id === aiMessageId) {
                let updatedMsg = { ...msg };
                
                if (text) {
                  updatedMsg.content = text;
                  finalAiContent = text;
                }
                
                if (mood) {
                  updatedMsg.mood = mood;
                }
                
                if (imageUrl && !seenImageUrls.has(imageUrl)) {
                  seenImageUrls.add(imageUrl);
                  updatedMsg.attachments = [
                    ...(updatedMsg.attachments || []),
                    {
                      type: 'image',
                      data: imageUrl,
                      mimeType: 'image/png'
                    }
                  ];
                }

                if (sources) {
                  const newSources = [...(updatedMsg.sources || [])];
                  sources.forEach(src => {
                    if (!seenSourceUrls.has(src.url)) {
                      seenSourceUrls.add(src.url);
                      newSources.push(src);
                    }
                  });
                  updatedMsg.sources = newSources;
                }
                
                return updatedMsg;
              }
              return msg;
            })
          );
        }
      );

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === aiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

      if ((isVoiceMode || hasAudioInput) && finalAiContent) {
        playAssistantVoice(finalAiContent, aiMessageId);
      }

    } catch (error: any) {
      console.error("Critical API Error:", error);
      const errorStr = JSON.stringify(error);
      const isPermissionError = errorStr.includes("PERMISSION_DENIED") || error?.status === 403 || error?.code === 403;
      
      if (isPermissionError || errorStr.includes("Requested entity was not found")) {
        // Trigger the key selection dialog immediately as it's the only way to resolve a 403
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          aistudio.openSelectKey();
        }
      }

      const errorMessage: Message = {
        id: uuidv4(),
        role: Role.MODEL,
        content: isPermissionError 
          ? "I've encountered a **Permission Denied (403)** error. This usually means your API key doesn't have Search Grounding enabled or you need to use a paid project key. I've opened the key selection dialog for you. Please select a key from a project with billing enabled."
          : "I apologize, but I encountered an error processing your request. Please check your connection or try again later.",
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev.filter(m => !m.isStreaming), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isVoiceMode]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <Header 
        isVoiceMode={isVoiceMode} 
        onToggleVoiceMode={() => setIsVoiceMode(!isVoiceMode)} 
      />
      <main className="flex-1 flex flex-col min-h-0 relative">
        <ChatInterface messages={messages} isLoading={isLoading} />
        <InputArea onSend={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;

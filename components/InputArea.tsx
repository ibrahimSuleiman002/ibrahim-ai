
import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Image as ImageIcon, Mic, X, Music, MicOff, Settings2, Sparkles } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRecording) {
      textareaRef.current?.focus();
    }
  }, [isRecording]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading && !isRecording) {
      onSend(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          const newAttachment: Attachment = {
            type: 'audio',
            data: base64Content,
            mimeType: mimeType.split(';')[0],
            url: URL.createObjectURL(audioBlob)
          };

          // Simplified: Always auto-send voice commands
          onSend(input.trim(), [...attachments, newAttachment]);
          setInput('');
          setAttachments([]);
          
          setTimeout(() => textareaRef.current?.focus(), 50);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        setAttachments(prev => [...prev, {
          type: 'image',
          data: base64Content,
          mimeType: file.type,
          url: URL.createObjectURL(file)
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-none bg-white border-t border-slate-200 p-4 pb-6 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {attachments.map((att, i) => (
              <div key={i} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                {att.type === 'image' ? (
                  <img src={att.url} className="w-16 h-16 object-cover rounded-xl border-2 border-brand-100 shadow-sm" alt="Preview" />
                ) : (
                  <div className="w-16 h-16 flex flex-col items-center justify-center bg-brand-50 rounded-xl border-2 border-brand-100 shadow-sm">
                    <Music className="text-brand-500" size={20} />
                    <span className="text-[8px] mt-1 font-black text-brand-600 uppercase tracking-tighter">Audio</span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg ring-2 ring-white hover:bg-red-500 transition-colors"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-brand-200 focus-within:border-brand-400 focus-within:bg-white transition-all shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening to your command..." : "Ask Ibrahim's AI..."}
              className={`w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 resize-none py-2 px-3 min-h-[44px] text-base transition-opacity ${isRecording ? 'opacity-50' : 'opacity-100'}`}
              disabled={isRecording}
            />
            
            {isRecording && (
              <div className="absolute inset-0 bg-brand-50/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 text-brand-700 font-bold text-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-4 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-4 bg-brand-400 rounded-full animate-bounce"></div>
                  </div>
                  Listening...
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 mt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all disabled:opacity-30"
                  title="Upload image"
                >
                  <ImageIcon size={18} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition-all disabled:opacity-30 ${
                    isRecording 
                      ? 'text-red-600 bg-red-100 ring-2 ring-red-200' 
                      : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50'
                  }`}
                  title={isRecording ? "Stop recording" : "Speak to Ibrahim"}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1">
                Voice Assistant <Sparkles size={10} className="text-brand-400" />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || isLoading || isRecording}
            className={`p-4 rounded-2xl flex-none transition-all duration-300 shadow-sm active:scale-95 ${
              (!input.trim() && attachments.length === 0) || isLoading || isRecording
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? <StopCircle size={24} className="animate-spin-slow opacity-70" /> : <Send size={24} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputArea;

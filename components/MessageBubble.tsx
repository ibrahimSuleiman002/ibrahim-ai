
import React, { useState, useEffect } from 'react';
import { Message, Role, MessageMood } from '../types';
import { Bot, User, Music, Volume2, Globe, Heart, Zap, Shield, Brain, Sparkles, Smile, Search, HelpCircle, Square, Play, Pause, ExternalLink } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { playAssistantVoice, pauseAssistantVoice, stopAssistantVoice, getPlaybackStatus } from '../services/audioService';

interface MessageBubbleProps {
  message: Message;
}

const moodConfig: Record<MessageMood, { icon: React.ReactNode, color: string, bg: string }> = {
  Thoughtful: { icon: <Brain size={10} />, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  Empathetic: { icon: <Heart size={10} />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  Inspired: { icon: <Zap size={10} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  Calm: { icon: <Sparkles size={10} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  Cheerful: { icon: <Smile size={10} />, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  Protective: { icon: <Shield size={10} />, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  Curious: { icon: <HelpCircle size={10} />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  Analytical: { icon: <Search size={10} />, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const mood = message.mood && moodConfig[message.mood] ? moodConfig[message.mood] : moodConfig['Calm'];

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getPlaybackStatus(message.id);
      if (current !== playbackState) {
        setPlaybackState(current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [playbackState, message.id]);

  const handlePlay = async () => {
    if (playbackState === 'playing') {
      pauseAssistantVoice();
    } else {
      if (!message.content) return;
      await playAssistantVoice(message.content, message.id);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAssistantVoice();
  };

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="flex-none pt-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all duration-500 ${
            isUser ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-brand-600'
          } ${(!isUser && message.isStreaming) || playbackState === 'playing' ? 'animate-pulse ring-2 ring-brand-400' : ''}`}>
            {isUser ? <User size={18} /> : <Bot size={20} />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* AI Mood Badge */}
          {!isUser && message.mood && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border mb-1 transition-all animate-fade-in ${mood.bg} ${mood.color}`}>
              {mood.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider">{message.mood}</span>
            </div>
          )}

          <div className={`relative px-5 py-4 rounded-2xl shadow-sm transition-all duration-200 ${
            isUser 
              ? 'bg-brand-600 text-white rounded-tr-sm' 
              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
          }`}>
             {/* Attachments Rendering */}
             {message.attachments && message.attachments.length > 0 && (
               <div className="flex flex-col gap-3 mb-4">
                 {message.attachments.map((att, i) => (
                   att.type === 'image' ? (
                     <div key={i} className="relative group overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50">
                        <img 
                          src={att.url || att.data} 
                          className="max-w-full max-h-[500px] object-contain mx-auto" 
                          alt="Generated or attached" 
                        />
                     </div>
                   ) : (
                     <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isUser ? 'bg-brand-700 border-brand-500' : 'bg-slate-50 border-slate-200'}`}>
                        <Music size={16} className={isUser ? 'text-brand-200' : 'text-brand-500'} />
                        <span className="text-xs font-semibold tracking-wide uppercase">Audio Command</span>
                     </div>
                   )
                 ))}
               </div>
             )}

             <MarkdownRenderer content={message.content} role={message.role} />
             
             {message.isStreaming && (
                 <span className="inline-block w-2 h-5 ml-1 bg-brand-400 animate-pulse align-middle rounded-full"></span>
             )}

             {/* Grounding Sources */}
             {!isUser && message.sources && message.sources.length > 0 && (
               <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Globe size={12} /> Search Results
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((src, idx) => (
                      <a 
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-medium text-brand-700 hover:bg-brand-50 hover:border-brand-200 transition-colors"
                      >
                        <span className="truncate max-w-[150px]">{src.title || 'Source'}</span>
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
               </div>
             )}

             {/* Listen Bar (Media Controls) */}
             {!isUser && message.content && !message.isStreaming && (
                <div className="mt-4 flex items-center gap-1">
                  <div className={`flex items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${
                    playbackState !== 'idle' 
                      ? 'bg-brand-50 border-brand-200 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}>
                    <button 
                      onClick={handlePlay}
                      className={`p-1.5 rounded-lg transition-all ${
                        playbackState === 'playing'
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-500 hover:bg-white hover:text-brand-600'
                      }`}
                      title={playbackState === 'playing' ? "Pause" : "Play"}
                    >
                      {playbackState === 'playing' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>

                    {playbackState !== 'idle' && (
                      <>
                        <div className="h-4 w-px bg-brand-200 mx-0.5" />
                        <button 
                          onClick={handleStop}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-all"
                          title="Stop"
                        >
                          <Square size={14} fill="currentColor" />
                        </button>
                        <div className="px-2 py-1 flex items-center gap-2">
                          <div className="flex gap-0.5 items-end h-3">
                            {[0.4, 0.7, 1, 0.6, 0.9, 0.5].map((h, i) => (
                              <div 
                                key={i} 
                                className={`w-0.5 bg-brand-400 rounded-full transition-all duration-300 ${playbackState === 'playing' ? 'animate-pulse' : 'opacity-30'}`}
                                style={{ 
                                  height: `${h * 100}%`,
                                  animationDelay: `${i * 0.1}s` 
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-bold text-brand-600 uppercase tracking-tight">
                            {playbackState === 'playing' ? 'Listening' : 'Paused'}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {playbackState === 'idle' && (
                      <button 
                        onClick={handlePlay}
                        className="pr-3 pl-1 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-brand-600 transition-colors"
                      >
                        Listen
                      </button>
                    )}
                  </div>
                </div>
             )}
          </div>
          
          <span className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium tracking-tight">
            {isUser ? 'USER' : "IBRAHIM'S AI"} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;


import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, ShieldCheck, Settings, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  isVoiceMode: boolean;
  onToggleVoiceMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isVoiceMode, onToggleVoiceMode }) => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        try {
          const selected = await aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch (err) {
          console.error("Error checking API key status:", err);
        }
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleKeySelect = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (err) {
        console.error("Error opening key selection dialog:", err);
      }
    }
  };

  return (
    <header className="flex-none bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-500 p-2 rounded-lg text-white shadow-md shadow-brand-200">
            <Sparkles size={24} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Ibrahim's AI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
              Search Active <Globe size={10} className="text-brand-500" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={onToggleVoiceMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isVoiceMode 
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={isVoiceMode ? "Disable Auto-Voice" : "Enable Auto-Voice"}
            >
              {isVoiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="hidden xs:inline">Voice Mode {isVoiceMode ? 'ON' : 'OFF'}</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden xs:block" />

            {!hasApiKey ? (
              <div className="flex flex-col items-end gap-1">
                <button 
                  onClick={handleKeySelect}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-bold hover:bg-brand-100 transition-colors"
                >
                  <Settings size={14} /> <span className="hidden md:inline">Global Key</span>
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] text-slate-400 hover:text-brand-600 transition-colors underline decoration-dotted underline-offset-2"
                >
                  Billing Setup
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                <ShieldCheck size={14} /> <span className="hidden md:inline">Ready</span>
              </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;

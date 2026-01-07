
import React, { useState, useRef } from 'react';
import { DocumentData } from '../types';
import { generateSpeech } from '../services/gemini';

interface DocumentStatsProps {
  doc: DocumentData;
  onSelectQuery: (query: string) => void;
}

// Singleton AudioContext to avoid initialization latency
let sharedAudioContext: AudioContext | null = null;

export const DocumentStats: React.FC<DocumentStatsProps> = ({ doc, onSelectQuery }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const suggestedQueries = [
    "Key takeaways",
    "Identify due dates",
    "Summarize risks"
  ];

  const handleSpeak = async () => {
    if (!doc.summary || isSpeaking) return;
    try {
      setIsSpeaking(true);
      
      // Initialize or resume shared context
      if (!sharedAudioContext) {
        sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } else if (sharedAudioContext.state === 'suspended') {
        await sharedAudioContext.resume();
      }

      const base64Audio = await generateSpeech(doc.summary.substring(0, 500));
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = sharedAudioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = sharedAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(sharedAudioContext.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
          <i className="fa-solid fa-file-pdf text-2xl"></i>
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-slate-100 truncate text-sm">{doc.name}</h3>
          <p className="text-xs text-slate-400">{(parseFloat(doc.size) / 1024 / 1024).toFixed(2)} MB • PDF</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <h4 className="text-xs font-bold uppercase tracking-widest">Summary</h4>
          </div>
          {doc.summary && (
            <button 
              onClick={handleSpeak}
              disabled={isSpeaking}
              className={`text-[10px] flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                isSpeaking ? 'bg-emerald-500 text-white' : 'text-slate-400 border-slate-700'
              }`}
            >
              <i className={`fa-solid ${isSpeaking ? 'fa-volume-high animate-pulse' : 'fa-play'}`}></i>
              {isSpeaking ? 'Speaking' : 'Read'}
            </button>
          )}
        </div>
        
        <div className="prose prose-invert prose-sm text-slate-300 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          <div className="text-sm leading-relaxed">{doc.summary || 'Analyzing...'}</div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map(q => (
              <button 
                key={q} 
                onClick={() => onSelectQuery(q)}
                className="px-2 py-1 bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-700 rounded text-[10px] text-slate-400 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

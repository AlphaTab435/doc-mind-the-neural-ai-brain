
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Chat } from './components/Chat';
import { DocumentStats } from './components/DocumentStats';
import { Message, DocumentData, AnalysisStatus } from './types';
import { analyzeDocument, askQuestionStream } from './services/gemini';

const App: React.FC = () => {
  const [currentDoc, setCurrentDoc] = useState<DocumentData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (file: File, base64: string) => {
    setStatus(AnalysisStatus.ANALYZING);
    setCurrentDoc({ name: file.name, size: file.size.toString(), type: file.type, base64: base64 });
    try {
      const summary = await analyzeDocument(base64, file.type);
      setCurrentDoc(prev => prev ? { ...prev, summary } : null);
      setStatus(AnalysisStatus.READY);
      setMessages([{ id: 'init', role: 'assistant', content: `Neural link established with **${file.name}**.`, timestamp: Date.now() }]);
    } catch (error: any) {
      setStatus(AnalysisStatus.ERROR);
      setCurrentDoc(null);
      alert(error.message);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentDoc || isProcessing) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    const aiMsgPlaceholder: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: Date.now() };

    setMessages(prev => [...prev, userMsg, aiMsgPlaceholder]);
    setIsProcessing(true);

    try {
      const stream = askQuestionStream(
        currentDoc.base64,
        currentDoc.type,
        text,
        messages.map(m => ({ role: m.role, content: m.content })),
        useSearch
      );

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullContent };
          return newMsgs;
        });
      }
    } catch (error: any) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = "Neural link saturated. Please try again.";
        return newMsgs;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {notification && (
        <div className="fixed top-20 right-6 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/30">
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-brain text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">DOC<span className="text-emerald-500">MIND</span></h1>
          </div>

          <div className="flex items-center gap-4">
            {import.meta.env.VITE_ENABLE_SEARCH === 'true' && (
              <button
                onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest ${useSearch ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
              >
                <i className={`fa-solid ${useSearch ? 'fa-globe' : 'fa-magnifying-glass'}`}></i>
                {useSearch ? 'Search Active' : 'Search Off'}
              </button>
            )}
            <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Free Tier</div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
        {!currentDoc ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-100 mb-6 text-center leading-tight">Your Documents,<br /><span className="text-emerald-500">Privately Decoded.</span></h2>
            <FileUpload onUpload={handleFileUpload} isLoading={status === AnalysisStatus.ANALYZING} />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-4"><DocumentStats doc={currentDoc} onSelectQuery={handleSendMessage} /></div>
            <div className="lg:col-span-8 h-full"><Chat messages={messages} onSendMessage={handleSendMessage} onReset={() => setCurrentDoc(null)} isProcessing={isProcessing} /></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { VMixState } from '../types';

interface Props {
  vMixState: VMixState | null;
  onExit: () => void;
}

export function TallyMode({ vMixState, onExit }: Props) {
  const [selectedInputKey, setSelectedInputKey] = useState<string | null>(null);
  
  if (!vMixState) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
         <h1 className="text-2xl font-bold mb-4">No connection to vMix</h1>
         <button onClick={onExit} className="bg-[#333] hover:bg-[#444] px-6 py-3 rounded uppercase font-bold tracking-widest text-sm transition-colors">Exit Tally</button>
      </div>
    );
  }

  // --- SELECTION SCREEN ---
  if (!selectedInputKey) {
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col p-4 text-white overflow-y-auto w-full h-[100dvh]">
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-orange-500">Select Tally Mode</h1>
           <button onClick={onExit} className="bg-[#333] hover:bg-[#444] px-4 py-2 rounded uppercase font-bold tracking-widest text-xs transition-colors">Exit</button>
        </div>

        <div className="mb-8">
           <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-[#333] pb-2">Общий Tally (General Tally)</h2>
           <button 
             onClick={() => setSelectedInputKey('MASTER')}
             className="w-full bg-[#1e1e1e] border-2 border-red-900/50 hover:border-red-500 rounded p-6 flex flex-col items-center text-center transition-all bg-gradient-to-b from-[#2a1111] to-[#1a0a0a]"
           >
              <span className="text-2xl font-bold mb-1 text-red-500 tracking-wider">MASTER STUDIO TALLY</span>
              <span className="text-sm font-bold text-gray-400">Shows current Program/Preview globally</span>
           </button>
        </div>
        
        <div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-[#333] pb-2">Индивидуальный Tally (Camera-Specific)</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {vMixState.inputs.map(input => (
                 <button 
                   key={input.key}
                   onClick={() => setSelectedInputKey(input.key)}
                   className="bg-[#222] border border-[#444] hover:border-green-500/50 hover:bg-[#2a2a2a] rounded p-4 flex flex-col items-center text-center transition-all active:scale-95"
                 >
                   <span className="text-3xl font-bold mb-2 text-gray-500">{input.number}</span>
                   <span className="text-xs font-bold line-clamp-2 leading-tight">{input.shortTitle}</span>
                 </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // --- RENDERING TALLY ---

  // Master Mode Render
  if (selectedInputKey === 'MASTER') {
     const pgmInput = vMixState.inputs.find(i => i.number === vMixState.activeInputNumber);
     const prvInput = vMixState.inputs.find(i => i.number === vMixState.previewInputNumber);

     return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col text-white transition-colors duration-150">
          <div className="flex justify-between items-start p-4">
             <div className="flex items-center gap-3">
               <span className="text-xl sm:text-2xl font-bold bg-[#222] px-3 py-1 rounded border border-[#333]">GENERAL TALLY</span>
               {vMixState.recording && (
                  <div className="flex items-center gap-2 bg-red-900/40 text-red-500 font-bold px-3 py-1 rounded border border-red-900 animate-pulse">
                     <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div>
                     REC
                  </div>
               )}
               {vMixState.streaming && (
                  <div className="flex items-center gap-2 bg-blue-900/40 text-blue-400 font-bold px-3 py-1 rounded border border-blue-900 animate-pulse">
                     <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
                     STREAM
                  </div>
               )}
             </div>
             <button onClick={() => setSelectedInputKey(null)} className="bg-[#222] hover:bg-[#333] border border-[#333] px-4 py-2 rounded uppercase font-bold text-xs transition-colors backdrop-blur-sm">Change</button>
          </div>
          
          <div className="flex-1 flex flex-col items-stretch justify-center p-4 gap-4">
             {/* Program Half */}
             <div className="flex-1 bg-red-600 rounded-lg flex flex-col items-center justify-center p-4 border-4 border-red-700 shadow-2xl flex-shrink-0">
                <span className="text-xs md:text-sm font-bold uppercase tracking-widest mix-blend-overlay opacity-80 mb-2">LIVE / PROGRAM</span>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-center truncate w-full mix-blend-overlay">
                   {pgmInput ? pgmInput.shortTitle : 'NONE'}
                </h2>
             </div>
             {/* Preview Half */}
             <div className="flex-1 bg-green-600 rounded-lg flex flex-col items-center justify-center p-4 border-4 border-green-700 shadow-xl flex-shrink-0">
                <span className="text-xs md:text-sm font-bold uppercase tracking-widest mix-blend-overlay opacity-80 mb-2">NEXT / PREVIEW</span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-center truncate w-full mix-blend-overlay">
                   {prvInput ? prvInput.shortTitle : 'NONE'}
                </h2>
             </div>
          </div>

          <div className="p-4 flex justify-between items-center opacity-50">
            <span className="text-xs font-bold tracking-widest uppercase">Master Studio View</span>
            <button onClick={onExit} className="bg-[#222] border border-[#333] hover:bg-[#333] px-3 py-1.5 rounded uppercase font-bold text-[10px] transition-colors">Exit Tally</button>
          </div>
        </div>
     );
  }

  // Camera-Specific Mode Render
  const selectedInput = vMixState.inputs.find(i => i.key === selectedInputKey);
  if (!selectedInput) {
     return (
       <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Input Disconnected</h1>
          <button onClick={() => setSelectedInputKey(null)} className="bg-[#333] hover:bg-[#444] px-6 py-3 rounded uppercase font-bold tracking-widest text-sm transition-colors">Change Input</button>
       </div>
     );
  }

  const isProgram = vMixState.activeInputNumber === selectedInput.number;
  const isPreview = vMixState.previewInputNumber === selectedInput.number;

  let bgClass = "bg-[#222]";
  let statusText = "SAFE";
  
  if (isProgram) {
    bgClass = "bg-red-600";
    statusText = "LIVE";
  } else if (isPreview) {
    bgClass = "bg-green-600";
    statusText = "PREVIEW";
  }

  return (
    <div className={`fixed inset-0 z-[100] ${bgClass} flex flex-col text-white transition-colors duration-150`}>
      <div className="flex justify-between items-start p-4">
         <div className="flex items-center gap-3">
           <span className="text-xl sm:text-2xl font-bold bg-black/30 px-3 py-1 rounded">CAM {selectedInput.number}</span>
           {vMixState.recording && (
              <div className="flex items-center gap-2 bg-red-900/40 text-red-100 font-bold px-3 py-1 rounded-full animate-pulse border border-red-500/50">
                 <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div>
                 <span className="text-xs uppercase tracking-wider">REC</span>
              </div>
           )}
           {vMixState.streaming && (
              <div className="flex items-center gap-2 bg-blue-900/40 text-blue-100 font-bold px-3 py-1 rounded-full animate-pulse border border-blue-500/50">
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
                 <span className="text-xs uppercase tracking-wider">ON AIR</span>
              </div>
           )}
         </div>
         <button onClick={() => setSelectedInputKey(null)} className="bg-black/30 hover:bg-black/50 px-4 py-2 rounded uppercase font-bold text-xs transition-colors backdrop-blur-sm">Change</button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
         <h1 className="text-7xl sm:text-8xl md:text-[10rem] font-bold tracking-tighter mix-blend-overlay opacity-80">{statusText}</h1>
         <h2 className="text-xl sm:text-3xl mt-4 font-bold bg-black/20 px-6 py-2 rounded text-center truncate w-full max-w-2xl mix-blend-overlay">{selectedInput.shortTitle}</h2>
      </div>

      <div className="p-4 flex justify-between items-center opacity-50">
        <span className="text-xs font-bold tracking-widest uppercase">Operator View</span>
        <button onClick={onExit} className="bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded uppercase font-bold text-[10px] transition-colors">Exit Tally</button>
      </div>
    </div>
  );
}

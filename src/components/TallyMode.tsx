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

  if (!selectedInputKey) {
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col p-4 text-white overflow-y-auto w-full h-[100dvh]">
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-orange-500">Select Camera for Tally</h1>
           <button onClick={onExit} className="bg-[#333] hover:bg-[#444] px-4 py-2 rounded uppercase font-bold tracking-widest text-xs transition-colors">Exit</button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
           {vMixState.inputs.map(input => (
              <button 
                key={input.key}
                onClick={() => setSelectedInputKey(input.key)}
                className="bg-[#222] border border-[#444] hover:border-orange-500 rounded p-4 flex flex-col items-center text-center transition-colors"
              >
                <span className="text-3xl font-bold mb-2 text-gray-500">{input.number}</span>
                <span className="text-xs font-bold line-clamp-2 leading-tight">{input.shortTitle}</span>
              </button>
           ))}
        </div>
      </div>
    );
  }

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
         <span className="text-xl sm:text-2xl font-bold bg-black/30 px-3 py-1 rounded">CAM {selectedInput.number}</span>
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

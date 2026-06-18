import React, { useState } from 'react';
import { VMixState, VMixInput } from '../types';
import { Layers, X } from 'lucide-react';

interface Props {
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function MultiViewEditor({ vMixState, sendCommand }: Props) {
  const [targetInput, setTargetInput] = useState<string>('');

  const handleSetLayer = (layer: number, sourceInput: string) => {
    if (!targetInput) return;
    sendCommand('SetMultiViewOverlay', targetInput, `${layer},${sourceInput === 'none' ? 0 : sourceInput}`);
  };

  const selectedInput = vMixState.inputs.find(i => i.number.toString() === targetInput);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#161616] border border-[#222] rounded p-4">
      <div className="flex items-center space-x-2 text-cyan-500 mb-4 shrink-0">
        <Layers size={18} />
        <h2 className="font-bold uppercase tracking-wider text-sm">MultiView / Compositing Configurator</h2>
      </div>

      <div className="mb-4 bg-[#111] border border-[#333] p-3 rounded shrink-0">
        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Target Base Input</label>
        <select 
          value={targetInput} 
          onChange={(e) => setTargetInput(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-[#444] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-500"
        >
          <option value="">-- Select Input to configure layers for --</option>
          {vMixState.inputs.filter(i => !i.type.toLowerCase().includes('audio')).map(i => (
             <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-2">
          Select an input here. The layers below represent its MultiView Overlays (Layers 1-10).
        </p>
      </div>

      {targetInput && selectedInput ? (
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
          {Array.from({ length: 10 }).map((_, idx) => {
             const layer = idx + 1;
             return (
               <div key={layer} className="bg-[#1a1a1a] border border-[#333] rounded p-2 flex flex-col items-center">
                 <div className="text-[10px] font-bold text-gray-400 mb-1 w-full text-left uppercase">Overlay Layer {layer}</div>
                 <select
                   defaultValue=""
                   onChange={(e) => handleSetLayer(layer, e.target.value)}
                   className="w-full bg-[#111] border border-[#222] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-cyan-500"
                 >
                   <option value="" disabled>Change Layer Source...</option>
                   <option value="none">-- Clear / None --</option>
                   {vMixState.inputs.map(i => (
                      <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
                   ))}
                 </select>
                 <div className="flex w-full space-x-1 mt-2">
                    <button 
                      onClick={() => sendCommand('MultiViewOverlayOn', targetInput, layer)}
                      className="flex-1 bg-[#222] hover:bg-[#333] text-gray-300 text-[10px] border border-[#333] rounded py-1 transition-colors uppercase font-bold"
                    >
                      On
                    </button>
                    <button 
                      onClick={() => sendCommand('MultiViewOverlayOff', targetInput, layer)}
                      className="flex-1 bg-[#222] hover:bg-[#333] text-gray-300 text-[10px] border border-[#333] rounded py-1 transition-colors uppercase font-bold"
                    >
                      Off
                    </button>
                 </div>
               </div>
             );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-xs text-center border-t border-[#222]">
          Select a Base Input above to manage its MultiView layers.
        </div>
      )}
    </div>
  );
}

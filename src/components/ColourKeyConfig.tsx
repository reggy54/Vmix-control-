import React, { useState } from 'react';
import { VMixState, VMixInput } from '../types';
import { X, Droplet, Layers, HelpCircle } from 'lucide-react';

interface Props {
  input: VMixInput;
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
  onClose: () => void;
}

export function ColourKeyConfig({ input, vMixState, sendCommand, onClose }: Props) {
  const [backgroundInput, setBackgroundInput] = useState<string>('');

  const handleApplyBasicPreset = () => {
    // Basic Green Screen setup: Turn on ColourKey, set background, and put this input as an overlay on the background
    // Or we could put this input on the background's MultiView overlay 1.
    sendCommand('ColourKeyOn', input.number);
    if (backgroundInput) {
       sendCommand('SetMultiViewOverlay', backgroundInput, `1,${input.number}`);
       alert(`Chroma enabled and placed over ${backgroundInput}.`);
    } else {
       alert('Chroma enabled on the input.');
    }
  };

  const clearMultiView = () => {
    if (backgroundInput) {
       sendCommand('SetMultiViewOverlay', backgroundInput, `1,0`);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
         <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#222]">
            <div className="flex items-center gap-2">
               <Droplet className="text-cyan-500" size={18} />
               <h2 className="font-bold text-white uppercase tracking-wider">Colour Key / Comp Settings</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
         </div>

         <div className="p-4 space-y-6 overflow-y-auto max-h-[80vh]">
            <div className="bg-[#111] p-3 rounded border border-[#222]">
               <div className="text-xs text-gray-500 mb-1">Target Input</div>
               <div className="text-lg font-bold text-gray-200">[{input.number}] {input.shortTitle}</div>
            </div>

            <div>
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chroma Status</h3>
               <div className="flex gap-2">
                  <button 
                     onClick={() => sendCommand('ColourKeyOn', input.number)}
                     className="flex-1 bg-cyan-900/40 hover:bg-cyan-900 text-cyan-400 border border-cyan-900/60 rounded py-2 text-xs font-bold uppercase transition-colors"
                  >
                     Enable Chroma
                  </button>
                  <button 
                     onClick={() => sendCommand('ColourKeyOff', input.number)}
                     className="flex-1 bg-red-900/40 hover:bg-red-900 text-red-500 border border-red-900/60 rounded py-2 text-xs font-bold uppercase transition-colors"
                  >
                     Disable Chroma
                  </button>
               </div>
               <p className="text-[10px] text-gray-500 mt-2 flex gap-1">
                 <HelpCircle size={10} className="shrink-0" />
                 Fine-tuning the Colour Key properties (tolerance, threshold) must be done in the main vMix interface.
               </p>
            </div>

            <div className="border-t border-[#333] pt-4">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                 <Layers size={12} /> Composition Presets
               </h3>
               
               <div className="bg-[#161616] p-3 rounded border border-[#333] space-y-3">
                  <p className="text-xs text-gray-400 shrink-0">
                     Quickly composite this input over a selected background using MultiView Layer 1.
                  </p>
                  
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase">Select Background</label>
                     <select
                        value={backgroundInput}
                        onChange={(e) => setBackgroundInput(e.target.value)}
                        className="bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-500 w-full"
                     >
                        <option value="">-- Choose Background Source --</option>
                        {vMixState.inputs.filter(i => i.key !== input.key && !i.type.toLowerCase().includes('audio')).map(i => (
                           <option key={i.key} value={i.number}>
                              [{i.number}] {i.shortTitle}
                           </option>
                        ))}
                     </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                     <button
                        onClick={handleApplyBasicPreset}
                        disabled={!backgroundInput}
                        className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-2 px-3 text-[10px] uppercase tracking-wider rounded transition-colors"
                     >
                        Apply Comp Overlay
                     </button>
                     <button
                        onClick={clearMultiView}
                        disabled={!backgroundInput}
                        className="flex-1 bg-[#333] hover:bg-[#444] disabled:bg-[#111] disabled:text-gray-700 text-gray-300 font-bold py-2 px-3 text-[10px] uppercase tracking-wider rounded transition-colors"
                     >
                        Reset Layer
                     </button>
                  </div>
               </div>
            </div>
         </div>
         
         <div className="p-4 border-t border-[#333] bg-[#111] flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase rounded transition-colors">
               Done
            </button>
         </div>
      </div>
    </div>
  );
}

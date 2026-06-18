import React, { useState } from 'react';
import { VMixState } from '../types';
import { Settings2, Maximize } from 'lucide-react';

interface Props {
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function ImageAdjustEditor({ vMixState, sendCommand }: Props) {
  const [selectedInput, setSelectedInput] = useState<string>('');

  const handleSlider = (func: string, value: number) => {
    if (!selectedInput) return;
    sendCommand(func, selectedInput, value);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#161616] border border-[#222] rounded p-4">
      <div className="flex items-center space-x-2 text-pink-500 mb-4 shrink-0">
        <Settings2 size={18} />
        <h2 className="font-bold uppercase tracking-wider text-sm">Position & Image Controls</h2>
      </div>

      <div className="mb-4 bg-[#111] border border-[#333] p-3 rounded shrink-0">
        <select 
          value={selectedInput} 
          onChange={(e) => setSelectedInput(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-[#444] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-pink-500"
        >
          <option value="">-- Select Input to adjust --</option>
          {vMixState.inputs.map(i => (
             <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
          ))}
        </select>
      </div>

      {selectedInput ? (
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          
          <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
            <h3 className="text-gray-300 font-bold uppercase text-xs mb-4 flex items-center gap-2">
              <Maximize size={14} className="text-gray-400" /> Virtual PTZ / Position
            </h3>
            
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Zoom</span>
                     <button onClick={() => handleSlider('SetZoom', 1)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="0" max="5" step="0.01" defaultValue="1" onChange={(e) => handleSlider('SetZoom', parseFloat(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Pan X</span>
                     <button onClick={() => handleSlider('SetPanX', 0)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="-2" max="2" step="0.01" defaultValue="0" onChange={(e) => handleSlider('SetPanX', parseFloat(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Pan Y</span>
                     <button onClick={() => handleSlider('SetPanY', 0)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="-2" max="2" step="0.01" defaultValue="0" onChange={(e) => handleSlider('SetPanY', parseFloat(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Rotation (Z)</span>
                     <button onClick={() => handleSlider('SetZRotation', 0)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="-3" max="3" step="0.01" defaultValue="0" onChange={(e) => handleSlider('SetZRotation', parseFloat(e.target.value))} className="w-full" />
               </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
            <h3 className="text-gray-300 font-bold uppercase text-xs mb-4 flex items-center gap-2">
              <Settings2 size={14} className="text-gray-400" /> Color Adjustments
            </h3>
            
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Alpha (Opacity) / Fade</span>
                     <button onClick={() => handleSlider('SetAlpha', 255)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="0" max="255" defaultValue="255" onChange={(e) => handleSlider('SetAlpha', parseInt(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Set Picture Lift (Y)</span>
                     <button onClick={() => handleSlider('SetPictureLiftY', 0)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="-1" max="1" step="0.01" defaultValue="0" onChange={(e) => handleSlider('SetPictureLiftY', parseFloat(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Set Picture Gamma (Y)</span>
                     <button onClick={() => handleSlider('SetPictureGammaY', 1)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="0" max="2" step="0.01" defaultValue="1" onChange={(e) => handleSlider('SetPictureGammaY', parseFloat(e.target.value))} className="w-full" />
               </div>
               <div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
                     <span>Set Picture Gain (Y)</span>
                     <button onClick={() => handleSlider('SetPictureGainY', 1)} className="text-pink-500 hover:text-pink-400">Reset</button>
                  </div>
                  <input type="range" min="0" max="2" step="0.01" defaultValue="1" onChange={(e) => handleSlider('SetPictureGainY', parseFloat(e.target.value))} className="w-full" />
               </div>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-xs text-center border-t border-[#222]">
          Select an input above to adjust its position and image.
        </div>
      )}
    </div>
  );
}

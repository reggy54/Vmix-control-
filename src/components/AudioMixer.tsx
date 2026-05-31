import React from 'react';
import { VMixState } from '../types';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function AudioMixer({ vMixState, sendCommand }: Props) {
  if (!vMixState) {
     return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  // Filter inputs that have audio attributes (vMix defaults to 100 if none, but maybe we just show all inputs except Image? Or let's let the user see everything because vMix actually allows audio on unexpected inputs sometimes)
  // Let's filter out 'Image', 'ImageGallery', 'Title', 'Color', 'Placeholder'
  const audioInputs = vMixState.inputs.filter(i => {
     const t = i.type.toLowerCase();
     if (t === 'image' || t.includes('title') || t === 'color' || t.includes('virtualset')) return false;
     return true;
  });

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 flex space-x-2">
      {audioInputs.map(input => (
         <div key={input.key} className="bg-[#111] border border-[#222] rounded flex flex-col items-center p-2 min-w-[70px] shrink-0 h-full group">
            <span className="text-[9px] font-bold text-gray-400 mb-1">{input.number}</span>
            <div className="flex-1 w-8 bg-black rounded relative my-2 border border-[#333] flex flex-col-reverse group-hover:border-[#555] transition-colors">
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={input.volume}
                 onChange={(e) => sendCommand('SetVolume', input.number, e.target.value)}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
               />
               <div 
                 className={`w-full transition-all duration-75 ${input.muted ? 'bg-gray-600' : 'bg-green-500'}`} 
                 style={{ height: `${input.volume}%` }}
               ></div>
            </div>
            
            <button 
              onClick={() => sendCommand('Audio', input.number)}
              className={`w-full py-1 text-[10px] font-bold rounded transition-colors uppercase ${input.muted ? 'bg-red-900/50 text-red-500 border border-red-900' : 'bg-green-900/40 text-green-500 border border-green-900/60'}`}
            >
               {input.muted ? 'Muted' : 'On'}
            </button>
            <div className="mt-2 text-[8px] text-center w-full truncate opacity-50 uppercase tracking-widest">{input.shortTitle}</div>
         </div>
      ))}
      {audioInputs.length === 0 && <div className="text-gray-500 text-xs italic">No audio sources found.</div>}
    </div>
  );
}

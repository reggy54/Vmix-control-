import React, { useState } from 'react';

interface Props {
  sendCommand: (func: string, input?: string | number, value?: string | number, duration?: number) => void;
}

export function TransitionPanel({ sendCommand }: Props) {
  const [duration, setDuration] = useState(500);

  const TRANSITIONS = ['Cut', 'Fade', 'Merge', 'Wipe', 'CubeZoom', 'Fly', 'CrossZoom'];

  return (
    <div className="flex flex-col justify-center space-y-1 w-full shrink-0 bg-[#161616] p-1 rounded border border-[#222]">
      <div className="flex flex-row lg:flex-col gap-1 w-full">
         <div className="flex flex-1 lg:flex-none flex-col items-center justify-center p-1 bg-[#111] rounded border border-[#333]">
            <span className="text-[8px] uppercase tracking-wider text-gray-500 mb-0.5">Duration (ms)</span>
            <input 
               type="number" 
               value={duration} 
               onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
               className="w-full bg-black border border-[#444] rounded text-white text-xs px-1 py-1 text-center font-mono outline-none focus:border-cyan-500"
            />
         </div>

         <div className="flex-[3] lg:flex-none grid grid-cols-4 lg:grid-cols-2 gap-1">
            {TRANSITIONS.slice(0,4).map(trans => (
               <button 
                  key={trans}
                  onClick={() => sendCommand(trans, undefined, undefined, trans === 'Cut' ? undefined : duration)} 
                  className="bg-[#2a2a2a] hover:bg-[#444] text-[9px] font-bold py-2 sm:py-1 px-1 rounded border border-white/5 uppercase transition-colors"
               >
                  {trans}
               </button>
            ))}
         </div>
      </div>
      
      <div className="flex flex-row lg:flex-col gap-1 w-full">
         <div className="flex-[3] lg:flex-none grid grid-cols-3 lg:grid-cols-2 gap-1">
            {TRANSITIONS.slice(4).map(trans => (
               <button 
                  key={trans}
                  onClick={() => sendCommand(trans, undefined, undefined, duration)} 
                  className="bg-[#2a2a2a] hover:bg-[#444] text-[9px] font-bold py-2 sm:py-1 px-1 rounded border border-white/5 uppercase transition-colors"
               >
                  {trans}
               </button>
            ))}
         </div>

         <div className="flex-[4] lg:flex-none grid grid-cols-4 lg:grid-cols-2 gap-1">
            {[1, 2, 3, 4].map(num => (
               <button 
                  key={`Stinger${num}`}
                  onClick={() => sendCommand(`Stinger${num}`)} 
                  className="bg-[#3a2020] hover:bg-[#5a3030] text-[9px] text-red-100 font-bold py-2 sm:py-1 px-1 rounded border border-red-900/50 uppercase transition-colors"
                  title={`Stinger ${num}`}
               >
                  ST{num}
               </button>
            ))}
         </div>
      </div>
      
      <div className="hidden lg:flex flex-1 mt-1 bg-black rounded relative overflow-hidden flex-col items-center justify-center border border-[#333] group py-4 min-h-[100px]">
         <span className="absolute text-[#444] font-mono text-[10px] uppercase pointer-events-none group-hover:opacity-0 transition-opacity whitespace-nowrap" style={{ transform: 'rotate(-90deg)' }}>T-Bar</span>
         <input 
            type="range" 
            min="0" max="255" 
            defaultValue="0"
            onChange={(e) => sendCommand('SetFader', parseInt(e.target.value))}
            className="w-2 h-full appearance-none bg-transparent rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded relative z-10 opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ WebkitAppearance: 'slider-vertical' } as any}
         />
      </div>
    </div>
  );
}

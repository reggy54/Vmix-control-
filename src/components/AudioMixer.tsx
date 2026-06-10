import React from 'react';
import { VMixState } from '../types';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

const BUSES = ['M', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function AudioMixer({ vMixState, sendCommand }: Props) {
  if (!vMixState) {
     return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  const audioInputs = vMixState.inputs.filter(i => {
     const t = i.type.toLowerCase();
     if (t === 'image' || t.includes('title') || t === 'color' || t.includes('virtualset')) return false;
     return true;
  });

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 flex space-x-4">
      {/* Inputs Section */}
      <div className="flex space-x-2">
        {audioInputs.map(input => (
           <div key={input.key} className="bg-[#111] border border-[#222] rounded flex flex-col items-center p-2 min-w-[100px] shrink-0 h-full group">
              <span className="text-[9px] font-bold text-gray-400 mb-1 truncate w-full text-center">{input.number} • {input.shortTitle}</span>
              <div className="flex-1 flex space-x-2 my-2 w-full justify-center">
                {/* VU Meters */}
                <div className="w-4 h-full bg-black border border-[#333] rounded overflow-hidden flex space-x-0.5 p-0.5 shrink-0 rotate-180">
                   <div className="flex-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75" style={{ transform: `scaleY(${Math.min(1, input.meterF1)})`, transformOrigin: 'top' }}></div>
                   <div className="flex-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75" style={{ transform: `scaleY(${Math.min(1, input.meterF2)})`, transformOrigin: 'top' }}></div>
                </div>

                {/* Fader */}
                <div className="w-8 h-full bg-black rounded relative border border-[#333] flex flex-col-reverse group-hover:border-[#555] transition-colors shrink-0">
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
                     className={`w-full transition-all duration-75 ${input.muted ? 'bg-gray-600' : 'bg-blue-500'}`} 
                     style={{ height: `${input.volume}%` }}
                   ></div>
                </div>

                {/* Bus Routing */}
                <div className="flex flex-col justify-between h-full w-4 shrink-0 space-y-0.5">
                   <button 
                     onClick={() => sendCommand(input.solo ? 'SoloOff' : 'SoloOn', input.number)}
                     className={`flex-1 min-h-[12px] text-[7px] font-bold rounded ${input.solo ? 'bg-yellow-500 text-black' : 'bg-[#222] text-gray-500 hover:bg-[#333]'}`}
                     title="Solo / Headphones"
                   >
                     S
                   </button>
                   {BUSES.map(bus => {
                      const isActive = input.audiobusses.includes(bus);
                      return (
                        <button 
                          key={bus}
                          onClick={() => sendCommand('AudioBus', input.number, bus)}
                          className={`flex-1 min-h-[12px] text-[7px] font-bold rounded ${isActive ? 'bg-green-500 text-black' : 'bg-[#222] text-gray-500 hover:bg-[#333]'}`}
                          title={`Toggle Bus ${bus}`}
                        >
                          {bus}
                        </button>
                      );
                   })}
                </div>
              </div>
              
              <button 
                onClick={() => sendCommand('Audio', input.number)}
                className={`w-full py-1 text-[10px] font-bold rounded transition-colors uppercase mt-1 ${input.muted ? 'bg-red-900/50 text-red-500 border border-red-900' : 'bg-green-900/40 text-green-500 border border-green-900/60'}`}
              >
                 {input.muted ? 'Muted' : 'Audio On'}
              </button>
           </div>
        ))}
        {audioInputs.length === 0 && <div className="text-gray-500 text-xs italic">No audio sources found.</div>}
      </div>

      <div className="w-px bg-[#333] shrink-0 mx-2"></div>

      {/* output buses section */}
      <div className="flex space-x-2 shrink-0">
        {vMixState.audio?.map(bus => (
           <div key={bus.name} className="bg-[#111] border border-[#222] rounded flex flex-col items-center p-2 min-w-[70px] shrink-0 h-full group">
              <span className="text-[9px] font-bold text-orange-400 mb-1 truncate w-full text-center uppercase tracking-widest">{bus.name}</span>
              <div className="flex-1 flex space-x-2 my-2 w-full justify-center">
                {/* VU Meters */}
                <div className="w-4 h-full bg-black border border-[#333] rounded overflow-hidden flex space-x-0.5 p-0.5 shrink-0 rotate-180">
                   <div className="flex-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75" style={{ transform: `scaleY(${Math.min(1, bus.meterF1)})`, transformOrigin: 'top' }}></div>
                   <div className="flex-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75" style={{ transform: `scaleY(${Math.min(1, bus.meterF2)})`, transformOrigin: 'top' }}></div>
                </div>

                {/* Fader */}
                <div className="w-8 h-full bg-black rounded relative border border-[#333] flex flex-col-reverse group-hover:border-[#555] transition-colors shrink-0">
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={bus.volume}
                     onChange={(e) => {
                       if (bus.name === 'master') {
                         sendCommand('SetMasterVolume', undefined, e.target.value);
                       } else if (bus.name === 'headphones') {
                         sendCommand('SetHeadphonesVolume', undefined, e.target.value);
                       } else {
                         const b = bus.name.replace('bus', '').toUpperCase();
                         sendCommand(`SetBus${b}Volume`, undefined, e.target.value);
                       }
                     }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                   />
                   <div 
                     className={`w-full transition-all duration-75 ${bus.muted ? 'bg-gray-600' : 'bg-orange-500'}`} 
                     style={{ height: `${bus.volume}%` }}
                   ></div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                   if (bus.name === 'master') {
                     sendCommand('MasterAudio');
                   } else if (bus.name === 'headphones') {
                     // Headphones mute isn't standard
                   } else {
                     const b = bus.name.replace('bus', '').toUpperCase();
                     sendCommand(`Bus${b}Audio`);
                   }
                }}
                className={`w-full py-1 text-[10px] font-bold rounded transition-colors uppercase mt-1 ${bus.muted ? 'bg-red-900/50 text-red-500 border border-red-900' : 'bg-orange-900/40 text-orange-500 border border-orange-900/60'}`}
              >
                 {bus.muted ? 'Muted' : 'On'}
              </button>
           </div>
        ))}
      </div>
    </div>
  );
}

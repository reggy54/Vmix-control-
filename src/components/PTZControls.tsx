import React from 'react';
import { VMixState } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Save } from 'lucide-react';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string) => void;
}

export function PTZControls({ vMixState, sendCommand }: Props) {
  const [selectedInput, setSelectedInput] = React.useState<number | null>(null);

  if (!vMixState) {
    return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  const cameras = vMixState.inputs.filter(i => {
    const type = i.type.toLowerCase();
    return type.includes('camera') || type.includes('capture') || type.includes('ndi') || type.includes('stream');
  });

  return (
    <div className="flex w-full h-full">
      {/* Sidebar - Camera List */}
      <div className="w-1/3 min-w-[150px] border-r border-[#333] flex flex-col p-2 space-y-2 overflow-y-auto">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Camera</h3>
        {cameras.length === 0 && <div className="text-gray-500 text-xs py-2">No cameras found.</div>}
        {cameras.map(cam => (
           <button 
             key={cam.key}
             onClick={() => setSelectedInput(cam.number)}
             className={`p-3 rounded border text-left transition-colors flex flex-col ${selectedInput === cam.number ? 'bg-[#222] border-orange-500' : 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]'}`}
           >
             <span className="text-[10px] font-bold text-gray-500">CAM {cam.number}</span>
             <span className="text-xs font-bold truncate w-full text-gray-300">{cam.shortTitle}</span>
           </button>
        ))}
      </div>

      {/* Main Area - Controls */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#0a0a0a]">
        {!selectedInput ? (
          <div className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Select a camera to control</div>
        ) : (
          <div className="flex flex-col items-center max-w-sm w-full space-y-10">
             
             {/* D-PAD */}
             <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#161616] border-[4px] border-[#222] flex items-center justify-center shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
               {/* Center Block */}
               <div className="absolute w-16 h-16 bg-[#2a2a2a] rounded-full pointer-events-none z-10 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"></div>
               
               {/* UP */}
               <button 
                 onMouseDown={() => sendCommand('PTZMoveUp', selectedInput)}
                 onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                 onTouchStart={() => sendCommand('PTZMoveUp', selectedInput)}
                 onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                 className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-orange-500/80 active:bg-orange-500 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
               >
                  <ArrowUp size={32} />
               </button>
               
               {/* DOWN */}
               <button 
                 onMouseDown={() => sendCommand('PTZMoveDown', selectedInput)}
                 onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                 onTouchStart={() => sendCommand('PTZMoveDown', selectedInput)}
                 onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                 className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-orange-500/80 active:bg-orange-500 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
               >
                  <ArrowDown size={32} />
               </button>
               
               {/* LEFT */}
               <button 
                 onMouseDown={() => sendCommand('PTZMoveLeft', selectedInput)}
                 onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                 onTouchStart={() => sendCommand('PTZMoveLeft', selectedInput)}
                 onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                 className="absolute left-2 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-orange-500/80 active:bg-orange-500 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
               >
                  <ArrowLeft size={32} />
               </button>
               
               {/* RIGHT */}
               <button 
                 onMouseDown={() => sendCommand('PTZMoveRight', selectedInput)}
                 onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                 onTouchStart={() => sendCommand('PTZMoveRight', selectedInput)}
                 onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                 className="absolute right-2 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-orange-500/80 active:bg-orange-500 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
               >
                  <ArrowRight size={32} />
               </button>
             </div>

             {/* ZOOM ROCKER & PRESETS */}
             <div className="flex w-full space-x-6 justify-center">
                {/* Zoom */}
                <div className="flex flex-col space-y-2 bg-[#161616] p-2 rounded-xl border border-[#222]">
                  <span className="text-[10px] font-bold text-center text-gray-500 uppercase tracking-widest mb-1">Zoom</span>
                  <button 
                    onMouseDown={() => sendCommand('PTZZoomIn', selectedInput)}
                    onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                    onTouchStart={() => sendCommand('PTZZoomIn', selectedInput)}
                    onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-blue-600/80 active:bg-blue-600 text-gray-300 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                  >
                     <ZoomIn size={24} />
                  </button>
                  <button 
                    onMouseDown={() => sendCommand('PTZZoomOut', selectedInput)}
                    onMouseUp={() => sendCommand('PTZMoveStop', selectedInput)}
                    onTouchStart={() => sendCommand('PTZZoomOut', selectedInput)}
                    onTouchEnd={() => sendCommand('PTZMoveStop', selectedInput)}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-[#252525] hover:bg-blue-600/80 active:bg-blue-600 text-gray-300 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                  >
                     <ZoomOut size={24} />
                  </button>
                </div>

                {/* Presets */}
                <div className="flex-1 flex flex-col space-y-2 bg-[#161616] p-3 rounded-xl border border-[#222]">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-center">Presets</span>
                   <div className="grid grid-cols-2 gap-2">
                     {[1, 2, 3, 4].map(preset => (
                        <div key={preset} className="flex relative group">
                           <button 
                             onClick={() => sendCommand('PTZMoveToVirtualPTZPosition', selectedInput, preset.toString())}
                             className="flex-1 min-w-[50px] bg-[#222] hover:bg-[#333] border border-[#333] hover:border-gray-500 text-white font-bold py-3 text-xs rounded-l transition-colors"
                           >
                             P{preset}
                           </button>
                           <button 
                             onDoubleClick={() => sendCommand('PTZUpdateVirtualPTZPosition', selectedInput, preset.toString())}
                             className="bg-[#1a1a1a] border-y border-r border-[#333] text-gray-500 hover:text-red-400 hover:bg-[#2a2a2a] px-2 rounded-r flex items-center justify-center transition-colors"
                             title="Double click to Save Preset here"
                           >
                             <Save size={10} />
                           </button>
                        </div>
                     ))}
                   </div>
                   <span className="text-[8px] text-gray-600 text-center uppercase tracking-widest mt-2">Dbl-click save icon to update</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

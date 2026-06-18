import React, { useState } from 'react';
import { VMixState } from '../types';
import { ListVideo, Code, Play, Square, SkipBack, SkipForward } from 'lucide-react';

interface Props {
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function PlaylistsScriptsEditor({ vMixState, sendCommand }: Props) {
  const [scriptName, setScriptName] = useState('');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#161616] border border-[#222] rounded p-4">
      <div className="flex items-center space-x-2 text-indigo-400 mb-4 shrink-0">
        <ListVideo size={18} />
        <h2 className="font-bold uppercase tracking-wider text-sm">Playlists & Scripts</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        
        {/* Playlists */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
          <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
             <ListVideo size={14} className="text-gray-400" />
             <span>vMix Playlist</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-4">Control the global PlayList configured in vMix settings.</p>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             <button 
               onClick={() => sendCommand('StartPlayList')}
               className="bg-[#222] hover:bg-green-900/50 text-green-500 border border-[#333] py-3 rounded text-xs font-bold uppercase flex flex-col justify-center items-center gap-1 transition-colors"
             >
               <Play size={14} /> Start
             </button>
             <button 
               onClick={() => sendCommand('StopPlayList')}
               className="bg-[#222] hover:bg-red-900/50 text-red-500 border border-[#333] py-3 rounded text-xs font-bold uppercase flex flex-col justify-center items-center gap-1 transition-colors"
             >
               <Square size={14} /> Stop
             </button>
             <button 
               onClick={() => sendCommand('PreviousPlayList')}
               className="bg-[#222] hover:bg-[#333] text-gray-300 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
             >
               <SkipBack size={12} /> Previous
             </button>
             <button 
               onClick={() => sendCommand('NextPlayList')}
               className="bg-[#222] hover:bg-[#333] text-gray-300 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
             >
               Next <SkipForward size={12} />
             </button>
          </div>
        </div>

        {/* Scripts */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
          <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
             <Code size={14} className="text-gray-400" />
             <span>Local Scripts</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-4">Start or stop a named script configured in vMix.</p>
          
          <div className="mt-4">
            <input 
              type="text" 
              placeholder="Script Name..." 
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 mb-2 font-mono"
            />
            <div className="flex space-x-2 mt-2">
               <button 
                 onClick={() => { if (scriptName) sendCommand('StartScript', undefined, scriptName) }}
                 className="flex-1 bg-[#222] hover:bg-green-900/50 text-green-500 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
               >
                 <Play size={14} /> Start
               </button>
               <button 
                 onClick={() => { if (scriptName) sendCommand('StopScript', undefined, scriptName) }}
                 className="flex-1 bg-[#222] hover:bg-red-900/50 text-red-500 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
               >
                 <Square size={14} /> Stop
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

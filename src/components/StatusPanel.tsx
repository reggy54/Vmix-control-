import React from 'react';
import { VMixState } from '../types';
import { formatTime, formatSeconds } from '../utils';
import { Circle, Radio, LayoutGrid, Monitor, MonitorUp } from 'lucide-react';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function StatusPanel({ vMixState, sendCommand }: Props) {
  return (
    <div className="flex gap-1 mb-2 w-full shrink-0 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
      <button 
         onClick={() => sendCommand('StartStopRecording')}
         className={`flex items-center gap-1.5 px-2 py-1.5 rounded font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors flex-1 min-w-[80px] sm:min-w-[100px] justify-center border ${vMixState?.recording ? 'bg-red-900 border-red-500 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-[#111] hover:bg-[#222] border-[#333] text-gray-400'}`}
      >
        <Circle size={10} className={vMixState?.recording ? 'fill-current' : ''} />
        <div className="flex flex-col items-center leading-none">
          <span>REC</span>
          {vMixState?.recording && vMixState.recordingTime > 0 && <span className="text-[9px] font-mono mt-0.5">{formatSeconds(vMixState.recordingTime)}</span>}
        </div>
      </button>

      <div className={`flex items-stretch rounded border ${vMixState?.streaming ? 'bg-orange-900 border-orange-500 text-orange-100 shadow-[0_0_8px_rgba(249,115,22,0.3)] animate-pulse' : 'bg-[#111] border-[#333] text-gray-400'} flex-1 min-w-[120px] transition-colors overflow-hidden`}>
          <button 
             onClick={() => sendCommand('StartStopStreaming')}
             className="flex items-center gap-1.5 px-2 py-1.5 font-bold text-[10px] sm:text-xs uppercase tracking-wider hover:bg-black/20 flex-1 justify-center"
          >
            <Radio size={10} />
            <div className="flex flex-col items-center leading-none">
              <span>STREAM</span>
              {vMixState?.streaming && vMixState.streamingTime > 0 && <span className="text-[9px] font-mono mt-0.5">{formatSeconds(vMixState.streamingTime)}</span>}
            </div>
          </button>
          <div className="flex flex-col divide-y divide-[#333] border-l border-[#333] min-w-[20px]">
             <button onClick={() => sendCommand('StartStopStreaming', undefined, 0)} className="flex-1 px-1 text-[8px] hover:bg-black/20 font-bold">1</button>
             <button onClick={() => sendCommand('StartStopStreaming', undefined, 1)} className="flex-1 px-1 text-[8px] hover:bg-black/20 font-bold">2</button>
             <button onClick={() => sendCommand('StartStopStreaming', undefined, 2)} className="flex-1 px-1 text-[8px] hover:bg-black/20 font-bold">3</button>
          </div>
      </div>

      <button 
         onClick={() => sendCommand('StartStopExternal')}
         className={`flex items-center gap-1.5 px-2 py-1.5 rounded font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors flex-1 min-w-[80px] sm:min-w-[100px] justify-center border ${vMixState?.external ? 'bg-blue-900 border-blue-500 text-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.3)] animate-pulse' : 'bg-[#111] hover:bg-[#222] border-[#333] text-gray-400'}`}
      >
        <MonitorUp size={10} />
        <span>EXT</span>
      </button>

      <button 
         onClick={() => sendCommand('StartStopMultiCorder')}
         className={`flex items-center gap-1.5 px-2 py-1.5 rounded font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors flex-1 min-w-[80px] sm:min-w-[100px] justify-center border ${vMixState?.multiCorder ? 'bg-purple-900 border-purple-500 text-purple-100 shadow-[0_0_8px_rgba(168,85,247,0.3)] animate-pulse' : 'bg-[#111] hover:bg-[#222] border-[#333] text-gray-400'}`}
      >
        <LayoutGrid size={10} />
        <span>MULTI</span>
      </button>
    </div>
  );
}

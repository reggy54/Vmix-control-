import React from 'react';
import { VMixInput } from '../types';
import { Play, Pause, VolumeX } from 'lucide-react';

interface Props {
  input: VMixInput;
  isActive: boolean;
  isPreview: boolean;
  onClick: () => void;
  onDirectCut: () => void;
}

export function InputCard({ input, isActive, isPreview, onClick, onDirectCut }: Props) {
  let borderColor = 'border-transparent';
  let numberColor = 'text-gray-300';
  let pgmBg = 'bg-[#333]';
  let pgmBorder = '';
  let pvwBg = 'bg-[#333]';
  let pvwBorder = '';
  
  if (isActive) {
    borderColor = 'border-red-600';
    numberColor = 'text-red-500';
    pgmBg = 'bg-red-900/50';
    pgmBorder = 'border border-red-600/30';
  } else if (isPreview) {
    borderColor = 'border-green-600';
    numberColor = 'text-green-500';
    pvwBg = 'bg-green-900/50';
    pvwBorder = 'border border-green-600/30';
  }

  return (
    <div 
      className={`relative bg-[#252525] border-t-2 ${borderColor} rounded overflow-hidden p-1 flex flex-col h-24 hover:bg-[#2c2c2c] transition-colors`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center px-1 mb-1 shrink-0">
        <div className="flex items-center space-x-1">
           <span className={`text-[9px] font-bold ${numberColor}`}>{input.number}</span>
           <div className="flex space-x-0.5">
             {input.muted && <VolumeX size={10} className="text-red-400" />}
             {input.state === 'Running' && <Play size={10} className="text-green-400" />}
             {input.state === 'Paused' && <Pause size={10} className="text-yellow-400" />}
           </div>
        </div>
        <span className="text-[8px] opacity-50 uppercase truncate max-w-[50%]">{input.type}</span>
      </div>
      
      <div 
        className="flex-1 bg-black/40 rounded flex items-center justify-center p-1 cursor-pointer overflow-hidden group relative"
        onDoubleClick={(e) => {
           e.stopPropagation();
           onDirectCut();
        }}
      >
        <div className="text-[10px] font-bold text-center line-clamp-2 break-all group-hover:opacity-20 transition-opacity italic title-font" title={input.title}>
          {input.shortTitle}
        </div>
        <div 
           className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
           onClick={(e) => {
             e.stopPropagation();
             onDirectCut();
           }}
        >
           <span className="text-white text-[9px] font-bold uppercase tracking-wider">Quick Cut</span>
        </div>
      </div>

      <div className="mt-1 flex space-x-1 shrink-0">
        <button 
          className={`flex-1 text-[8px] py-1 rounded transition-colors ${pgmBg} ${pgmBorder} hover:bg-red-700/80`}
          onClick={(e) => {
            e.stopPropagation();
            onDirectCut();
          }}
        >
          PGM
        </button>
        <button 
          className={`flex-1 text-[8px] py-1 rounded transition-colors ${pvwBg} ${pvwBorder} hover:bg-green-700/80`}
          onClick={(e) => {
             e.stopPropagation();
             onClick(); // Set Preview
          }}
        >
          PVW
        </button>
      </div>
    </div>
  );
}

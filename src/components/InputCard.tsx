import React from 'react';
import { VMixInput } from '../types';
import { Play, Pause, VolumeX, Volume2, RotateCcw } from 'lucide-react';
import { formatTime } from '../utils';

interface Props {
  input: VMixInput;
  vmixUrl: string;
  isActive: boolean;
  isPreview: boolean;
  onClick: () => void;
  onDirectCut: () => void;
  onCommand: (func: string, value?: string) => void;
}

export function InputCard({ input, vmixUrl, isActive, isPreview, onClick, onDirectCut, onCommand }: Props) {
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

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommand('Audio');
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommand('PlayPause');
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommand('Restart');
  };

  // We add a timestamp so the image updates occasionally, perhaps every 5 seconds.
  const timeQuery = Math.floor(Date.now() / 2000);
  const thumbUrl = vmixUrl ? `${vmixUrl}/api/?thumbnail=${input.key}&t=${timeQuery}` : '';

  return (
    <div 
      className={`relative bg-[#252525] border-t-2 ${borderColor} rounded overflow-hidden p-1 flex flex-col h-24 hover:bg-[#2c2c2c] transition-colors`}
      onClick={onClick}
    >
      <div 
        className="absolute inset-0 opacity-40 bg-cover bg-center pointer-events-none" 
        style={{ backgroundImage: thumbUrl ? `url("${thumbUrl}")` : 'none' }}
      ></div>
      <div className="flex justify-between items-center px-1 mb-1 shrink-0">
        <div className="flex items-center space-x-1 relative z-20">
           <span className={`text-[9px] font-bold ${numberColor} mr-1`}>{input.number}</span>
           <button onClick={handleMute} className="hover:text-white" title="Toggle Audio">
             {input.muted ? <VolumeX size={10} className="text-red-400" /> : <Volume2 size={10} className="text-green-500" />}
           </button>
           {['Running', 'Paused'].includes(input.state) && (
             <>
                <button onClick={handlePlayPause} className="hover:text-white" title="Play/Pause">
                  {input.state === 'Running' ? <Pause size={10} className="text-yellow-400" /> : <Play size={10} className="text-green-400" />}
                </button>
                <button onClick={handleRestart} className="hover:text-white" title="Restart">
                  <RotateCcw size={10} className="text-blue-400" />
                </button>
             </>
           )}
        </div>
        <span className="text-[8px] opacity-50 uppercase truncate max-w-[40%]">{input.type}</span>
      </div>
      
      <div 
        className="flex-1 bg-black/40 rounded flex flex-col items-center justify-center p-1 cursor-pointer overflow-hidden group relative"
        onDoubleClick={(e) => {
           e.stopPropagation();
           onDirectCut();
        }}
      >
        <div className="text-[10px] font-bold text-center line-clamp-2 break-all group-hover:opacity-20 transition-opacity italic title-font" title={input.title}>
          {input.shortTitle}
        </div>
        
        {input.duration > 0 && (
           <div className={`text-[9px] font-mono font-bold mt-0.5 z-10 bg-black/60 px-1 rounded ${(input.duration - input.position) < 10000 ? 'text-red-400' : 'text-gray-300'}`}>
              -{formatTime(input.duration - input.position)}
           </div>
        )}

        {/* Progress Bar for Media */}
        {input.duration > 0 && (
           <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-10 w-full pointer-events-none">
              <div 
                className={`h-full ${(input.duration - input.position) < 10000 ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-300 ease-linear`}
                style={{ width: `${(input.position / input.duration) * 100}%` }}
              ></div>
           </div>
        )}

        <div 
           className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
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

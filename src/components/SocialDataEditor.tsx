import React, { useState } from 'react';
import { VMixState } from '../types';
import { MessageSquare, Database, UserPlus, Phone, Play, SkipForward, SkipBack } from 'lucide-react';

interface Props {
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function SocialDataEditor({ vMixState, sendCommand }: Props) {
  const [dataSourceName, setDataSourceName] = useState('');
  const [dataSourceTable, setDataSourceTable] = useState('');
  
  const handleDataSourceNext = () => {
    if (dataSourceName && dataSourceTable) {
       sendCommand('DataSourceNextRow', undefined, `${dataSourceName},${dataSourceTable}`);
    }
  };

  const handleDataSourcePrev = () => {
    if (dataSourceName && dataSourceTable) {
       sendCommand('DataSourcePreviousRow', undefined, `${dataSourceName},${dataSourceTable}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#161616] border border-[#222] rounded p-4">
      <div className="flex items-center space-x-2 text-cyan-400 mb-4 shrink-0">
        <MessageSquare size={18} />
        <h2 className="font-bold uppercase tracking-wider text-sm">Social, Calls & Data</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        
        {/* vMix Social */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
          <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
             <MessageSquare size={14} className="text-gray-400" />
             <span>vMix Social</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-4">Control the vMix Social plugin for live comments.</p>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             <button 
               onClick={() => sendCommand('SocialNext')}
               className="col-span-2 bg-[#222] hover:bg-green-900/50 text-green-500 border border-[#333] py-3 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors"
             >
               Next Comment <SkipForward size={14} />
             </button>
             <button 
               onClick={() => sendCommand('SocialPrevious')}
               className="bg-[#222] hover:bg-[#333] text-gray-300 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
             >
               <SkipBack size={12} /> Prev
             </button>
             <button 
               onClick={() => sendCommand('SocialQueue')}
               className="bg-[#222] hover:bg-blue-900/50 text-blue-400 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
             >
               Add to Queue
             </button>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
          <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
             <Database size={14} className="text-gray-400" />
             <span>Data Sources</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-4">Navigate rows in connected vMix Data Sources (e.g. Google Sheets, Excel, XML).</p>
          
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Data Source Name (e.g. Excel)" 
              value={dataSourceName}
              onChange={(e) => setDataSourceName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500"
            />
            <input 
              type="text" 
              placeholder="Table Name (e.g. Sheet1)" 
              value={dataSourceTable}
              onChange={(e) => setDataSourceTable(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan-500"
            />
            
            <div className="flex space-x-2 pt-2">
               <button 
                 onClick={handleDataSourcePrev}
                 className="flex-1 bg-[#222] hover:bg-[#333] text-gray-300 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center transition-colors"
               >
                 <SkipBack size={12} className="mr-1" /> Previous Row
               </button>
               <button 
                 onClick={handleDataSourceNext}
                 className="flex-1 bg-[#222] hover:bg-green-900/50 text-green-500 border border-[#333] py-2 rounded text-xs font-bold uppercase flex items-center justify-center transition-colors"
               >
                 Next Row <SkipForward size={12} className="ml-1" />
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

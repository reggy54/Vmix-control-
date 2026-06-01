import React, { useState } from 'react';
import { VMixState } from '../types';
import { Play } from 'lucide-react';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function ListEditor({ vMixState, sendCommand }: Props) {
  const [selectedInput, setSelectedInput] = useState<number | null>(null);

  if (!vMixState) {
    return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  const listInputs = vMixState.inputs.filter(i => 
    i.type.toLowerCase().includes('list') || 
    (i.listItems && i.listItems.length > 0)
  );

  const activeList = selectedInput ? listInputs.find(x => x.number === selectedInput) : null;

  return (
    <div className="flex h-full w-full">
      {/* Sidebar - List Sources */}
      <div className="w-1/3 min-w-[150px] border-r border-[#333] flex flex-col p-2 space-y-2 overflow-y-auto">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">List Sources</h3>
        {listInputs.length === 0 && <div className="text-gray-500 text-xs">No lists found.</div>}
        {listInputs.map(input => (
           <button 
             key={input.key}
             onClick={() => setSelectedInput(input.number)}
             className={`text-left p-2 rounded border text-xs truncate transition-colors ${selectedInput === input.number ? 'bg-orange-900/30 border-orange-600/50 text-orange-200' : 'bg-[#111] border-[#222] text-gray-300 hover:bg-[#222]'}`}
           >
             <span className="opacity-50 text-[10px] mr-2">[{input.number}]</span>
             {input.shortTitle}
           </button>
        ))}
      </div>

      {/* Main Area - Items */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!activeList ? (
           <div className="flex items-center justify-center h-full text-gray-500 text-xs uppercase tracking-wider">
              Select a list to view items
           </div>
        ) : (
           <div className="flex flex-col space-y-4 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold italic truncate mb-2">{activeList.shortTitle}</h2>
              
              {(!activeList.listItems || activeList.listItems.length === 0) ? (
                 <div className="text-yellow-500 text-xs bg-yellow-900/20 border border-yellow-800/30 p-3 rounded">
                    This list is empty.
                 </div>
              ) : (
                 <div className="flex flex-col space-y-2">
                    {activeList.listItems.map((item, idx) => (
                       <button
                          key={idx}
                          onClick={() => sendCommand('SelectIndex', activeList.number, item.index)}
                          className={`flex items-center text-left p-2 rounded border transition-colors group ${
                             item.selected 
                                ? 'bg-green-900/30 border-green-600/50 text-green-100' 
                                : 'bg-[#1a1a1a] border-[#333] hover:bg-[#252525] text-gray-300'
                          }`}
                       >
                          <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 text-xs font-bold ${
                             item.selected ? 'bg-green-600 text-white' : 'bg-[#333] text-gray-500 group-hover:bg-[#444]'
                          }`}>
                            {item.index}
                          </div>
                          <span className="flex-1 truncate text-sm">
                             {item.value.split('\\').pop() || item.value}
                          </span>
                          {item.selected && (
                             <Play size={14} className="text-green-500 ml-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          )}
                       </button>
                    ))}
                 </div>
              )}

              <div className="pt-4 flex space-x-2 border-t border-[#333]">
                 <button 
                    onClick={() => sendCommand('ListShowNext', activeList.number)}
                    className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-2 text-[10px] font-bold uppercase transition-colors"
                 >
                    Next Item
                 </button>
                 <button 
                    onClick={() => sendCommand('ListShowPrevious', activeList.number)}
                    className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-2 text-[10px] font-bold uppercase transition-colors"
                 >
                    Prev Item
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

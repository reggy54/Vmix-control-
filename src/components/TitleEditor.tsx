import React, { useState } from 'react';
import { VMixState } from '../types';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

export function TitleEditor({ vMixState, sendCommand }: Props) {
  const [selectedInput, setSelectedInput] = useState<number | null>(null);

  if (!vMixState) {
    return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  const titleInputs = vMixState.inputs.filter(i => i.type.toLowerCase().includes('title') || i.type.toLowerCase().includes('gt') || i.textFields?.length > 0);

  const activeTitle = selectedInput ? titleInputs.find(x => x.number === selectedInput) : null;

  return (
    <div className="flex h-full w-full">
      {/* Sidebar - Title List */}
      <div className="w-1/3 min-w-[150px] border-r border-[#333] flex flex-col p-2 space-y-2 overflow-y-auto">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title Sources</h3>
        {titleInputs.length === 0 && <div className="text-gray-500 text-xs">No titles found.</div>}
        {titleInputs.map(input => (
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

      {/* Main Area - Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!activeTitle ? (
           <div className="flex items-center justify-center h-full text-gray-500 text-xs uppercase tracking-wider">
              Select a title to edit
           </div>
        ) : (
           <div className="flex flex-col space-y-4 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold italic truncate mb-2">{activeTitle.shortTitle}</h2>
              
              {(!activeTitle.textFields || activeTitle.textFields.length === 0) ? (
                 <div className="text-yellow-500 text-xs bg-yellow-900/20 border border-yellow-800/30 p-3 rounded">
                    This source has no editable text fields.
                 </div>
              ) : (
                 activeTitle.textFields.map(field => (
                    <div key={field.name} className="flex flex-col">
                       <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                          {field.name}
                       </label>
                       <input 
                          type="text"
                          defaultValue={field.value}
                          onBlur={(e) => {
                             if (e.target.value !== field.value) {
                                sendCommand(`SetText&SelectedName=${encodeURIComponent(field.name)}`, activeTitle.number, e.target.value);
                             }
                          }}
                          className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors w-full tracking-wide"
                       />
                       <span className="text-[9px] text-gray-600 mt-1">Saves on blur (clicking away)</span>
                    </div>
                 ))
              )}

              <div className="pt-4 flex space-x-2 border-t border-[#333]">
                 <button 
                    onClick={() => sendCommand('OverlayInput1In', activeTitle.number)}
                    className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-2 text-[10px] font-bold uppercase transition-colors"
                 >
                    Show on Overlay 1
                 </button>
                 <button 
                    onClick={() => sendCommand('OverlayInput1Out', activeTitle.number)}
                    className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded py-2 text-[10px] font-bold uppercase transition-colors"
                 >
                    Hide Overlay 1
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

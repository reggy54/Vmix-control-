import React, { useState, useEffect } from 'react';
import { VMixState } from '../types';
import { Play, Save, Trash2, Edit3, X } from 'lucide-react';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
}

interface TitlePreset {
  id: string;
  name: string;
  fields: { name: string; value: string }[];
}

export function TitleEditor({ vMixState, sendCommand }: Props) {
  const [selectedInput, setSelectedInput] = useState<number | null>(null);
  
  const [presets, setPresets] = useState<Record<string, TitlePreset[]>>(() => {
    const saved = localStorage.getItem('vmix-title-presets');
    return saved ? JSON.parse(saved) : {};
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draftPreset, setDraftPreset] = useState<{name: string, value: string}[]>([]);

  useEffect(() => {
    localStorage.setItem('vmix-title-presets', JSON.stringify(presets));
  }, [presets]);

  if (!vMixState) {
    return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  const titleInputs = vMixState.inputs.filter(i => i.type.toLowerCase().includes('title') || i.type.toLowerCase().includes('gt') || (i.textFields && i.textFields.length > 0));
  const activeTitle = selectedInput ? titleInputs.find(x => x.number === selectedInput) : null;
  const currentPresets = activeTitle ? (presets[activeTitle.key] || []) : [];

  const handleSaveCurrentToPresets = () => {
    if (!activeTitle) return;
    const firstFieldValue = activeTitle.textFields[0]?.value || 'Preset ' + (currentPresets.length + 1);
    const newPreset: TitlePreset = {
      id: crypto.randomUUID(),
      name: firstFieldValue,
      fields: activeTitle.textFields.map(f => ({ name: f.name, value: f.value }))
    };
    setPresets(prev => ({
      ...prev,
      [activeTitle.key]: [...(prev[activeTitle.key] || []), newPreset]
    }));
  };

  const handleSaveDraft = () => {
    if (!activeTitle) return;
    const firstFieldValue = draftPreset[0]?.value || 'Preset ' + (currentPresets.length + 1);
    const newPreset: TitlePreset = {
      id: crypto.randomUUID(),
      name: firstFieldValue,
      fields: draftPreset
    };
    setPresets(prev => ({
      ...prev,
      [activeTitle.key]: [...(prev[activeTitle.key] || []), newPreset]
    }));
    setIsAddingNew(false);
  };

  const handleApplyPreset = (preset: TitlePreset, showImmediately: boolean) => {
    if (!activeTitle) return;
    // Send all fields to vMix
    preset.fields.forEach((field, index) => {
       // Only update if value changed? For simplicity, we can just send it.
       // Note: the vMix API for SetText updates it immediately.
       // We can use a timeout if needed, but sequential requests are usually fine.
       setTimeout(() => {
          sendCommand(`SetText&SelectedName=${encodeURIComponent(field.name)}`, activeTitle.number, field.value);
       }, index * 20); // slight stagger to not overwhelm
    });

    if (showImmediately) {
       setTimeout(() => {
         sendCommand('OverlayInput1In', activeTitle.number);
       }, preset.fields.length * 20 + 50);
    }
  };

  const handleDeletePreset = (id: string) => {
    if (!activeTitle) return;
    setPresets(prev => ({
      ...prev,
      [activeTitle.key]: (prev[activeTitle.key] || []).filter(p => p.id !== id)
    }));
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar - Title List */}
      <div className="w-1/4 min-w-[200px] border-r border-[#333] flex flex-col p-2 space-y-2 overflow-y-auto">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Title Sources</h3>
        {titleInputs.length === 0 && <div className="text-gray-500 text-xs">No titles found.</div>}
        {titleInputs.map(input => (
           <button 
             key={input.key}
             onClick={() => {
                setSelectedInput(input.number);
                setIsAddingNew(false);
             }}
             className={`text-left p-2 rounded border text-xs truncate transition-colors ${selectedInput === input.number ? 'bg-orange-900/30 border-orange-600/50 text-orange-200' : 'bg-[#111] border-[#222] text-gray-300 hover:bg-[#222]'}`}
           >
             <span className="opacity-50 text-[10px] mr-2">[{input.number}]</span>
             {input.shortTitle}
           </button>
        ))}
      </div>

      {/* Main Area - Editor */}
      <div className="flex-1 p-4 overflow-y-auto flex gap-6">
        {!activeTitle ? (
           <div className="flex w-full items-center justify-center h-full text-gray-500 text-xs uppercase tracking-wider flex-col gap-2 relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                 <Edit3 size={200} />
             </div>
             Select a title to edit or manage its playlist
           </div>
        ) : (
           <>
              <div className="flex-1 flex flex-col space-y-4 max-w-lg">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight truncate">{activeTitle.shortTitle}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-800/30">Live Edit</span>
                    </div>
                 </div>
                 
                 {(!activeTitle.textFields || activeTitle.textFields.length === 0) ? (
                    <div className="text-yellow-500 text-xs bg-yellow-900/20 border border-yellow-800/30 p-3 rounded">
                       This source has no editable text fields.
                    </div>
                 ) : (
                    <div className="space-y-3 bg-[#161616] border border-[#333] p-4 rounded-lg">
                       {activeTitle.textFields.map(field => (
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
                                className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors w-full tracking-wide text-sm font-medium"
                             />
                          </div>
                       ))}
                       <div className="flex justify-end pt-2">
                           <button onClick={handleSaveCurrentToPresets} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-white transition-colors">
                              <Save size={12} /> Save Live to Roster
                           </button>
                       </div>
                    </div>
                 )}

                 <div className="pt-4 flex space-x-2 border-t border-[#333]">
                    <button 
                       onClick={() => sendCommand('OverlayInput1In', activeTitle.number)}
                       className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-3 text-[10px] font-bold uppercase transition-colors"
                    >
                       Show on Overlay 1
                    </button>
                    <button 
                       onClick={() => sendCommand('OverlayInput1Out', activeTitle.number)}
                       className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded py-3 text-[10px] font-bold uppercase transition-colors"
                    >
                       Hide Overlay 1
                    </button>
                 </div>
              </div>

              {/* Roster / Playlist Pane */}
              {activeTitle.textFields && activeTitle.textFields.length > 0 && (
                  <div className="w-80 flex flex-col border-l border-[#333] pl-6">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Play size={14} /> Title Roster
                       </h3>
                       <button 
                          onClick={() => {
                             setDraftPreset(activeTitle.textFields.map(f => ({ name: f.name, value: '' })));
                             setIsAddingNew(true);
                          }}
                          className="bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white border border-orange-600/50 rounded p-1 transition-colors"
                          title="Add New Preset"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                       </button>
                    </div>

                    {isAddingNew && (
                       <div className="bg-[#1e1e1e] border border-[#444] p-3 rounded mb-4 shadow-lg border-l-2 border-l-orange-500">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">New Roster Item</span>
                             <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                          </div>
                          <div className="space-y-2 mb-3">
                            {draftPreset.map((field, idx) => (
                               <div key={idx}>
                                  <input 
                                     type="text"
                                     placeholder={field.name}
                                     value={field.value}
                                     onChange={e => {
                                        const newDraft = [...draftPreset];
                                        newDraft[idx].value = e.target.value;
                                        setDraftPreset(newDraft);
                                     }}
                                     className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
                                  />
                               </div>
                            ))}
                          </div>
                          <button 
                             onClick={handleSaveDraft}
                             className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded transition-colors"
                          >
                             Save to Roster
                          </button>
                       </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                       {currentPresets.length === 0 && !isAddingNew && (
                          <div className="text-gray-600 text-xs italic text-center mt-10">
                             Roster is empty. Save current edits or create a new one.
                          </div>
                       )}
                       {currentPresets.map((preset, idx) => (
                          <div key={preset.id} className="bg-[#161616] border border-[#333] rounded overflow-hidden group">
                             <div className="p-2 border-b border-[#222]">
                                <div className="flex justify-between items-start mb-1">
                                   <span className="font-bold text-sm text-gray-200 truncate pr-2">{preset.name || `Preset ${idx+1}`}</span>
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleDeletePreset(preset.id)} className="text-gray-500 hover:text-red-400 p-0.5"><Trash2 size={12}/></button>
                                   </div>
                                </div>
                                <div className="space-y-0.5">
                                   {preset.fields.slice(0, 2).map((f, i) => (
                                      <div key={i} className="text-[10px] text-gray-500 truncate flex gap-1">
                                         <span className="opacity-50">{f.name}:</span>
                                         <span className="text-gray-400">{f.value || '-'}</span>
                                      </div>
                                   ))}
                                   {preset.fields.length > 2 && <div className="text-[9px] text-gray-600 mt-0.5">+{preset.fields.length - 2} more fields</div>}
                                </div>
                             </div>
                             <div className="flex">
                                <button 
                                   onClick={() => handleApplyPreset(preset, false)}
                                   className="flex-1 bg-[#222] hover:bg-[#333] py-1.5 text-[9px] font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors border-r border-[#333]"
                                >
                                   Load Data
                                </button>
                                <button 
                                   onClick={() => handleApplyPreset(preset, true)}
                                   className="flex-1 bg-red-900/20 hover:bg-red-900/40 py-1.5 text-[9px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                >
                                   <Play size={10} /> Send Live
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
              )}
           </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Play, Plus, Trash2, Save, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { VMixState } from '../types';

interface MacroStep {
  command: string;
  input: string;
  value: string;
  delay: number;
}

interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
}

interface Props {
  macros: Macro[];
  setMacros: (m: Macro[]) => void;
  playMacro: (id: string) => void;
  vMixState: VMixState;
}

const AVAILABLE_COMMANDS = [
  'Cut', 'Fade', 'Merge', 'Wipe', 
  'StartStopRecording', 'StartStopStreaming', 
  'OverlayInput1', 'OverlayInput2', 'OverlayInput3', 'OverlayInput4',
  'SetPreview', 'ActiveInput', 'Play', 'Pause', 'Restart', 'Audio',
  'ColourKey', 'ColourKeyOn', 'ColourKeyOff'
];

export function MacroBuilder({ macros, setMacros, playMacro, vMixState }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const createNewMacro = () => {
     const newId = Date.now().toString();
     setMacros([...macros, { id: newId, name: 'New Macro', steps: [] }]);
     setEditingId(newId);
  };

  const duplicateMacro = (macro: Macro) => {
     const newId = Date.now().toString();
     setMacros([...macros, { ...macro, id: newId, name: `${macro.name} (Copy)`, steps: [...macro.steps] }]);
     setEditingId(newId);
  };

  const activeMacro = macros.find(m => m.id === editingId);

  const updateActiveMacro = (updated: Macro) => {
     setMacros(macros.map(m => m.id === updated.id ? updated : m));
  };

  const addStep = () => {
    if (!activeMacro) return;
    updateActiveMacro({
      ...activeMacro,
      steps: [...activeMacro.steps, { command: 'Cut', input: '', value: '', delay: 1000 }]
    });
  };

  const updateStep = (index: number, changes: Partial<MacroStep>) => {
    if (!activeMacro) return;
    const newSteps = [...activeMacro.steps];
    newSteps[index] = { ...newSteps[index], ...changes };
    updateActiveMacro({ ...activeMacro, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (!activeMacro) return;
    updateActiveMacro({
      ...activeMacro,
      steps: activeMacro.steps.filter((_, i) => i !== index)
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!activeMacro) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeMacro.steps.length - 1) return;
    
    const newSteps = [...activeMacro.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    updateActiveMacro({ ...activeMacro, steps: newSteps });
  };

  return (
    <div className="flex w-full h-full">
      {/* Sidebar - Macros List */}
      <div className="w-1/3 min-w-[150px] border-r border-[#333] flex flex-col p-2 space-y-2 overflow-y-auto">
        <div className="flex justify-between items-center mb-1">
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Macros</h3>
           <button onClick={createNewMacro} className="text-orange-500 hover:text-orange-400 p-1 bg-orange-500/10 rounded transition-colors">
              <Plus size={12} />
           </button>
        </div>
        {macros.length === 0 && <div className="text-gray-500 text-xs py-2">No macros.</div>}
        {macros.map(macro => (
           <div 
             key={macro.id}
             className={`flex justify-between items-center p-2 rounded border text-xs transition-colors group ${editingId === macro.id ? 'bg-[#222] border-[#444]' : 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]'}`}
           >
             <button 
                className="truncate flex-1 text-left mr-2"
                onClick={() => setEditingId(macro.id)}
             >
               {macro.name}
             </button>
             <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => playMacro(macro.id)}
                  className="p-1.5 bg-green-900/40 text-green-500 hover:bg-green-900 border border-green-900/60 rounded"
                  title="Play Macro"
                >
                  <Play size={10} fill="currentColor" />
                </button>
                <button 
                  onClick={() => duplicateMacro(macro)}
                  className="p-1.5 bg-blue-900/40 text-blue-500 hover:bg-blue-900 border border-blue-900/60 rounded"
                  title="Duplicate Macro"
                >
                  <Copy size={10} />
                </button>
                <button 
                  onClick={() => setMacros(macros.filter(x => x.id !== macro.id))}
                  className="p-1.5 bg-red-900/40 text-red-500 hover:bg-red-900 border border-red-900/60 rounded"
                  title="Delete Macro"
                >
                  <Trash2 size={10} />
                </button>
             </div>
           </div>
        ))}
      </div>

      {/* Main Area - Editor */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#0a0a0a]">
         {!activeMacro ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-[10px] uppercase font-bold tracking-wider">
               Select or create a macro to edit
            </div>
         ) : (
            <div className="max-w-2xl mx-auto flex flex-col space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Macro Name</label>
                  <input 
                     type="text" 
                     value={activeMacro.name}
                     onChange={(e) => updateActiveMacro({...activeMacro, name: e.target.value})}
                     className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white outline-none focus:border-orange-500 w-full font-bold text-lg"
                  />
               </div>

               <div className="flex flex-col space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                     <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Command Sequence</h4>
                     <button 
                        onClick={addStep}
                        className="flex items-center space-x-1 text-[10px] bg-[#222] hover:bg-[#333] border border-[#333] px-2 py-1 rounded transition-colors text-white"
                     >
                        <Plus size={10} /> <span>Add Step</span>
                     </button>
                  </div>

                  {activeMacro.steps.length === 0 && (
                     <div className="border border-dashed border-[#333] p-6 text-center text-gray-500 text-xs rounded">
                        No commands in this macro. Click "Add Step" to build your sequence.
                     </div>
                  )}

                  {activeMacro.steps.map((step, index) => (
                     <div key={index} className="flex flex-col sm:flex-row gap-2 bg-[#161616] border border-[#333] p-2 rounded items-center">
                        <div className="w-6 h-6 shrink-0 bg-[#222] text-gray-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                           {index + 1}
                        </div>
                        
                        <select 
                           value={step.command}
                           onChange={(e) => updateStep(index, { command: e.target.value })}
                           className="bg-[#111] border border-[#333] px-2 py-1.5 rounded text-xs text-gray-300 outline-none w-full sm:w-32"
                        >
                           <option value="">-- Command --</option>
                           {AVAILABLE_COMMANDS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        {(['Cut', 'Fade', 'Merge', 'Wipe', 'ActiveInput', 'SetPreview', 'Audio', 'OverlayInput1', 'OverlayInput2', 'OverlayInput3', 'OverlayInput4', 'ColourKey', 'ColourKeyOn', 'ColourKeyOff'].includes(step.command)) ? (
                           <select
                              value={step.input}
                              onChange={(e) => updateStep(index, { input: e.target.value })}
                              className="bg-[#111] border border-[#333] px-2 py-1.5 rounded text-xs text-gray-300 outline-none w-full sm:w-32"
                           >
                              <option value="">-- Input --</option>
                              {vMixState?.inputs.map(i => (
                                 <option key={i.key} value={i.number}>
                                    [{i.number}] {i.shortTitle}
                                 </option>
                              ))}
                           </select>
                        ) : (
                           <input 
                              type="text"
                              placeholder="Input (opt)"
                              value={step.input}
                              onChange={(e) => updateStep(index, { input: e.target.value })}
                              className="bg-[#111] border border-[#333] px-2 py-1.5 rounded text-xs text-gray-300 outline-none w-full sm:w-24 placeholder-gray-600"
                           />
                        )}
                        
                        <input 
                           type="text"
                           placeholder="Value (opt)"
                           value={step.value}
                           onChange={(e) => updateStep(index, { value: e.target.value })}
                           className="bg-[#111] border border-[#333] px-2 py-1.5 rounded text-xs text-gray-300 outline-none w-full sm:w-28 placeholder-gray-600 flex-1"
                        />

                        <div className="flex items-center space-x-1 sm:ml-auto bg-[#1a1a1a] rounded px-2 py-1 border border-[#333] shrink-0">
                           <span className="text-[9px] text-gray-500 uppercase tracking-widest shrink-0">Delay</span>
                           <input 
                              type="number"
                              value={step.delay}
                              onChange={(e) => updateStep(index, { delay: parseInt(e.target.value) || 0 })}
                              className="bg-transparent w-12 text-right text-orange-400 font-mono text-xs outline-none"
                           />
                           <span className="text-[9px] text-gray-500">ms</span>
                        </div>

                        <div className="flex flex-col items-center justify-center shrink-0 border-l border-[#333] pl-2 ml-1">
                           <button 
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                              className={`p-0.5 transition-colors ${index === 0 ? 'text-[#333]' : 'text-gray-500 hover:text-white'}`}
                           >
                              <ChevronUp size={14} />
                           </button>
                           <button 
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === activeMacro.steps.length - 1}
                              className={`p-0.5 transition-colors ${index === activeMacro.steps.length - 1 ? 'text-[#333]' : 'text-gray-500 hover:text-white'}`}
                           >
                              <ChevronDown size={14} />
                           </button>
                        </div>

                        <button 
                           onClick={() => removeStep(index)}
                           className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0 border-l border-[#333] pl-2 ml-1"
                        >
                           <Trash2 size={12} />
                        </button>
                     </div>
                  ))}
               </div>
               
               <div className="pt-4 border-t border-[#333] flex justify-end">
                  <button 
                    onClick={() => playMacro(activeMacro.id)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded text-xs uppercase transition-colors"
                  >
                     <Play size={12} fill="currentColor" />
                     <span>Test Macro</span>
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

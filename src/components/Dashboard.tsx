import React, { useState, useEffect } from 'react';
import { VMixState } from '../types';
import { InputCard } from './InputCard';
import { Settings, X, Plus } from 'lucide-react';
import { safeStorage } from '../utils';

interface Props {
  vMixState: VMixState | null;
  sendCommand: (func: string, input?: string | number, value?: string | number) => void;
  macros: {id: string, name: string, steps: {command: string, value: string, input: string, delay: number}[]}[];
  playMacro: (id: string) => void;
  vmixUrl: string;
  onColourKeyConfig?: (input: any) => void;
}

interface DashboardConfig {
  pinnedInputs: string[];
  pinnedMacros: string[];
  pinnedTitle: string | null;
}

export function Dashboard({ vMixState, sendCommand, macros, playMacro, vmixUrl, onColourKeyConfig }: Props) {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    const saved = safeStorage.getItem('vmix-dashboard-config');
    return saved ? JSON.parse(saved) : { pinnedInputs: [], pinnedMacros: [], pinnedTitle: null };
  });

  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    safeStorage.setItem('vmix-dashboard-config', JSON.stringify(config));
  }, [config]);

  if (!vMixState) {
    return <div className="p-4 text-gray-500 text-xs text-center">No connection.</div>;
  }

  // --- RENDERING VIEWS ---

  const titleInputConfigured = config.pinnedTitle ? vMixState.inputs.find(i => i.key === config.pinnedTitle) : null;
  const pinnedVMixInputs = config.pinnedInputs.map(key => vMixState.inputs.find(i => i.key === key)).filter(Boolean) as any[];
  const pinnedMacroList = config.pinnedMacros.map(id => macros.find(m => m.id === id)).filter(Boolean) as any[];

  if (isConfiguring) {
    return (
      <div className="flex h-full w-full bg-[#1e1e1e] p-4 flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-orange-400">Configure Dashboard</h2>
          <button 
            onClick={() => setIsConfiguring(false)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pinned Inputs */}
          <div className="bg-[#161616] border border-[#333] rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-[#333] pb-2">Pinned Inputs</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {vMixState.inputs.map(input => {
                const isPinned = config.pinnedInputs.includes(input.key);
                return (
                  <div key={input.key} className="flex justify-between items-center bg-[#222] p-2 rounded border border-[#333]">
                     <span className="text-xs truncate mr-2" title={input.title}>[{input.number}] {input.shortTitle}</span>
                     <button
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            pinnedInputs: isPinned 
                              ? prev.pinnedInputs.filter(k => k !== input.key)
                              : [...prev.pinnedInputs, input.key]
                          }));
                        }}
                        className={`p-1 rounded transition-colors ${isPinned ? 'text-red-400 hover:bg-red-900/30' : 'text-green-400 hover:bg-green-900/30'}`}
                     >
                       {isPinned ? <X size={14} /> : <Plus size={14} />}
                     </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinned Macros */}
          <div className="bg-[#161616] border border-[#333] rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-[#333] pb-2">Pinned Macros</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {macros.length === 0 ? <div className="text-xs text-gray-500 italic">No macros defined.</div> : macros.map(macro => {
                const isPinned = config.pinnedMacros.includes(macro.id);
                return (
                  <div key={macro.id} className="flex justify-between items-center bg-[#222] p-2 rounded border border-[#333]">
                     <span className="text-xs truncate mr-2">{macro.name}</span>
                     <button
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            pinnedMacros: isPinned 
                              ? prev.pinnedMacros.filter(k => k !== macro.id)
                              : [...prev.pinnedMacros, macro.id]
                          }));
                        }}
                        className={`p-1 rounded transition-colors ${isPinned ? 'text-red-400 hover:bg-red-900/30' : 'text-green-400 hover:bg-green-900/30'}`}
                     >
                       {isPinned ? <X size={14} /> : <Plus size={14} />}
                     </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinned Title */}
          <div className="bg-[#161616] border border-[#333] rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-[#333] pb-2">Main Title</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              <div 
                className={`flex justify-between items-center p-2 rounded border cursor-pointer ${config.pinnedTitle === null ? 'bg-orange-900/30 border-orange-500/50 text-orange-200' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                onClick={() => setConfig(prev => ({ ...prev, pinnedTitle: null }))}
              >
                <span className="text-xs">None</span>
              </div>
              {vMixState.inputs.filter(i => i.type.toLowerCase().includes('title') || i.type.toLowerCase().includes('gt') || (i.textFields && i.textFields.length > 0)).map(input => {
                const isPinned = config.pinnedTitle === input.key;
                return (
                  <div 
                    key={input.key} 
                    className={`flex justify-between items-center p-2 rounded border cursor-pointer ${isPinned ? 'bg-orange-900/30 border-orange-500/50 text-orange-200' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                    onClick={() => setConfig(prev => ({ ...prev, pinnedTitle: input.key }))}
                  >
                     <span className="text-xs truncate mr-2" title={input.title}>[{input.number}] {input.shortTitle}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto relative p-4 gap-4">
      {/* Config Button (floating top right or subtle) */}
      <button 
        onClick={() => setIsConfiguring(true)}
        className="absolute top-4 right-4 z-10 p-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
        title="Configure Dashboard"
      >
        <Settings size={14} />
      </button>

      {config.pinnedInputs.length === 0 && config.pinnedMacros.length === 0 && !config.pinnedTitle && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 mt-10">
          <Settings size={48} className="mb-4 opacity-20" />
          <h2 className="text-lg font-bold tracking-wide uppercase text-gray-400 mb-2">Blank Dashboard</h2>
          <p className="text-xs max-w-sm text-center">Pin your favorite cameras, macros, and titles here to control your broadcast without switching tabs.</p>
          <button 
            onClick={() => setIsConfiguring(true)}
            className="mt-6 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Configure Now
          </button>
        </div>
      )}

      {/* Grid Layout based on what is selected. E.g. Top section inputs + macros, bottom section title */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left/Top Column: Inputs & Macros */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[#161616] border border-[#333] rounded p-4 flex flex-col sm:flex-row items-center gap-4">
             <div className="flex bg-[#222] border border-[#333] rounded overflow-hidden shadow-lg w-full sm:w-auto">
               <button onClick={() => sendCommand('Cut')} className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-colors border-r border-[#333]">Cut</button>
               <button onClick={() => sendCommand('Fade')} className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-colors border-r border-[#333]">Fade</button>
               <button onClick={() => sendCommand('Merge')} className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-colors border-r border-[#333]">Merge</button>
               <button onClick={() => sendCommand('Wipe')} className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-colors border-r border-[#333]">Wipe</button>
             </div>
             
             <div className="flex-1 w-full bg-[#222] border border-[#333] rounded px-3 py-2 flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">T-Bar</span>
                <input 
                   type="range" 
                   min="0" 
                   max="255" 
                   defaultValue="0"
                   onChange={(e) => sendCommand('SetFader', undefined, e.target.value)}
                   className="w-full accent-orange-500 cursor-pointer h-2 bg-[#111] rounded-lg appearance-none"
                />
             </div>
          </div>

          {pinnedVMixInputs.length > 0 && (
            <div className="bg-[#161616] border border-[#333] rounded p-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pinned Cameras / Inputs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {pinnedVMixInputs.map(input => (
                   <InputCard 
                     key={input.key}
                     input={input}
                     vmixUrl={vmixUrl}
                     isActive={input.number === vMixState.activeInputNumber}
                     isPreview={input.number === vMixState.previewInputNumber}
                     onClick={() => sendCommand('PreviewInput', input.number)}
                     onDirectCut={() => sendCommand('ActiveInput', input.number)}
                     onCommand={(func, val) => sendCommand(func, input.number, val)}
                     onColourKeyConfig={() => { if (onColourKeyConfig) onColourKeyConfig(input) }}
                   />
                ))}
              </div>
            </div>
          )}

          {pinnedMacroList.length > 0 && (
            <div className="bg-[#161616] border border-[#333] rounded p-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Macros</h3>
              <div className="flex flex-wrap gap-2">
                {pinnedMacroList.map(macro => (
                  <button
                    key={macro.id}
                    onClick={() => playMacro(macro.id)}
                    className="flex-1 min-w-[120px] bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] hover:from-[#4a4a4a] hover:to-[#3a3a3a] border border-[#444] rounded p-3 text-center transition-all active:scale-95 shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="font-bold text-sm tracking-wide text-white drop-shadow-md truncate relative z-10">{macro.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right/Bottom Column: Title Editor */}
        {titleInputConfigured && (
          <div className="lg:w-1/3 bg-[#161616] border border-[#333] rounded p-4 flex flex-col max-h-[600px] overflow-y-auto">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Title: {titleInputConfigured.shortTitle}</h3>
            
            {(!titleInputConfigured.textFields || titleInputConfigured.textFields.length === 0) ? (
                <div className="text-yellow-500 text-xs bg-yellow-900/20 border border-yellow-800/30 p-3 rounded mt-2">
                  This source has no editable text fields.
                </div>
            ) : (
                <div className="space-y-4">
                  {titleInputConfigured.textFields.map(field => (
                    <div key={field.name} className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                          {field.name}
                        </label>
                        <input 
                          type="text"
                          defaultValue={field.value}
                          onBlur={(e) => {
                              if (e.target.value !== field.value) {
                                sendCommand(`SetText&SelectedName=${encodeURIComponent(field.name)}`, titleInputConfigured.number, e.target.value);
                              }
                          }}
                          className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors w-full tracking-wide text-sm"
                        />
                    </div>
                  ))}
                  <div className="pt-2 flex flex-col gap-2 mt-4">
                    <button 
                        onClick={() => sendCommand('OverlayInput1In', titleInputConfigured.number)}
                        className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] rounded py-2 text-[10px] font-bold uppercase transition-colors"
                    >
                        Show Overlay 1
                    </button>
                    <button 
                        onClick={() => sendCommand('OverlayInput1Out', titleInputConfigured.number)}
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded py-2 text-[10px] font-bold uppercase transition-colors"
                    >
                        Hide Overlay 1
                    </button>
                  </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

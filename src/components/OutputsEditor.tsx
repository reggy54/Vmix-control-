import React, { useState } from 'react';
import { VMixState } from '../types';
import { MonitorUp, Monitor } from 'lucide-react';

interface Props {
  vMixState: VMixState;
  sendCommand: (func: string, input?: string | number) => void;
}

export function OutputsEditor({ vMixState, sendCommand }: Props) {
  const [outExternal2, setOutExternal2] = useState('');
  const [outFullscreen1, setOutFullscreen1] = useState('');
  const [outFullscreen2, setOutFullscreen2] = useState('');

  const handleRoute = (func: string, input: string) => {
    if (!input) return;
    sendCommand(func, input);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#161616] border border-[#222] rounded p-4">
      <div className="flex items-center space-x-2 text-blue-500 mb-4 shrink-0">
        <MonitorUp size={18} />
        <h2 className="font-bold uppercase tracking-wider text-sm">Output Routing / Displays</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        
        {/* Fullscreen 1 */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
              <Monitor size={14} className="text-gray-400" />
              <span>Fullscreen 1</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-4">Route a specific input or default output to Monitor 1.</p>
          </div>
          <select
            value={outFullscreen1}
            onChange={(e) => {
               setOutFullscreen1(e.target.value);
               handleRoute('SetFullscreen1', e.target.value);
            }}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
          >
            <option value="" disabled>Select Source...</option>
            <option value="Output">Output (Program)</option>
            <option value="Preview">Preview</option>
            <option value="MultiView">MultiView</option>
            {vMixState.inputs.map(i => (
               <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
            ))}
          </select>
        </div>

        {/* Fullscreen 2 */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-gray-300 font-bold uppercase text-xs mb-2">
              <Monitor size={14} className="text-gray-400" />
              <span>Fullscreen 2</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-4">Route a specific input or default output to Monitor 2.</p>
          </div>
          <select
            value={outFullscreen2}
            onChange={(e) => {
               setOutFullscreen2(e.target.value);
               handleRoute('SetFullscreen2', e.target.value);
            }}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
          >
            <option value="" disabled>Select Source...</option>
            <option value="Output">Output (Program)</option>
            <option value="Preview">Preview</option>
            <option value="MultiView">MultiView</option>
            {vMixState.inputs.map(i => (
               <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
            ))}
          </select>
        </div>

        {/* External 2 */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase text-xs mb-2">
              <MonitorUp size={14} className="text-blue-500" />
              <span>External 2 / Output 2</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-4">Route specific inputs to NDI / External 2.</p>
          </div>
          <select
            value={outExternal2}
            onChange={(e) => {
               setOutExternal2(e.target.value);
               handleRoute('SetOutputExternal2', e.target.value);
            }}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
          >
            <option value="" disabled>Select Source...</option>
            <option value="Output">Output (Program)</option>
            <option value="Preview">Preview</option>
            <option value="MultiView">MultiView</option>
            {vMixState.inputs.map(i => (
               <option key={i.key} value={i.number}>[{i.number}] {i.shortTitle}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}

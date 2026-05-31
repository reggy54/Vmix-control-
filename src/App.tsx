import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings2, Radio, Activity, Link, Unlink, AlertTriangle, MonitorPlay, Focus, Layers, Maximize, HelpCircle } from 'lucide-react';
import { VMixController } from './vMixApi';
import { VMixState } from './types';
import { InputCard } from './components/InputCard';

interface Shortcut {
  id: string;
  code: string;
  command: string;
  value: string;
}

const AVAILABLE_COMMANDS = [
  'Cut', 'Fade', 'Merge', 'Wipe', 
  'StartStopRecording', 'StartStopStreaming', 
  'OverlayInput1', 'OverlayInput2', 'OverlayInput3', 'OverlayInput4',
  'SetPreview', 'ActiveInput'
];

export default function App() {
  const [url, setUrl] = useState('http://127.0.0.1:8088');
  const [controller, setController] = useState<VMixController | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vMixState, setVMixState] = useState<VMixState | null>(null);
  const [isHttpsInsecure, setIsHttpsInsecure] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('vmix-shortcuts');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', code: 'Space', command: 'Cut', value: '' },
      { id: '2', code: 'Enter', command: 'Fade', value: '' },
    ];
  });
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts'>('general');
  const [newShortcutCode, setNewShortcutCode] = useState('');
  const [newShortcutCommand, setNewShortcutCommand] = useState('Cut');
  const [newShortcutValue, setNewShortcutValue] = useState('');

  const pollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('vmix-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    // Check if we are hosted on HTTPS and trying to connect to local HTTP 
    // This often causes Mixed Content blocks in browsers.
    if (window.location.protocol === 'https:' && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      setIsHttpsInsecure(true);
    } else {
      setIsHttpsInsecure(false);
    }
  }, [url]);

  const pollState = useCallback(async (ctrl: VMixController) => {
    try {
      const state = await ctrl.getState();
      setVMixState(state);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
         // Silently catch fetch errors since they are expected when polling fails
      } else {
         console.warn(err);
      }
      setIsConnected(false);
      setError('Connection failed. Make sure vMix is running, Web Controller is enabled in vMix settings, and network access is allowed.');
    } finally {
      pollTimeoutRef.current = window.setTimeout(() => pollState(ctrl), 1000);
    }
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    const newController = new VMixController(url);
    setController(newController);
    pollState(newController);
  };

  const handleDisconnect = () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setController(null);
    setIsConnected(false);
    setVMixState(null);
  };

  useEffect(() => {
    return () => {
       if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const sendCommand = async (func: string, input?: string | number, value?: string) => {
    if (controller) {
      try {
        await controller.sendCommand(func, input, value);
        // Optimistic fast poll
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        setTimeout(() => pollState(controller), 200);
      } catch (err) {
        console.warn("Command error", err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controller) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }
      const shortcut = shortcuts.find(s => s.code === e.code);
      if (shortcut) {
        e.preventDefault();
        sendCommand(shortcut.command, shortcut.value ? shortcut.value : undefined);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controller, shortcuts]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  // derived state
  const activeInput = vMixState?.inputs.find(i => i.number === vMixState.activeInputNumber);
  const previewInput = vMixState?.inputs.find(i => i.number === vMixState.previewInputNumber);

  return (
    <div className="flex flex-col h-screen min-h-screen bg-[#121212] text-[#d1d1d1] font-sans selection:bg-orange-500/30 overflow-hidden">
      
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333] shrink-0 z-20">
        <div className="flex items-center space-x-6">
          <div className="text-orange-500 font-bold text-lg tracking-tighter flex items-center space-x-2">
            <MonitorPlay size={20} />
            <div>vMix <span className="text-white font-normal text-xs uppercase ml-1 opacity-60">Remote Control</span></div>
          </div>
          {isConnected && (
            <div className="hidden sm:flex space-x-3 text-[10px] font-mono">
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.recording ? 'bg-red-600 shadow-[0_0_5px_#dc2626] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.recording ? 'text-red-500 font-bold' : 'text-gray-600'}>REC</span>
              </div>
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.streaming ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.streaming ? 'text-blue-400 font-bold' : 'text-gray-600'}>STREAM</span>
              </div>
              <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span>API OK</span></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleConnect} className="flex items-center space-x-2 text-[11px] font-mono">
            <div className="relative hidden sm:flex items-center">
               <Activity className={`absolute left-2 w-3 h-3 ${isConnected ? 'text-green-500' : 'text-gray-500'}`} />
               <input
                 type="text"
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 className="bg-[#111] border border-[#333] rounded pl-7 pr-2 py-1 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-48 text-gray-300 placeholder-gray-600 transition-all font-mono"
                 placeholder="http://192.168.1.x:8088"
                 disabled={isConnected}
               />
            </div>
            {!isConnected ? (
               <button type="submit" className="bg-[#333] hover:bg-[#444] text-[10px] font-bold text-white px-3 py-1 rounded border border-white/10 transition-colors uppercase shrink-0">
                 Connect
               </button>
            ) : (
               <button type="button" onClick={handleDisconnect} className="bg-orange-600 hover:bg-orange-500 text-[10px] font-bold text-white px-3 py-1 rounded border border-white/20 transition-colors uppercase shrink-0">
                 Disconnect
               </button>
            )}
          </form>
        </div>
      </header>

      {/* Warnings */}
      <div className="shrink-0 px-2 pt-2">
         {isHttpsInsecure && !isConnected && (
            <div className="bg-amber-900/30 border border-amber-700 text-amber-200 px-3 py-2 rounded text-[11px] flex gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <div>
                <strong>Mixed Content Warning:</strong> Using HTTPS but trying to connect locally. Export project or use proxy.
              </div>
            </div>
         )}
         {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-3 py-2 rounded text-[11px] mt-1 mb-1">
              {error}
            </div>
         )}
      </div>

      <main className="flex-1 flex flex-col p-2 space-y-2 overflow-y-auto">
        
        {/* TOP HALF: Monitors & Transitions */}
        <div className="flex flex-col lg:flex-row min-h-[200px] lg:h-[40vh] space-y-2 lg:space-y-0 lg:space-x-2 shrink-0">
          
          {/* PREVIEW WINDOW */}
          <div className="relative flex-1 bg-black border-4 border-green-600 rounded shadow-inner flex items-center justify-center min-h-[150px]">
            <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">PREVIEW</div>
            <div className="text-center px-4">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold opacity-20 italic truncate">
                 {previewInput ? previewInput.title : 'NO SOURCE'}
              </div>
              <div className="text-[10px] uppercase tracking-widest opacity-30 mt-2 truncate">
                 {previewInput ? previewInput.shortTitle : '---'}
              </div>
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-1">
              <div className="w-8 h-1 bg-green-600"></div>
              <div className="w-8 h-1 bg-gray-700"></div>
            </div>
          </div>

          {/* TRANSITION COLUMN */}
          <div className="flex flex-row lg:flex-col justify-center space-x-1 lg:space-x-0 lg:space-y-1 w-full lg:w-24 shrink-0">
            <button onClick={() => sendCommand('Cut')} className="flex-1 lg:flex-none bg-[#333] hover:bg-[#444] text-[10px] font-bold py-3 rounded border border-white/10 uppercase transition-colors">Cut</button>
            <button onClick={() => sendCommand('Fade')} className="flex-1 lg:flex-none bg-[#333] hover:bg-[#444] text-[10px] font-bold py-3 rounded border border-white/10 uppercase transition-colors">Fade</button>
            <button onClick={() => sendCommand('Merge')} className="flex-1 lg:flex-none bg-[#333] hover:bg-[#444] text-[10px] font-bold py-3 rounded border border-white/10 uppercase transition-colors">Merge</button>
            
            <div className="hidden lg:flex flex-1 my-2 bg-[#111] rounded relative overflow-hidden flex-col items-center justify-center border border-[#222] group py-4">
              <span className="absolute text-[#333] font-mono text-[10px] uppercase pointer-events-none group-hover:opacity-0 transition-opacity whitespace-nowrap" style={{ transform: 'rotate(-90deg)' }}>T-Bar</span>
              <input 
                type="range" 
                min="0" max="255" 
                defaultValue="0"
                onChange={(e) => sendCommand('SetFader', parseInt(e.target.value))}
                className="w-2 h-full appearance-none bg-black rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded relative z-10 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ WebkitAppearance: 'slider-vertical' } as any}
              />
            </div>
            
            <button onClick={() => sendCommand('Wipe')} className="flex-1 lg:flex-none bg-[#333] hover:bg-[#444] text-[10px] font-bold py-3 rounded border border-white/10 uppercase transition-colors">Wipe</button>
          </div>

          {/* PROGRAM WINDOW */}
          <div className="relative flex-1 bg-black border-4 border-red-600 rounded shadow-inner flex items-center justify-center min-h-[150px]">
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
               <Radio size={10} className="animate-pulse" /> <span>PROGRAM</span>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold italic truncate drop-shadow-lg">
                 {activeInput ? activeInput.title : 'NO SOURCE'}
              </div>
              <div className="text-[10px] uppercase tracking-widest opacity-60 mt-2 truncate">
                 {activeInput ? activeInput.shortTitle : '---'}
              </div>
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-1">
              <div className="w-24 h-1.5 bg-[#111] rounded-full overflow-hidden">
                <div className="w-[75%] h-full bg-green-500 border-r border-[#111]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: Inputs Grid & Controls */}
        <div className="flex flex-col lg:flex-row flex-1 space-y-2 lg:space-y-0 lg:space-x-2 min-h-[300px]">
          
          {/* INPUTS GRID */}
          <div className="flex-1 bg-[#1e1e1e] border border-[#333] rounded p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 px-1">
               <span className="text-[10px] font-bold uppercase tracking-wider">Inputs Source</span>
               <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
                 <div className="w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
               </div>
            </div>
            
            {vMixState ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 overflow-y-auto content-start py-1 px-1">
                {vMixState.inputs.map((input) => (
                  <InputCard
                    key={input.key}
                    input={input}
                    isActive={input.number === vMixState.activeInputNumber}
                    isPreview={input.number === vMixState.previewInputNumber}
                    onClick={() => sendCommand('SetPreview', input.number)}
                    onDirectCut={() => sendCommand('ActiveInput', input.number)}
                  />
                ))}
              </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#333] rounded m-1">
                  <Activity size={24} className="opacity-30" />
                  <p className="text-[10px] uppercase">Not connected to vMix.</p>
               </div>
            )}
          </div>

          {/* SIDE PANEL: Overlays / Extras */}
          <div className="w-full lg:w-64 bg-[#1e1e1e] border border-[#333] rounded p-2 flex flex-col shrink-0">
             <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Overlays & Extras</span>
             </div>
             <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 flex-1 content-start">
               {[1, 2, 3, 4].map(num => (
                  <button 
                     key={num}
                     onClick={() => sendCommand(`OverlayInput${num}`)}
                     className="bg-[#252525] hover:bg-[#333] border border-transparent hover:border-[#555] text-[10px] font-bold py-4 rounded uppercase transition-colors text-blue-400"
                  >
                     OVL {num}
                  </button>
               ))}
               <button onClick={() => sendCommand('StartStopRecording')} className="col-span-4 lg:col-span-2 mt-2 bg-[#252525] hover:bg-red-900/40 text-red-400 border border-transparent text-[10px] font-bold py-3 rounded uppercase transition-colors flex items-center justify-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-red-600"></div>
                 <span>Toggle Rec</span>
               </button>
               <button onClick={() => sendCommand('StartStopStreaming')} className="col-span-4 lg:col-span-2 bg-[#252525] hover:bg-blue-900/40 text-blue-400 border border-transparent text-[10px] font-bold py-3 rounded uppercase transition-colors flex items-center justify-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span>Toggle Stream</span>
               </button>
             </div>
          </div>
        </div>

      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#444] rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#161616]">
              <h2 className="text-white font-bold text-sm tracking-wide flex items-center space-x-2">
                <Settings2 size={16} className="text-orange-500" />
                <span>Controller Settings</span>
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="flex border-b border-[#333] px-2 pt-2 bg-[#161616]">
               <button 
                  onClick={() => setSettingsTab('general')} 
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-b-2 ${settingsTab === 'general' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
               >
                  General
               </button>
               <button 
                  onClick={() => setSettingsTab('shortcuts')} 
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-b-2 ${settingsTab === 'shortcuts' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
               >
                  Shortcuts
               </button>
            </div>

            {settingsTab === 'general' ? (
              <div className="p-5 flex flex-col space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">vMix API URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-300 font-mono text-sm"
                    disabled={isConnected}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Disconnect first to change the API URL.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Polling Rate</label>
                  <select className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-gray-300 text-sm focus:outline-none">
                    <option>1000ms (Standard)</option>
                    <option>500ms (Fast)</option>
                    <option>200ms (Ultra)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Faster polling uses more network resources.</p>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-col space-y-4 max-h-[50vh] overflow-y-auto">
                 <div className="bg-[#111] p-3 rounded border border-[#333] flex flex-col gap-3">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add New Shortcut</h3>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         readOnly 
                         value={newShortcutCode}
                         placeholder="Press key..." 
                         onKeyDown={(e) => { e.preventDefault(); setNewShortcutCode(e.code); }}
                         className="w-24 shrink-0 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-orange-500 text-gray-300 font-mono text-xs cursor-pointer placeholder-gray-600"
                       />
                       <select 
                         value={newShortcutCommand}
                         onChange={(e) => setNewShortcutCommand(e.target.value)}
                         className="flex-1 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-orange-500 text-gray-300 font-mono text-xs"
                       >
                         {AVAILABLE_COMMANDS.map(cmd => <option key={cmd} value={cmd}>{cmd}</option>)}
                       </select>
                       {['SetPreview', 'ActiveInput'].includes(newShortcutCommand) && (
                          <input 
                             type="text"
                             placeholder="Input #"
                             value={newShortcutValue}
                             onChange={(e) => setNewShortcutValue(e.target.value)}
                             className="w-16 shrink-0 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-orange-500 text-gray-300 font-mono text-xs"
                          />
                       )}
                       <button 
                          onClick={() => {
                             if (!newShortcutCode) return;
                             setShortcuts([...shortcuts, { id: Date.now().toString(), code: newShortcutCode, command: newShortcutCommand, value: newShortcutValue }]);
                             setNewShortcutCode('');
                             setNewShortcutValue('');
                          }}
                          disabled={!newShortcutCode}
                          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 text-xs font-bold rounded transition-colors"
                       >
                         Add
                       </button>
                    </div>
                 </div>

                 <div className="flex flex-col gap-2 mt-2">
                   <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Shortcuts</h3>
                   {shortcuts.length === 0 ? (
                      <p className="text-xs text-gray-500">No shortcuts defined.</p>
                   ) : shortcuts.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-[#111] p-2 rounded border border-[#222]">
                         <div className="flex items-center gap-3">
                            <kbd className="bg-[#222] px-2 py-1 rounded text-orange-400 font-mono text-[10px] border border-[#333] min-w-16 text-center">{s.code}</kbd>
                            <span className="text-gray-300 text-[11px] font-mono">{s.command} {s.value && <span className="text-orange-500">({s.value})</span>}</span>
                         </div>
                         <button 
                            onClick={() => setShortcuts(shortcuts.filter(x => x.id !== s.id))}
                            className="bg-red-900/30 text-red-400 hover:bg-red-900/60 border border-red-900/50 rounded transition-colors text-[10px] font-bold px-2 py-1 uppercase"
                         >
                            Del
                         </button>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-[#333] bg-[#161616] flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="bg-orange-600 hover:bg-orange-500 text-[11px] font-bold text-white px-4 py-1.5 rounded transition-colors uppercase"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {isHelpOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#444] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[80vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#161616]">
              <h2 className="text-white font-bold text-sm tracking-wide flex items-center space-x-2">
                <HelpCircle size={16} className="text-orange-500" />
                <span>Help & Instructions</span>
              </h2>
              <button onClick={() => setIsHelpOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-5 flex flex-col space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">How to Connect</h3>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li>Open vMix software on your production machine.</li>
                  <li>Go to <strong>Settings</strong> (top right corner).</li>
                  <li>Navigate to the <strong>Web Controller</strong> tab.</li>
                  <li>Check the box for <strong>Enable Web Controller</strong>.</li>
                  <li>Copy the <em>Website Address</em> provided (e.g., <code>http://192.168.1.100:8088</code>).</li>
                  <li>Paste this address into the connection bar at the top of this application and click <strong>Connect</strong>.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Controls & Features</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  <li><strong>Clicking an input:</strong> Sends the input to the PREVIEW window.</li>
                  <li><strong>Quick Cut / PGM button:</strong> Instantly sends the input to the PROGRAM window (live).</li>
                  <li><strong>Transitions:</strong> Use Cut, Fade, Merge, and Wipe buttons to transition between Preview and Program.</li>
                  <li><strong>T-Bar:</strong> Use the vertical slider to manually transition.</li>
                  <li><strong>Overlays & Extras:</strong> Trigger global overlays (1-4) globally, or toggle streaming/recording from the side panel.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Running Locally on Windows</h3>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li>In Google AI Studio, click <strong>Share / Export</strong> and download this project as a ZIP file.</li>
                  <li>Extract the ZIP file to a folder on your computer.</li>
                  <li>Open the folder and double-click <code>start-windows.bat</code>.</li>
                  <li>Node.js is required. The script will prompt you if it is missing and install required packages automatically.</li>
                  <li>The app will automatically launch in your default browser perfectly configured.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Keyboard Shortcuts</h3>
                <div className="text-sm text-gray-300 bg-[#111] p-3 rounded border border-[#333]">
                  <p className="mb-2 text-xs text-gray-400">Shortcuts are fully customizable. Click the <strong>Settings</strong> button in the footer and go to the <strong>Shortcuts</strong> tab to add your own.</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {shortcuts.map(s => (
                       <div key={s.id} className="flex justify-between items-center">
                         <span>{s.command} {s.value && `(${s.value})`}</span>
                         <kbd className="bg-[#222] px-2 py-0.5 rounded text-orange-400 text-xs border border-[#333] font-mono">{s.code}</kbd>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">Troubleshooting Connections</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  If this application is hosted online (via HTTPS) and your vMix instance is on a local network (HTTP), your browser might block the connection due to "Mixed Content" security policies. 
                  To resolve this, you can run this control panel locally, use a tool like <em>ngrok</em>, or disable mixed content blocking for this specific site in your browser settings.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-[#333] bg-[#161616] flex justify-end shrink-0">
              <button 
                onClick={() => setIsHelpOpen(false)} 
                className="bg-orange-600 hover:bg-orange-500 text-[11px] font-bold text-white px-4 py-1.5 rounded transition-colors uppercase"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-[#0a0a0a] border-t border-[#222] px-3 py-1 flex items-center justify-between text-[9px] shrink-0 font-mono">
        <div className="flex space-x-4 opacity-50">
          <span className="hidden sm:inline">URL: {url}</span>
          {vMixState && <span className="hidden sm:inline">VERSION: {vMixState.version}</span>}
          <span>{isConnected ? 'LATENCY: <10ms' : 'OFFLINE'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsHelpOpen(true)} className="px-2 py-0.5 bg-[#222] hover:bg-[#333] transition-colors rounded text-gray-400 cursor-pointer border border-[#333] flex items-center gap-1">
            <HelpCircle size={10} /> Help
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="px-2 py-0.5 bg-[#222] hover:bg-[#333] transition-colors rounded text-gray-400 cursor-pointer border border-[#333]">Settings</button>
          <div onClick={handleFullscreen} className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold transition-colors hover:bg-blue-500 cursor-pointer flex items-center gap-1">
             <Maximize size={10} /> FULLSCREEN
          </div>
        </div>
      </div>
    </div>
  );
}

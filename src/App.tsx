import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings2, Radio, Activity, Link, Unlink, AlertTriangle, MonitorPlay, Focus, Layers, Maximize, HelpCircle, Search, Wifi } from 'lucide-react';
import { VMixController } from './vMixApi';
import { VMixState } from './types';
import { InputCard } from './components/InputCard';
import { AudioMixer } from './components/AudioMixer';
import { TitleEditor } from './components/TitleEditor';
import { MacroBuilder } from './components/MacroBuilder';
import { ListEditor } from './components/ListEditor';

interface Shortcut {
  id: string;
  code: string;
  command: string;
  value: string;
}

const AVAILABLE_COMMANDS = [
  'Cut', 'Fade', 'Merge', 'Wipe', 
  'StartStopRecording', 'StartStopStreaming', 'StartStopExternal', 'StartStopMultiCorder',
  'OverlayInput1', 'OverlayInput2', 'OverlayInput3', 'OverlayInput4',
  'SetPreview', 'ActiveInput'
];

export default function App() {
  const [url, setUrl] = useState(() => localStorage.getItem('vmix-url') || 'http://127.0.0.1:8088');
  const [controller, setController] = useState<VMixController | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vMixState, setVMixState] = useState<VMixState | null>(null);
  const [isHttpsInsecure, setIsHttpsInsecure] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [subnetPrefix, setSubnetPrefix] = useState('192.168.1');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<string>('idle');
  const [foundHosts, setFoundHosts] = useState<{url: string, version: string}[]>([]);
  const abortScanRef = useRef<boolean>(false);
  
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
  const [filter, setFilter] = useState('All');
  
  const [mainTab, setMainTab] = useState<'inputs' | 'mixer' | 'titles' | 'lists' | 'macros'>('inputs');
  const [macros, setMacros] = useState<{id: string, name: string, steps: {command: string, value: string, input: string, delay: number}[]}[]>(() => {
    const m = localStorage.getItem('vmix-macros-list');
    return m ? JSON.parse(m) : [];
  });
  useEffect(() => localStorage.setItem('vmix-macros-list', JSON.stringify(macros)), [macros]);

  const [liveThumbnails, setLiveThumbnails] = useState(false);
  const [thumbnailTick, setThumbnailTick] = useState(0);

  useEffect(() => {
    if (liveThumbnails && isConnected) {
      const interval = setInterval(() => {
        setThumbnailTick(Date.now());
      }, 1000); // 1 FPS update
      return () => clearInterval(interval);
    }
  }, [liveThumbnails, isConnected]);

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
    localStorage.setItem('vmix-url', url);
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
  
  const playMacro = async (macroId: string) => {
     const m = macros.find(x => x.id === macroId);
     if (!m) return;
     for (const step of m.steps) {
        sendCommand(step.command, step.input ? parseInt(step.input) : undefined, step.value);
        if (step.delay > 0) {
           await new Promise(r => setTimeout(r, step.delay));
        }
     }
  };

  useEffect(() => {
    if (isScannerOpen) {
      const match = url.match(/https?:\/\/([0-9]+\.[0-9]+\.[0-9]+)\.[0-9]+/);
      if (match && match[1] !== '127.0.0') setSubnetPrefix(match[1]);
      else setSubnetPrefix('192.168.1');
      
      setScanStatus('idle');
      setScanProgress(0);
      setFoundHosts([]);
      abortScanRef.current = false;
    }
  }, [isScannerOpen, url]);
  
  const runScan = async () => {
    setScanStatus('scanning');
    setFoundHosts([]);
    setScanProgress(0);
    abortScanRef.current = false;
    
    const prefix = subnetPrefix.trim().replace(/\.$/, '');
    const batchSize = 40; 
    
    for (let i = 1; i <= 254; i += batchSize) {
      if (abortScanRef.current) break;
      const promises = [];
      
      for (let j = 0; j < batchSize && (i + j) <= 254; j++) {
         const ip = `${prefix}.${i + j}`;
         const target = `http://${ip}:8088`;
         promises.push((async () => {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 1500);
              const res = await fetch(`${target}/api/`, { signal: controller.signal });
              clearTimeout(timer);
              
              if (res.ok) {
                 const text = await res.text();
                 if (text.includes('<vmix>')) {
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'text/xml');
                    const version = xml.querySelector('version')?.textContent || 'Unknown';
                    setFoundHosts(prev => {
                       if (!prev.find(x => x.url === target)) return [...prev, { url: target, version }];
                       return prev;
                    });
                 }
              }
            } catch { } // ignore fetches expected to fail
         })());
      }
      await Promise.all(promises);
      if (!abortScanRef.current) setScanProgress(Math.min(254, i + batchSize - 1));
    }
    
    if (!abortScanRef.current) setScanStatus('done');
    else setScanStatus('idle');
  };

  // derived state
  const activeInput = vMixState?.inputs.find(i => i.number === vMixState.activeInputNumber);
  const previewInput = vMixState?.inputs.find(i => i.number === vMixState.previewInputNumber);

  const filteredInputs = vMixState?.inputs.filter(input => {
    if (filter === 'All') return true;
    const type = input.type.toLowerCase();
    if (filter === 'Camera') return type.includes('camera') || type.includes('capture') || type.includes('ndi') || type.includes('stream');
    if (filter === 'Video') return type.includes('video') || type.includes('replay');
    if (filter === 'Title') return type.includes('title') || type.includes('gt');
    if (filter === 'Audio') return type.includes('audio');
    if (filter === 'Image') return type.includes('image') || type.includes('photo');
    return true;
  });

  return (
    <div className="flex flex-col min-h-[100dvh] lg:h-screen lg:min-h-0 bg-[#121212] text-[#d1d1d1] font-sans selection:bg-orange-500/30 overflow-y-auto lg:overflow-hidden">
      
      {/* TOP HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333] shrink-0 z-20 gap-2">
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-4">
          <div className="text-orange-500 font-bold text-lg tracking-tighter flex items-center space-x-2">
            <MonitorPlay size={20} />
            <div>vMix <span className="text-white font-normal text-xs uppercase ml-1 opacity-60">Remote</span></div>
          </div>
          {isConnected && (
            <div className="flex flex-wrap gap-3 text-[10px] font-mono justify-end">
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.recording ? 'bg-red-600 shadow-[0_0_5px_#dc2626] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.recording ? 'text-red-500 font-bold' : 'text-gray-600'}>REC</span>
              </div>
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.streaming ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.streaming ? 'text-blue-400 font-bold' : 'text-gray-600'}>STREAM</span>
              </div>
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.external ? 'bg-orange-500 shadow-[0_0_5px_#f97316] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.external ? 'text-orange-400 font-bold' : 'text-gray-600'}>EXT</span>
              </div>
              <div className="flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.multiCorder ? 'bg-purple-500 shadow-[0_0_5px_#a855f7] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.multiCorder ? 'text-purple-400 font-bold' : 'text-gray-600'}>MULTI</span>
              </div>
              <button 
                onClick={() => setLiveThumbnails(!liveThumbnails)} 
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${liveThumbnails ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-transparent border-gray-600 text-gray-500 hover:text-gray-300'}`}
              >
                <div className={`w-2 h-2 rounded-full ${liveThumbnails ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span>LIVE TX</span>
              </button>
              <div className="hidden sm:flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span>API OK</span></div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center w-full sm:w-auto justify-end gap-2">
          <form onSubmit={handleConnect} className="flex items-center space-x-2 text-[11px] font-mono">
            <button 
              type="button" 
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center space-x-1 bg-[#222] hover:bg-[#333] text-blue-400 px-2 py-1.5 rounded border border-[#333] transition-colors shrink-0"
            >
              <Search size={12} /> <span className="hidden sm:inline font-bold uppercase tracking-wider">Scan</span>
            </button>
            <div className="relative flex items-center">
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
          <div 
            className="relative flex-1 bg-black border-4 border-green-600 rounded shadow-inner flex items-center justify-center min-h-[150px] overflow-hidden group"
            style={liveThumbnails && previewInput && url ? {
              backgroundImage: `url("${url}/api/?thumbnail=${previewInput.key}&t=${thumbnailTick}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {}}
          >
            <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">PREVIEW</div>
            <div className={`text-center px-4 z-10 transition-opacity ${liveThumbnails && previewInput ? 'opacity-0 group-hover:opacity-100 bg-black/60 p-4 rounded backdrop-blur-sm' : ''}`}>
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
          <div 
            className="relative flex-1 bg-black border-4 border-red-600 rounded shadow-inner flex items-center justify-center min-h-[150px] overflow-hidden group"
            style={liveThumbnails && activeInput && url ? {
              backgroundImage: `url("${url}/api/?thumbnail=${activeInput.key}&t=${thumbnailTick}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {}}
          >
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 shadow z-10">
               <Radio size={10} className="animate-pulse" /> <span>PROGRAM</span>
            </div>
            <div className={`text-center px-4 z-10 transition-opacity ${liveThumbnails && activeInput ? 'opacity-0 group-hover:opacity-100 bg-black/60 p-4 rounded backdrop-blur-sm' : ''}`}>
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
        <div className="flex flex-col lg:flex-row flex-1 space-y-2 lg:space-y-0 lg:space-x-2 min-h-[500px] lg:min-h-0">
          
          {/* MAIN AREA: Inputs / Mixer / Titles / Macros */}
          <div className="flex-1 bg-[#1e1e1e] border border-[#333] rounded flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center px-3 py-2 shrink-0 border-b border-[#333] bg-[#161616] gap-2">
               <div className="flex flex-wrap items-center gap-2">
                 <div className="flex flex-wrap gap-1">
                   {(['inputs', 'mixer', 'titles', 'lists', 'macros'] as const).map(tab => (
                     <button 
                       key={tab} 
                       onClick={() => setMainTab(tab)} 
                       className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${mainTab === tab ? 'bg-orange-600 text-white' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>
                 {mainTab === 'inputs' && (
                   <div className="flex flex-wrap gap-1 sm:border-l border-[#333] sm:pl-4 shrink-0">
                     {['All', 'Camera', 'Video', 'Title', 'Audio', 'Image'].map(f => (
                       <button key={f} onClick={() => setFilter(f)} className={`text-[9px] px-2 py-0.5 rounded transition-colors ${filter === f ? 'bg-[#444] text-white font-bold' : 'text-gray-500 hover:bg-[#333]'}`}>{f}</button>
                     ))}
                   </div>
                 )}
               </div>
               <div className="flex space-x-1 hidden sm:flex shrink-0">
                 <div className="w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
                 <div className="w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
               </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
               {!vMixState && mainTab !== 'macros' ? (
                  <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#333] rounded m-2">
                     <Activity size={24} className="opacity-30" />
                     <p className="text-[10px] uppercase">Not connected to vMix.</p>
                  </div>
               ) : (
                  <>
                     {mainTab === 'inputs' && (
                        <div className="h-full overflow-y-auto p-2">
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 content-start">
                              {filteredInputs?.map((input) => (
                                 <InputCard
                                    key={input.key}
                                    input={input}
                                    vmixUrl={url}
                                    isActive={input.number === vMixState.activeInputNumber}
                                    isPreview={input.number === vMixState.previewInputNumber}
                                    onClick={() => sendCommand('SetPreview', input.number)}
                                    onDirectCut={() => sendCommand('ActiveInput', input.number)}
                                    onCommand={(func, val) => sendCommand(func, input.number, val)}
                                 />
                              ))}
                           </div>
                        </div>
                     )}
                     {mainTab === 'mixer' && <AudioMixer vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'titles' && <TitleEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'lists' && <ListEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'macros' && <MacroBuilder macros={macros} setMacros={setMacros} playMacro={playMacro} />}
                  </>
               )}
            </div>
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
                 <div className={`w-2 h-2 rounded-full ${vMixState?.recording ? 'bg-red-600 shadow-[0_0_5px_#dc2626] animate-pulse' : 'bg-red-900'}`}></div>
                 <span>Toggle Rec</span>
               </button>
               <button onClick={() => sendCommand('StartStopStreaming')} className="col-span-4 lg:col-span-2 bg-[#252525] hover:bg-blue-900/40 text-blue-400 border border-transparent text-[10px] font-bold py-3 rounded uppercase transition-colors flex items-center justify-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.streaming ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse' : 'bg-blue-900'}`}></div>
                 <span>Toggle Stream</span>
               </button>
               <button onClick={() => sendCommand('StartStopExternal')} className="col-span-4 lg:col-span-2 bg-[#252525] hover:bg-orange-900/40 text-orange-400 border border-transparent text-[10px] font-bold py-3 rounded uppercase transition-colors flex items-center justify-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.external ? 'bg-orange-500 shadow-[0_0_5px_#f97316] animate-pulse' : 'bg-orange-900'}`}></div>
                 <span>Toggle Ext</span>
               </button>
               <button onClick={() => sendCommand('StartStopMultiCorder')} className="col-span-4 lg:col-span-2 bg-[#252525] hover:bg-purple-900/40 text-purple-400 border border-transparent text-[10px] font-bold py-3 rounded uppercase transition-colors flex items-center justify-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${vMixState?.multiCorder ? 'bg-purple-500 shadow-[0_0_5px_#a855f7] animate-pulse' : 'bg-purple-900'}`}></div>
                 <span>MultiCorder</span>
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

      {/* SCANNER MODAL */}
      {isScannerOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-[#444] rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
             <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#161616]">
                <h2 className="text-white font-bold text-sm tracking-wide flex items-center space-x-2">
                   <Wifi size={16} className="text-blue-500" />
                   <span>Network Scanner</span>
                </h2>
                <button onClick={() => { abortScanRef.current = true; setIsScannerOpen(false); }} className="text-gray-400 hover:text-white transition-colors">✕</button>
             </div>
             
             <div className="p-5 flex flex-col space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                   Scan your local network to automatically find running vMix instances. 
                   Ensure Web Controller is enabled in vMix settings.
                </p>
                
                <div className="flex space-x-2 items-end">
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subnet to Scan (e.g. 192.168.1)</label>
                      <div className="flex items-center bg-[#111] border border-[#333] rounded px-3 py-2 focus-within:border-blue-500 transition-colors">
                         <input 
                            type="text" 
                            value={subnetPrefix}
                            onChange={(e) => setSubnetPrefix(e.target.value)}
                            disabled={scanStatus === 'scanning'}
                            className="bg-transparent focus:outline-none text-gray-300 font-mono text-sm w-full"
                         />
                         <span className="text-gray-500 font-mono text-sm">.X</span>
                      </div>
                   </div>
                   <button 
                      onClick={() => scanStatus === 'scanning' ? (abortScanRef.current = true, setScanStatus('idle')) : runScan()}
                      className={`px-4 py-2 text-xs font-bold rounded uppercase whitespace-nowrap border transition-colors ${scanStatus === 'scanning' ? 'bg-red-900/50 text-red-400 border-red-500/30 hover:bg-red-900/80' : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'}`}
                   >
                      {scanStatus === 'scanning' ? 'Stop Scan' : 'Start Scan'}
                   </button>
                </div>
                
                {/* Progress Bar */}
                {(scanStatus === 'scanning' || scanProgress > 0) && (
                   <div className="flex flex-col space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                         <span>{scanStatus === 'scanning' ? 'Scanning IPs...' : 'Scan Complete'}</span>
                         <span>{scanProgress} / 254</span>
                      </div>
                      <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden border border-[#222]">
                         <div className="bg-blue-500 h-full transition-all duration-300 ease-out" style={{ width: `${(scanProgress / 254) * 100}%` }}></div>
                      </div>
                   </div>
                )}
                
                {/* Results Area */}
                <div className="bg-[#111] border border-[#333] rounded p-2 h-32 overflow-y-auto w-full">
                   {foundHosts.length > 0 ? (
                      <div className="flex flex-col space-y-2">
                         {foundHosts.map(host => (
                            <div key={host.url} className="flex items-center justify-between bg-[#1e1e1e] border border-[#444] rounded p-2">
                               <div className="flex flex-col space-y-1">
                                  <span className="text-xs font-bold text-white font-mono">{host.url}</span>
                                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">vMix {host.version}</span>
                               </div>
                               <button 
                                  onClick={() => {
                                     setUrl(host.url);
                                     abortScanRef.current = true;
                                     setIsScannerOpen(false);
                                  }}
                                  className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-4 py-1.5 rounded transition-colors uppercase shrink-0"
                               >
                                  Select
                               </button>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                         {scanStatus === 'scanning' ? 'Searching for vMix...' : scanStatus === 'done' ? 'No instances found.' : 'Waiting to scan.'}
                      </div>
                   )}
                </div>
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
                  <li>Click the <strong>SCAN</strong> button in the top bar to auto-detect vMix on your network.</li>
                  <li>Or manually copy the <em>Website Address</em> provided (e.g., <code>http://192.168.1.100:8088</code>) and click Connect.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Controls & Features</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                  <li>
                    <strong>Views Tabs:</strong> Switch between main panels using the tabs (INPUTS, MIXER, TITLES, LISTS, MACROS).
                  </li>
                  <li>
                    <strong>Inputs:</strong> Click to Preview, click PGM to cut live. Use the filter buttons to sort sources by type (Camera, Video, Title, Audio, Image).
                  </li>
                  <li>
                    <strong>Audio Mixer:</strong> Manage volume levels and toggle mute states for all audio sources visually.
                  </li>
                  <li>
                    <strong>Title Editor:</strong> Select any Title/GT input to edit its text fields live. Changes are sent when you click away from the text box.
                  </li>
                  <li>
                    <strong>Lists:</strong> View and manage items inside `List` or `VideoList` inputs. Select items or navigate to next/previous.
                  </li>
                  <li>
                    <strong>Macro Builder:</strong> Build custom sequences of commands with delays. Set commands, inputs, and execute complex sequences with one click.
                  </li>
                  <li>
                    <strong>Recording & Streaming:</strong> Toggle global recording, streaming, external output, and MultiCorder right from the side panel.
                  </li>
                  <li><strong>Transitions:</strong> Use Cut, Fade, Merge, and Wipe buttons to transition. Or manually drag the T-Bar slider.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Apps & Install (Windows / Android)</h3>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li><strong>Browser Install (PWA):</strong> This web application can be installed directly to your device!
                    <ul className="list-disc list-inside ml-4 mt-1 text-xs text-gray-400">
                       <li><strong>Windows (Chrome/Edge):</strong> Click the "Install App" or "App available" icon in the right side of your URL bar, or open the browser menu and select "Install vMix Web Controller".</li>
                       <li><strong>Android:</strong> Open this page in Chrome, tap the 3-dot menu, and tap "Add to Home screen". It will act as a native fullscreen app.</li>
                    </ul>
                  </li>
                  <li className="mt-2"><strong>Offline Windows Package:</strong> In Google AI Studio, click <strong>Share / Export</strong> and download this project as a ZIP file. Extract it and run <code>start-windows.bat</code> to run it entirely offline on Windows.</li>
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

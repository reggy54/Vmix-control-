import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings2, Radio, Activity, Link, Unlink, AlertTriangle, MonitorPlay, Focus, Layers, Maximize, HelpCircle, Search, Wifi, Video, Image as ImageIcon, LayoutDashboard, Sliders, Move, Type, List, MonitorUp, Terminal, Code, Database } from 'lucide-react';
import { VMixController } from './vMixApi';
import { VMixState } from './types';
import { InputCard } from './components/InputCard';
import { AudioMixer } from './components/AudioMixer';
import { TitleEditor } from './components/TitleEditor';
import { MacroBuilder } from './components/MacroBuilder';
import { ListEditor } from './components/ListEditor';
import { MultiViewEditor } from './components/MultiViewEditor';
import { OutputsEditor } from './components/OutputsEditor';
import { ImageAdjustEditor } from './components/ImageAdjustEditor';
import { PlaylistsScriptsEditor } from './components/PlaylistsScriptsEditor';
import { SocialDataEditor } from './components/SocialDataEditor';
import { TallyMode } from './components/TallyMode';
import { PTZControls } from './components/PTZControls';
import { Dashboard } from './components/Dashboard';
import { ColourKeyConfig } from './components/ColourKeyConfig';
import { StatusPanel } from './components/StatusPanel';
import { TransitionPanel } from './components/TransitionPanel';
import { formatTime, formatSeconds, safeStorage } from './utils';



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
  'SetPreview', 'ActiveInput', 'PlayLocalMacro',
  'ColourKey', 'ColourKeyOn', 'ColourKeyOff'
];

const MAIN_TABS = [
  { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
  { id: 'inputs', label: 'Inputs', icon: Video },
  { id: 'mixer', label: 'Audio', icon: Sliders },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'titles', label: 'Titles', icon: Type },
  { id: 'outputs', label: 'Outputs', icon: MonitorUp },
  { id: 'ptz', label: 'PTZ', icon: Move },
  { id: 'lists', label: 'Lists', icon: List },
  { id: 'image', label: 'Color', icon: Settings2 },
  { id: 'scripts', label: 'Scripts', icon: Code },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'macros', label: 'Macros', icon: Terminal },
] as const;

export default function App() {
  const [url, setUrl] = useState(() => safeStorage.getItem('vmix-url') || 'http://127.0.0.1:8088');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const secureDownload = async (filename: string, fileUrl: string, setProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    setProgress(true);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Network response was not OK');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Secure download fail:', err);
      // Fallback
      window.location.href = fileUrl;
    } finally {
      setProgress(false);
    }
  };

  const handleCopyHtml = async () => {
    setCopyStatus('loading');
    try {
      // Prefer the fully compiled, inlined, file:// safe single-file build
      let response = await fetch('./index-compiled.html');
      if (!response.ok) {
        // Fallback to index.html if compilation hasn't completed yet
        response = await fetch('./index.html');
      }
      if (!response.ok) throw new Error('Failed to fetch HTML template');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('Copy HTML fail:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };
  const [controller, setController] = useState<VMixController | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vMixState, setVMixState] = useState<VMixState | null>(null);
  const [colourKeyConfigInput, setColourKeyConfigInput] = useState<VMixState['inputs'][0] | null>(null);
  const [isHttpsInsecure, setIsHttpsInsecure] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [subnetPrefix, setSubnetPrefix] = useState('192.168.1');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<string>('idle');
  const [foundHosts, setFoundHosts] = useState<{url: string, version: string}[]>([]);
  const abortScanRef = useRef<boolean>(false);
  
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = safeStorage.getItem('vmix-shortcuts');
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
  
  const [mainTab, setMainTab] = useState<'dashboard' | 'inputs' | 'mixer' | 'titles' | 'lists' | 'macros' | 'ptz' | 'layers' | 'outputs' | 'image' | 'scripts' | 'data'>('inputs');
  const [macros, setMacros] = useState<{id: string, name: string, steps: {command: string, value: string, input: string, delay: number}[]}[]>(() => {
    const m = safeStorage.getItem('vmix-macros-list');
    return m ? JSON.parse(m) : [];
  });
  useEffect(() => safeStorage.setItem('vmix-macros-list', JSON.stringify(macros)), [macros]);

  const [liveThumbnails, setLiveThumbnails] = useState(false);
  const [liveFps, setLiveFps] = useState(() => {
    const s = safeStorage.getItem('vmix-live-fps');
    return s ? parseFloat(s) : 1;
  });
  const [useWebRTC, setUseWebRTC] = useState(() => {
    const s = safeStorage.getItem('vmix-use-webrtc');
    return s ? s === 'true' : false;
  });
  const [pollRate, setPollRate] = useState(() => {
    const s = safeStorage.getItem('vmix-poll-rate');
    return s ? parseInt(s, 10) : 1000;
  });
  
  const [thumbnailTick, setThumbnailTick] = useState(0);

  useEffect(() => safeStorage.setItem('vmix-live-fps', liveFps.toString()), [liveFps]);
  useEffect(() => safeStorage.setItem('vmix-use-webrtc', useWebRTC.toString()), [useWebRTC]);
  useEffect(() => safeStorage.setItem('vmix-poll-rate', pollRate.toString()), [pollRate]);

  useEffect(() => {
    if (liveThumbnails && isConnected && !useWebRTC) {
      const interval = setInterval(() => {
        setThumbnailTick(Date.now());
      }, 1000 / liveFps);
      return () => clearInterval(interval);
    }
  }, [liveThumbnails, isConnected, liveFps, useWebRTC]);

  const pollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    safeStorage.setItem('vmix-shortcuts', JSON.stringify(shortcuts));
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
      pollTimeoutRef.current = window.setTimeout(() => pollState(ctrl), pollRate);
    }
  }, [pollRate]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    safeStorage.setItem('vmix-url', url);
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

  const sendCommand = async (func: string, input?: string | number, value?: string | number, duration?: number) => {
    if (controller) {
      try {
        await controller.sendCommand(func, input, value, duration);
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
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const shortcut = shortcuts.find(s => s.code === e.code);
      if (shortcut) {
        e.preventDefault();
        if (shortcut.command === 'PlayLocalMacro' && shortcut.value) {
           playMacro(shortcut.value);
        } else {
           sendCommand(shortcut.command, shortcut.value ? shortcut.value : undefined);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controller, shortcuts, macros]);

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
            <div className="flex flex-wrap gap-2 text-[10px] font-mono justify-end">
              <button 
                onClick={() => sendCommand('StartStopRecording')}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${vMixState?.recording ? 'bg-red-900/30 border-red-700 hover:bg-red-900/50' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                title="Toggle Recording"
              >
                 <div className={`w-2 h-2 rounded-full ${vMixState?.recording ? 'bg-red-600 shadow-[0_0_5px_#dc2626] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.recording ? 'text-red-500 font-bold' : 'text-gray-400 font-bold'}>REC</span>
                 {vMixState?.recording && vMixState.recordingTime > 0 && <span className="text-red-300 ml-1">{formatSeconds(vMixState.recordingTime)}</span>}
              </button>
              <button 
                onClick={() => sendCommand('StartStopStreaming')}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${vMixState?.streaming ? 'bg-blue-900/30 border-blue-700 hover:bg-blue-900/50' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                title="Toggle Streaming"
              >
                 <div className={`w-2 h-2 rounded-full ${vMixState?.streaming ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.streaming ? 'text-blue-400 font-bold' : 'text-gray-400 font-bold'}>STREAM</span>
                 {vMixState?.streaming && vMixState.streamingTime > 0 && <span className="text-blue-300 ml-1">{formatSeconds(vMixState.streamingTime)}</span>}
              </button>
              <button 
                onClick={() => sendCommand('StartStopExternal')}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${vMixState?.external ? 'bg-orange-900/30 border-orange-700 hover:bg-orange-900/50' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                title="Toggle External Output"
              >
                 <div className={`w-2 h-2 rounded-full ${vMixState?.external ? 'bg-orange-500 shadow-[0_0_5px_#f97316] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.external ? 'text-orange-400 font-bold' : 'text-gray-400 font-bold'}>EXT</span>
              </button>
              <button 
                onClick={() => sendCommand('StartStopMultiCorder')}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${vMixState?.multiCorder ? 'bg-purple-900/30 border-purple-700 hover:bg-purple-900/50' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                title="Toggle MultiCorder"
              >
                 <div className={`w-2 h-2 rounded-full ${vMixState?.multiCorder ? 'bg-purple-500 shadow-[0_0_5px_#a855f7] animate-pulse' : 'bg-gray-700'}`}></div>
                 <span className={vMixState?.multiCorder ? 'text-purple-400 font-bold' : 'text-gray-400 font-bold'}>MULTI</span>
              </button>
              
              {(vMixState?.streaming || vMixState?.recording) && (
                 <div className="flex items-center ml-1 bg-red-600/20 border border-red-600 text-red-500 px-1.5 py-0.5 rounded">
                     <span className="font-bold tracking-widest uppercase animate-pulse text-[10px]">ON AIR</span>
                 </div>
              )}
              <button 
                onClick={() => setLiveThumbnails(!liveThumbnails)} 
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${liveThumbnails ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-transparent border-gray-600 text-gray-500 hover:text-gray-300'}`}
                title="Live Thumbnails (MJPEG)"
              >
                <div className={`w-2 h-2 rounded-full ${liveThumbnails ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span>LIVE TX</span>
              </button>
              <button 
                onClick={() => setUseWebRTC(!useWebRTC)} 
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${useWebRTC ? 'bg-orange-900/30 border-orange-600 text-orange-400' : 'bg-transparent border-gray-600 text-gray-500 hover:text-gray-300'}`}
                title="Use WebRTC Stream for Program"
              >
                 <Video size={10} /> <span className="font-bold">WEBRTC</span>
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
               <button type="submit" className="bg-[#333] hover:bg-[#444] text-[10px] font-bold text-white px-3 py-1.5 rounded border border-white/10 transition-colors uppercase shrink-0">
                 Connect
               </button>
            ) : (
               <button type="button" onClick={handleDisconnect} className="bg-orange-600 hover:bg-orange-500 text-[10px] font-bold text-white px-3 py-1.5 rounded border border-white/20 transition-colors uppercase shrink-0">
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
        
        <StatusPanel vMixState={vMixState} sendCommand={sendCommand} />

        {/* TOP HALF: Monitors & Transitions */}
        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 shrink-0 min-h-[120px] lg:h-[40vh]">
          
          {/* PREVIEW WINDOW */}
          <div 
            className="col-span-1 lg:flex-1 relative bg-black border-[3px] border-green-600 rounded shadow-inner flex items-center justify-center min-h-[120px] overflow-hidden group"
            style={(liveThumbnails && previewInput && url) ? {
              backgroundImage: `url("${url}/api/?thumbnail=${previewInput.key}&t=${thumbnailTick}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {}}
          >
            <div className="absolute top-1 left-1 lg:top-2 lg:left-2 bg-green-600 text-white text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded shadow z-10">PREVIEW</div>
            <div className={`text-center px-1 lg:px-4 z-10 w-full flex flex-col items-center transition-opacity ${liveThumbnails && previewInput ? 'opacity-0 group-hover:opacity-100 bg-black/60 p-2 lg:p-4 rounded backdrop-blur-sm' : ''}`}>
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold opacity-20 italic truncate max-w-full">
                 {previewInput ? previewInput.title : 'NO SOURCE'}
              </div>
              <div className="hidden lg:block text-[10px] uppercase tracking-widest opacity-30 mt-2 truncate max-w-full">
                 {previewInput ? previewInput.shortTitle : '---'}
              </div>
              {previewInput && previewInput.duration > 0 && (
                <div className="mt-2 lg:mt-4 font-mono text-sm sm:text-xl lg:text-3xl font-bold text-gray-300 bg-black/50 px-2 lg:px-3 py-1 rounded shadow-inner tracking-wider">
                  -{formatTime(previewInput.duration - previewInput.position)}
                </div>
              )}
            </div>
            
            {previewInput && previewInput.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80 z-10">
                <div 
                  className="h-full bg-green-600 transition-all duration-300 ease-linear"
                  style={{ width: `${(previewInput.position / previewInput.duration) * 100}%` }}
                ></div>
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex space-x-1 z-10">
              <div className="w-8 h-1 bg-green-600"></div>
              <div className="w-8 h-1 bg-gray-700"></div>
            </div>
          </div>

          <div className="col-span-2 order-3 lg:order-none lg:w-28 flex shrink-0">
             <TransitionPanel sendCommand={sendCommand} />
          </div>

          {/* PROGRAM WINDOW */}
          <div 
            className="col-span-1 lg:flex-1 relative bg-black border-[3px] border-red-600 rounded shadow-inner flex items-center justify-center min-h-[120px] overflow-hidden group"
            style={(!useWebRTC && liveThumbnails && activeInput && url) ? {
              backgroundImage: `url("${url}/api/?thumbnail=${activeInput.key}&t=${thumbnailTick}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {}}
          >
            {useWebRTC && url && (
               <iframe 
                 src={`${url.replace(/:\d+$/, '')}:8089/`} 
                 className="absolute inset-0 w-full h-full border-0"
                 title="Program WebRTC"
                 allow="autoplay; fullscreen"
               ></iframe>
            )}
            <div className="absolute top-1 left-1 lg:top-2 lg:left-2 bg-red-600 text-white text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 shadow z-10">
               <Radio size={8} className="animate-pulse lg:w-[10px] lg:h-[10px]" /> <span>PROGRAM</span>
            </div>
            <div className={`text-center px-1 lg:px-4 w-full flex flex-col items-center z-10 transition-opacity ${liveThumbnails && activeInput ? 'opacity-0 group-hover:opacity-100 bg-black/60 p-2 lg:p-4 rounded backdrop-blur-sm' : ''}`}>
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold italic truncate drop-shadow-lg max-w-full opacity-20">
                 {activeInput ? activeInput.title : 'NO SOURCE'}
              </div>
              <div className="hidden lg:block text-[10px] uppercase tracking-widest opacity-60 mt-2 truncate max-w-full">
                 {activeInput ? activeInput.shortTitle : '---'}
              </div>
              
              {activeInput && activeInput.duration > 0 && (
                <div className={`mt-2 lg:mt-4 font-mono text-sm sm:text-2xl lg:text-5xl font-bold bg-black/60 px-2 lg:px-4 py-1 lg:py-1.5 rounded shadow-xl tracking-wider ${
                  (activeInput.duration - activeInput.position) < 10000 ? 'text-red-500 animate-pulse' : 'text-white'
                }`}>
                  -{formatTime(activeInput.duration - activeInput.position)}
                </div>
              )}
            </div>
            
            {activeInput && activeInput.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/80 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
                <div 
                  className={`h-full transition-all duration-300 ease-linear ${(activeInput.duration - activeInput.position) < 10000 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${(activeInput.position / activeInput.duration) * 100}%` }}
                ></div>
              </div>
            )}

            <div className="absolute bottom-2 right-2 flex space-x-1 z-10">
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
                 <div className="flex overflow-x-auto scrollbar-hide space-x-1 pb-1 sm:pb-0 w-full lg:w-auto">
                   {MAIN_TABS.map(tab => (
                     <button 
                       key={tab.id} 
                       onClick={() => setMainTab(tab.id as any)} 
                       className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors whitespace-nowrap shrink-0 border ${mainTab === tab.id ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-[#111] border-[#333] text-gray-400 hover:bg-[#222]'}`}
                       title={tab.label}
                     >
                       <tab.icon size={12} strokeWidth={2.5} />
                       <span>{tab.label}</span>
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
                                    onColourKeyConfig={() => setColourKeyConfigInput(input)}
                                 />
                              ))}
                           </div>
                        </div>
                     )}
                     {mainTab === 'dashboard' && <Dashboard vMixState={vMixState!} sendCommand={sendCommand} macros={macros} playMacro={playMacro} vmixUrl={url} onColourKeyConfig={setColourKeyConfigInput} />}
                     {mainTab === 'mixer' && <AudioMixer vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'ptz' && <PTZControls vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'titles' && <TitleEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'lists' && <ListEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'outputs' && <OutputsEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'macros' && <MacroBuilder macros={macros} setMacros={setMacros} playMacro={playMacro} vMixState={vMixState!} />}
                     {mainTab === 'layers' && <MultiViewEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'image' && <ImageAdjustEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'scripts' && <PlaylistsScriptsEditor vMixState={vMixState!} sendCommand={sendCommand} />}
                     {mainTab === 'data' && <SocialDataEditor vMixState={vMixState!} sendCommand={sendCommand} />}
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
               {[1, 2, 3, 4].map(num => {
                  const ovl = vMixState?.overlays.find(o => o.number === num);
                  const isActive = ovl && ovl.input !== undefined;
                  const ovlInput = isActive && vMixState?.inputs.find(i => i.number === ovl.input);
                  return (
                    <button 
                       key={num}
                       onClick={() => sendCommand(`OverlayInput${num}`)}
                       className={`border py-3 rounded uppercase transition-colors flex flex-col items-center justify-center space-y-1 ${isActive ? 'bg-blue-900/60 border-blue-500 hover:bg-blue-900/80 text-white' : 'bg-[#252525] hover:bg-[#333] border-transparent hover:border-[#555] text-gray-500'}`}
                    >
                       <span className="text-[10px] font-bold">OVL {num}</span>
                       <span className={`text-[8px] truncate px-1 w-full text-center ${isActive ? 'text-blue-200' : 'text-gray-600'}`}>{isActive && ovlInput ? ovlInput.shortTitle : 'Off'}</span>
                    </button>
                  );
               })}
               <button 
                 onClick={() => {
                   [1, 2, 3, 4].forEach(num => sendCommand(`OverlayInput${num}Off`));
                 }} 
                 className="col-span-4 lg:col-span-2 mt-2 bg-[#252525] hover:bg-red-900/40 text-red-500 border border-[#333] text-[9px] font-bold py-2 rounded uppercase transition-colors flex items-center justify-center shadow-lg"
               >
                 Clear All OVL
               </button>
               <button 
                 onClick={() => sendCommand('PlayPause')} 
                 className="col-span-4 lg:col-span-2 mt-2 bg-[#252525] hover:bg-green-900/40 text-green-500 border border-[#333] text-[9px] font-bold py-2 rounded uppercase transition-colors flex items-center justify-center shadow-lg"
               >
                 Master Play
               </button>
               <button 
                 onClick={() => sendCommand('RestartAll')} 
                 className="col-span-4 lg:col-span-2 mt-2 bg-[#252525] hover:bg-blue-900/40 text-blue-500 border border-[#333] text-[9px] font-bold py-2 rounded uppercase transition-colors flex items-center justify-center shadow-lg"
               >
                 Restart All
               </button>
               <button 
                 onClick={() => sendCommand('FadeToBlack')} 
                 className="col-span-4 lg:col-span-2 mt-2 col-start-1 bg-[#1a1a1a] hover:bg-black text-gray-400 border border-[#222] text-[9px] font-bold py-2 rounded uppercase transition-colors flex items-center justify-center shadow-lg"
               >
                 Fade To Black
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
                  <select 
                    value={pollRate.toString()} 
                    onChange={(e) => setPollRate(parseInt(e.target.value))}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-gray-300 text-sm focus:outline-none"
                  >
                    <option value="1000">1000ms (Standard)</option>
                    <option value="500">500ms (Fast)</option>
                    <option value="200">200ms (Ultra)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Faster polling uses more network resources.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Live TX (Preview/Program) FPS</label>
                  <div className="flex items-center space-x-2">
                     <input 
                       type="range" 
                       min="0.5" 
                       max="10" 
                       step="0.5"
                       value={liveFps} 
                       onChange={(e) => setLiveFps(parseFloat(e.target.value))} 
                       className="flex-1"
                       disabled={useWebRTC}
                     />
                     <span className="text-xs font-mono text-orange-500 font-bold w-12 text-right">{useWebRTC ? '---' : `${liveFps} FPS`}</span>
                  </div>
                </div>

                <div>
                   <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useWebRTC}
                        onChange={(e) => setUseWebRTC(e.target.checked)}
                        className="rounded border-[#333] bg-[#111] text-orange-500 focus:ring-orange-500 focus:ring-offset-[#161616]"
                      />
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Use vMix WebRTC (Port 8089) for main displays</span>
                   </label>
                   <p className="text-[10px] text-gray-500 mt-1 ml-6">Significantly faster 30/60 FPS, connects directly to vMix WebRTC output (requires vMix Pro/4K or Web Controller enabled).</p>
                </div>

                <div className="pt-4 border-t border-[#333]">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Management</label>
                   <div className="flex space-x-2">
                     <button 
                       onClick={() => {
                         const data = { macros, shortcuts };
                         const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                         const blobUrl = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = blobUrl;
                         a.download = `vmix-remote-backup-${new Date().toISOString().split('T')[0]}.json`;
                         a.click();
                         URL.revokeObjectURL(blobUrl);
                       }}
                       className="bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 px-3 py-1.5 rounded text-xs transition-colors font-bold"
                     >
                       Export Macros & Shortcuts
                     </button>
                     
                     <label className="bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 px-3 py-1.5 rounded text-xs transition-colors font-bold cursor-pointer">
                       Import Backup
                       <input 
                         type="file" 
                         accept=".json" 
                         className="hidden" 
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           const reader = new FileReader();
                           reader.onload = (ev) => {
                             try {
                               const data = JSON.parse(ev.target?.result as string);
                               if (data.macros) setMacros(data.macros);
                               if (data.shortcuts) setShortcuts(data.shortcuts);
                               alert('Backup imported successfully!');
                             } catch (err) {
                               alert('Failed to parse backup file');
                             }
                           };
                           reader.readAsText(file);
                           e.target.value = '';
                         }} 
                       />
                     </label>
                   </div>
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

                       {['SetPreview', 'ActiveInput', 'Cut', 'Fade', 'Merge', 'Wipe', 'Audio', 'OverlayInput1', 'OverlayInput2', 'OverlayInput3', 'OverlayInput4', 'ColourKey', 'ColourKeyOn', 'ColourKeyOff'].includes(newShortcutCommand) && (
                          <input 
                             type="text"
                             placeholder="Input #"
                             value={newShortcutValue}
                             onChange={(e) => setNewShortcutValue(e.target.value)}
                             className="w-16 shrink-0 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-orange-500 text-gray-300 font-mono text-xs"
                          />
                       )}

                       {newShortcutCommand === 'PlayLocalMacro' && (
                          <select
                             value={newShortcutValue}
                             onChange={(e) => setNewShortcutValue(e.target.value)}
                             className="w-32 shrink-0 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-orange-500 text-gray-300 font-mono text-xs truncate"
                          >
                             <option value="" disabled>Select Macro</option>
                             {macros.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
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

      {/* COLOUR KEY CONFIG */}
      {colourKeyConfigInput && vMixState && (
         <ColourKeyConfig
            input={colourKeyConfigInput}
            vMixState={vMixState}
            sendCommand={sendCommand}
            onClose={() => setColourKeyConfigInput(null)}
         />
      )}

      {/* TALLY MODE */}
      {isTallyOpen && <TallyMode vMixState={vMixState} onExit={() => setIsTallyOpen(false)} />}

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
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Remote / Cloud Connection (VPN)</h3>
                <p className="text-sm text-gray-300 mb-2">
                  To control vMix over the internet from anywhere in the world, use a Virtual LAN like <strong>Tailscale</strong>, <strong>ZeroTier</strong>, or <strong>Radmin VPN</strong>.
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li>Install your chosen VPN (e.g., Tailscale) on the PC running vMix.</li>
                  <li>Install the same VPN app on the device you want to control from (phone, tablet, laptop).</li>
                  <li>Connect both devices to the same virtual network.</li>
                  <li>Find the virtual IP address of the vMix PC in the VPN app (e.g., <code>100.x.y.z</code> in Tailscale).</li>
                  <li>Enter that virtual IP address with port 8088 (e.g., <code>http://100.x.y.z:8088</code>) into this web controller and click Connect.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Controls & Features</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                  <li>
                    <strong>Views Tabs:</strong> Switch between: DASH, INPUTS, AUDIO, LAYERS, TITLES, OUTPUTS, PTZ, MACROS, COLOR, SCRIPTS, DATA.
                  </li>
                  <li>
                    <strong>Live Streams & Recording:</strong> Top status bar pulses when active. Direct toggles for Master Stream, individual Streams 1-3, Rec, and Ext.
                  </li>
                  <li>
                    <strong>Inputs & DSK:</strong> Click to Preview, click PGM to cut live. Use the mini [1|2|3|4] buttons on each card to set DSK overlays.
                  </li>
                  <li>
                    <strong>Audio Mixer:</strong> Master/Bus routing, live VU meters, Faders, plus live toggles for EQ, Compressor, and Auto-Gain.
                  </li>
                  <li>
                    <strong>Transitions & MultiView:</strong> Use the Digital T-Bar. Set custom Msec durations for Wipe, Cube, Fade. Configure up to 10 sub-layers inside the Layers tab.
                  </li>
                  <li>
                    <strong>Image & Position:</strong> Adjust Lift, Gamma, Gain, and Virtual PTZ (Zoom/Pan X/Y) in the Color tab.
                  </li>
                  <li>
                    <strong>Social & Data:</strong> Control vMix Social queues and database rows (NextRow/PrevRow) from the Data tab.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Приложение и Установка (Установка на ПК / Телефон)</h3>
                <div className="text-sm text-gray-300 space-y-4">
                  <div>
                    <strong className="text-orange-300 font-semibold block mb-1">1. Как запустить на компьютере ОФФЛАЙН (локально):</strong>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">
                      Приложение полностью оптимизировано для работы напрямую из локальной папки на компьютере. Оно больше не требует локального сервера и не вызывает блокировок CORS (эффект белого экрана исправлен!).
                    </p>

                    {/* Troubleshooting dynamic __cookie_check tip */}
                    <div className="bg-amber-900/10 border border-amber-800/30 p-3 rounded text-xs text-amber-200/90 leading-relaxed mb-3">
                      <strong className="text-amber-400 block mb-1">⚠️ Если скачивается файл «__cookie_check» вместо ZIP или HTML:</strong>
                      Это происходит из-за того, что браузер блокирует скачивание файлов внутри встроенного превью-окна (iframe) Google AI Studio. Чтобы скачать файлы без проблем:
                      <ol className="list-decimal list-inside mt-1.5 space-y-1">
                        <li>Нажмите кнопку <strong className="text-white">“Открыть в новой вкладке”</strong> (стрелочка в правом верхнем углу экрана).</li>
                        <li>На новой вкладке скачивание сработает мгновенно и правильно!</li>
                        <li>Или используйте кнопку <strong className="text-white">«Скопировать код»</strong> ниже – это работает всегда и везде!</li>
                      </ol>
                    </div>

                    <div className="bg-[#111] p-3 rounded border border-[#333] mb-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
                        <div>
                          <strong className="text-white text-xs block">Скачать готовый ZIP-архив:</strong>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-sans leading-relaxed">
                            Полный комплект (PWA, манифест, иконки PWA + файл index.html). Скачайте ZIP, полностью распакуйте его и кликните дважды по <code className="text-white">index.html</code>.
                          </p>
                        </div>
                        <button
                          onClick={() => secureDownload('vmix-app.zip', './vmix-app.zip', setDownloadingZip)}
                          disabled={downloadingZip}
                          className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:text-gray-400 text-white font-bold text-xs px-4 py-2 rounded uppercase text-center transition-colors shrink-0 flex items-center justify-center min-w-[140px]"
                        >
                          {downloadingZip ? 'Скачивание...' : 'Скачать ZIP'}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
                        <div>
                          <strong className="text-white text-xs block">Скачать только один файл App (HTML):</strong>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-sans leading-relaxed">
                            Удобный запуск в один клик. Так как приложение полностью самодостаточное, вы можете скачать один-единственный файл <code className="text-white">index.html</code> и запускать его на ПК из любого места.
                          </p>
                        </div>
                        <button
                          onClick={() => secureDownload('index.html', './index-compiled.html', setDownloadingHtml)}
                          disabled={downloadingHtml}
                          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] disabled:text-gray-500 text-white font-bold text-xs px-4 py-2 rounded uppercase text-center transition-colors shrink-0 flex items-center justify-center min-w-[140px]"
                        >
                          {downloadingHtml ? 'Скачивание...' : 'Скачать HTML'}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <strong className="text-white text-xs block">Альтернатива (Скопировать весь код в 1 клик):</strong>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-sans leading-relaxed">
                            Если встроенное скачивание блокируется Вашим браузером, просто нажмите кнопку справа, затем создайте у себя на ПК пустой текстовый файл, переименуйте в <code className="text-white">index.html</code>, откройте блокнотом и вставьте скопированный код!
                          </p>
                        </div>
                        <button
                          onClick={handleCopyHtml}
                          disabled={copyStatus === 'loading'}
                          className="bg-[#1f2937] hover:bg-[#374151] border border-gray-600 disabled:text-gray-500 text-white font-bold text-xs px-4 py-2 rounded uppercase text-center transition-colors shrink-0 flex items-center justify-center min-w-[140px]"
                        >
                          {copyStatus === 'loading' && 'Копирование...'}
                          {copyStatus === 'idle' && 'Скопировать код'}
                          {copyStatus === 'success' && 'Скопировано! 👍'}
                          {copyStatus === 'error' && 'Ошибка копирования'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <strong className="text-orange-300 font-semibold block mb-1">2. Как установить на телефон (как отдельное PWA-приложение):</strong>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Вы можете установить приложение на мобильный телефон прямо через браузер. Оно будет запускаться на весь экран, иметь собственный ярлык в меню приложений и работать оффлайн:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-xs text-gray-400 space-y-1">
                       <li><strong>Android (через Chrome):</strong> Откройте сайт, нажмите на значок меню (три точки справа сверху) и выберите пункт <strong>«Добавить на главный экран»</strong> или <strong>«Установить приложение»</strong>.</li>
                       <li><strong>iOS / iPhone (через Safari):</strong> Откройте сайт, нажмите на кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх внизу экрана) и выберите пункт <strong>«На экран "Домой"»</strong>.</li>
                    </ul>
                  </div>

                </div>
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
          <button onClick={() => setIsTallyOpen(true)} className="px-2 py-0.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 font-bold transition-colors rounded cursor-pointer border border-red-900 flex items-center gap-1 uppercase tracking-wider">
            TALLY
          </button>
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

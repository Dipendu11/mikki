import { useState } from 'react';
import { useLiveSession } from './lib/use-live-session';
import { Orb } from './components/Orb';
import { Power, PowerOff, Globe, Wifi, WifiOff, AlertCircle, Terminal, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default function App() {
  const { status, start, stop, modelVolume, userVolume } = useLiveSession(GEMINI_API_KEY);
  const [isPowerOn, setIsPowerOn] = useState(false);

  const togglePower = async () => {
    if (isPowerOn) {
      stop();
      setIsPowerOn(false);
    } else {
      setIsPowerOn(true);
      try {
        await start();
      } catch (err) {
        console.error("Failed to start session", err);
        setIsPowerOn(false);
      }
    }
  };

  return (
    <div className="w-full h-screen bg-[#050507] text-[#e5e7eb] font-sans flex flex-col items-center justify-between p-10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-magenta-900/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-start z-10">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold tracking-tight mt-1 text-[#FF007A]">Mikki</h2>
        </div>
      </div>

      {/* Central Interface (The Orb) */}
      <div className="flex flex-col items-center justify-center flex-1 w-full translate-y-[-20px]">
        <Orb status={status} modelVolume={modelVolume} userVolume={userVolume} />
        
        <div className="mt-12 text-center max-w-xl">
          <AnimatePresence mode="wait">
            {status === 'connected' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-[#FF007A] text-2xl italic font-serif leading-relaxed px-4 text-balance">
                  {modelVolume > 0.05 
                    ? "\"Oh, did I interrupt your silence? My bad, but I'm way more interesting anyway.\""
                    : "\"Don't be shy. I'm listening... though I can't promise I won't judge.\""}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="text-gray-500 uppercase tracking-[0.3em] text-[10px]"
              >
                System Offline · Initialize Module
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status & Tools Bar */}
      <motion.div 
        layout
        className="w-full max-w-lg bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-center gap-4 z-10 shadow-2xl relative"
      >
        <div className="flex space-x-3">
          <button 
            disabled={status !== 'connected'}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[11px] uppercase tracking-wider font-bold transition-all disabled:opacity-30 flex items-center gap-2"
          >
            <MicOff size={14} />
            Mute
          </button>
          
          <button 
            onClick={togglePower}
            className={`px-8 py-3 rounded-full text-[11px] uppercase tracking-widest font-bold shadow-xl transition-all flex items-center gap-2 ${
              isPowerOn 
                ? 'bg-[#FF007A] text-white shadow-[0_0_25px_rgba(255,0,122,0.4)]' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {isPowerOn ? <Power size={14} /> : <PowerOff size={14} />}
            {isPowerOn ? 'Stop Module' : 'Initialize'}
          </button>
        </div>
      </motion.div>

      {/* Bottom Decorative Detail */}
      <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#FF007A]/30 to-transparent absolute bottom-0"></div>

      {/* Error Overlay */}
      {status === 'error' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a0b1c] border border-red-500/20 p-10 rounded-[2rem] max-w-md text-center shadow-3xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500" size={40} />
            </div>
            <h2 className="text-2xl font-light mb-3">Sync Fragmented</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              My witty circuits are having trouble connecting. Double-check your <span className="text-[#FF007A] font-mono">GEMINI_API_KEY</span> or mic permissions.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#FF007A] rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-pink-500/20 active:scale-95 transition-transform"
            >
              Force Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

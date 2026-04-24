import { motion } from 'motion/react';

interface OrbProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  modelVolume: number;
  userVolume: number;
}

export function Orb({ status, modelVolume, userVolume }: OrbProps) {
  // Base size and reactive expansion
  const baseScale = status === 'connecting' ? 1.1 : 1;
  const reactivity = Math.max(modelVolume * 1.8, userVolume * 1.5);
  const scale = baseScale + (status === 'connected' ? reactivity * 0.4 : 0);

  // Elegant Dark themed colors
  const primaryAccent = '#FF007A'; // Magenta
  const secondaryAccent = '#8F00FF'; // Purple

  return (
    <div className="relative flex items-center justify-center w-80 h-80">
      {/* Outer Glow Layers */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: status === 'connected' ? [0.15, 0.25, 0.15] : 0.1
        }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute inset-0 blur-[80px] rounded-full"
        style={{ backgroundColor: primaryAccent }}
      />
      
      <motion.div
        animate={{
          scale: [1.2, 1.3, 1.2],
          opacity: status === 'connecting' ? 0.2 : 0.05
        }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="absolute inset-0 blur-[40px] rounded-full scale-125"
        style={{ backgroundColor: secondaryAccent }}
      />

      {/* Speaking Indicator Ring (Outermost) */}
      <motion.div
        animate={{
          scale: 1.1 + userVolume * 1.5,
          opacity: status === 'connected' ? 0.3 : 0
        }}
        className="absolute -inset-8 border border-white/5 rounded-full"
      />
      
      {/* Speaking Indicator Ring (Inner) */}
      <motion.div
        animate={{
          scale: 1.05 + modelVolume * 1.2,
          opacity: status === 'connected' ? 0.3 : 0
        }}
        className="absolute -inset-4 border border-[#FF007A]/30 rounded-full"
      />

      {/* Main Visualizer Orb */}
      <motion.div
        animate={{
          scale: scale,
          boxShadow: status === 'connected' 
            ? `0 0 ${20 + reactivity * 80}px ${primaryAccent}44`
            : '0 0 20px rgba(0,0,0,0)'
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="relative w-64 h-64 rounded-full overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl"
        style={{
          background: 'linear-gradient(to tr, #050507, #1a0b1c, #3a0d2e)',
        }}
      >
        {/* Waveform Simulation (Reactive Bars) */}
        <div className="flex items-end space-x-2 h-24">
          {[0.4, 0.7, 1.0, 0.5, 0.8, 0.4, 0.2].map((heightMulti, i) => (
            <motion.div
              key={i}
              animate={{
                height: 8 + (modelVolume + userVolume) * 80 * heightMulti,
                opacity: (modelVolume + userVolume) > 0.05 ? 1 : 0.3
              }}
              className={`w-2 rounded-full ${i === 3 ? 'bg-white' : 'bg-[#FF007A]'}`}
              style={{ minHeight: '4px' }}
            />
          ))}
        </div>

        {/* Glossy Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent" />
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './NovaCore.css';

const NovaCore = () => {
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceIntensity, setVoiceIntensity] = useState('low');

  // Simulate voice detection
  useEffect(() => {
    const interval = setInterval(() => {
      setVoiceActive(Math.random() > 0.7);
      const intensity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      setVoiceIntensity(intensity);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="jarvis-interface"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className={`concentric-circles ${voiceActive ? 'voice-speaking' : ''}`}>
        <motion.div 
          className={`outer-ring ${voiceActive ? `voice-${voiceIntensity}` : ''}`}
          animate={{
            boxShadow: voiceActive 
              ? [
                  '0 0 15px rgba(0, 255, 255, 0.9), 0 0 30px rgba(0, 255, 255, 0.7)',
                  '0 0 25px rgba(0, 255, 255, 1), 0 0 50px rgba(0, 255, 255, 0.9)',
                  '0 0 15px rgba(0, 255, 255, 0.9), 0 0 30px rgba(0, 255, 255, 0.7)'
                ]
              : '0 0 15px rgba(0, 255, 255, 0.9), 0 0 30px rgba(0, 255, 255, 0.7)'
          }}
          transition={{ duration: voiceActive ? 1.5 : 0 }}
        />
        
        <motion.div 
          className="inner-ring"
          animate={{
            boxShadow: voiceActive
              ? '0 0 20px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 255, 0.8)'
              : '0 0 10px rgba(255, 255, 255, 0.8)'
          }}
          transition={{ duration: voiceActive ? 1.5 : 0 }}
        />
        
        <motion.h1 
          className={`jarvis-text ${voiceActive ? 'voice-active' : ''}`}
          animate={{
            textShadow: voiceActive
              ? [
                  '0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(0, 200, 255, 0.5)',
                  '0 0 20px rgba(255, 255, 255, 1), 0 0 40px rgba(0, 200, 255, 0.8)',
                  '0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(0, 200, 255, 0.5)'
                ]
              : '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(0, 200, 255, 0.3)'
          }}
          transition={{ duration: voiceActive ? 1.5 : 0 }}
        >
          NOVA
        </motion.h1>
      </div>
    </motion.div>
  );
};

export default NovaCore;

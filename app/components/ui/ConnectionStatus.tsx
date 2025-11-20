import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

export const ConnectionStatus = ({ isConnected, isConnecting = false }: ConnectionStatusProps) => {
  if (isConnected && !isConnecting) {
    return null; // Don't show anything when connected
  }

  return (
    <AnimatePresence>
      {(!isConnected || isConnecting) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xl
            ${isConnecting 
              ? 'bg-amber-500/90 text-white' 
              : 'bg-red-500/90 text-white'
            }
          `}>
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Disconnected</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;

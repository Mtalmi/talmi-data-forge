import { useState } from 'react';
import { Bot, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AIChatPanel } from './AIChatPanel';
import { useAIChat } from '@/hooks/useAIChat';

export function AIFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const chat = useAIChat();

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center"
            aria-label="Ouvrir l'assistant AI"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-2 z-50 md:bottom-6 md:right-6 w-[calc(100vw-1rem)] max-w-md h-[70vh] max-h-[600px] rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">TBOS AI</p>
                  <p className="text-[10px] text-muted-foreground">Co-pilote intelligent</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsOpen(false); navigate('/ai'); }}
                  className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors"
                  title="Plein écran"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AIChatPanel chat={chat} compact />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

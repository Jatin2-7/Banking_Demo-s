import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon({ size = 16, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" fill={color} />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3M9 21h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SearchBar({ onMicTap, isListening, placeholder }) {
  return (
    <div className="px-4 -mt-6 relative z-10">
      <div className="bg-white rounded-2xl border border-divider shadow-card flex items-center h-12 pl-4 pr-1.5 gap-3">
        <SearchIcon />
        <input
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted truncate"
          placeholder={placeholder || 'Search or tap mic to speak'}
          readOnly
          onClick={onMicTap}
        />
        <motion.button
          type="button"
          onClick={onMicTap}
          whileTap={{ scale: 0.92 }}
          className="relative w-9 h-9 rounded-full flex items-center justify-center"
          animate={{
            backgroundColor: isListening ? '#FF6B00' : '#1A237E',
            boxShadow: isListening
              ? '0 0 0 0 rgba(255, 107, 0, 0.0)'
              : '0 4px 12px rgba(26, 35, 126, 0.25)',
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          aria-label="Start voice input"
        >
          <AnimatePresence>
            {isListening && (
              <motion.span
                key="ring"
                initial={{ scale: 1, opacity: 0.55 }}
                animate={{ scale: 1.7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full"
                style={{ background: '#FF6B00' }}
              />
            )}
          </AnimatePresence>
          <motion.div
            animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{
              duration: 1.0,
              repeat: isListening ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className="relative z-10"
          >
            <MicIcon />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

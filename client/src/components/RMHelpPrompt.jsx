import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Bottom-sheet popup that appears when frustration is detected.
 * Props:
 *   open       — boolean
 *   onHelp()   — user tapped "Yes, help me"
 *   onDismiss()— user tapped "No, thanks"
 */
export default function RMHelpPrompt({ open, onHelp, onDismiss }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="rm-backdrop"
          className="absolute inset-0 z-[95] flex items-end"
          style={{ background: 'rgba(10,31,61,0.55)', borderRadius: 'inherit' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            key="rm-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-white px-5 pb-8 pt-4 shadow-2xl"
          >
            {/* drag pill */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

            {/* icon + heading */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a3d62]/10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#0a3d62" />
                  <path
                    d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
                    stroke="#0a3d62"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="19" cy="5" r="3" fill="#f5a623" />
                  <path
                    d="M19 4v2M19 7h.01"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">Need a little help?</p>
                <p className="text-[12px] text-slate-500">
                  Your RM assistant can fill this for you.
                </p>
              </div>
            </div>

            {/* tagline */}
            <p className="mb-5 rounded-xl bg-[#0a3d62]/5 px-3 py-2.5 text-[12px] leading-relaxed text-slate-700">
              Looks like you hit a snag. Want me to take over and guide you through this step by
              step — just speak or type?
            </p>

            {/* actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onHelp}
                className="flex-1 rounded-xl bg-[#0a3d62] py-3 text-[13px] font-bold text-white press shadow-md"
              >
                ✦ Yes, help me
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-600 press"
              >
                No, thanks
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

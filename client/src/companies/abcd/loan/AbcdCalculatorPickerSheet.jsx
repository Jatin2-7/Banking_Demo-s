import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbcdCalculatorPickerSheet({ open, onClose, onPickEmi, onPickAmount }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[70] flex items-end bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full rounded-t-[24px] bg-white px-4 pb-6 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D1D5DB]" />
            <h2 className="text-center text-[16px] font-bold text-[#1A1A1A]">Our calculators</h2>
            <p className="mt-1 text-center text-[12px] text-[#6B7280]">
              Select a calculator you would like to proceed with
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={onPickEmi}
                className="rounded-2xl bg-[#F5F5F5] px-3 py-4 press"
              >
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center text-[36px]">📅</div>
                <p className="text-center text-[12px] font-semibold text-[#374151]">EMI calculator</p>
              </button>
              <button
                type="button"
                onClick={onPickAmount}
                className="rounded-2xl bg-[#F5F5F5] px-3 py-4 press"
              >
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center text-[36px]">🪙</div>
                <p className="text-center text-[12px] font-semibold text-[#374151]">Loan amount calculator</p>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

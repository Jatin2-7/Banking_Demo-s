import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrangeButton } from './IncredFormFields.jsx';
import { INCRED } from '../theme.js';

export default function IncredConfirmModal({
  open,
  title,
  subtitle,
  rows,
  checkboxes,
  onClose,
  onEdit,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-5 no-scrollbar"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-incred-ink">{title}</h2>
                {subtitle && (
                  <p className="mt-1 text-[13px] font-semibold text-incred-ink">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="press text-incred-muted"
                aria-label="Close"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {rows?.length > 0 && (
              <div className="mb-4 rounded-xl border border-incred-border p-4">
                {rows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 py-1.5 text-[13px]">
                    <span className="text-incred-muted">{row.label}</span>
                    <span className="text-right font-bold text-incred-ink">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {checkboxes?.length > 0 && (
              <div className="mb-5 space-y-3">
                {checkboxes.map((cb) => (
                  <label key={cb.id} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm"
                      style={{
                        backgroundColor: cb.checked ? INCRED.orange : 'white',
                        border: cb.checked ? 'none' : `2px solid ${INCRED.border}`,
                      }}
                    >
                      {cb.checked && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[12px] leading-snug text-incred-ink">{cb.label}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <OrangeButton outline onClick={onEdit} className="flex-1">
                Edit details
              </OrangeButton>
              <OrangeButton onClick={onConfirm} className="flex-1">
                Yes, proceed
              </OrangeButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

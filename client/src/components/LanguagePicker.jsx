import React from 'react';
import { motion } from 'framer-motion';
import { LANGUAGES } from '../data/languages';

export default function LanguagePicker({ value, onChange, disabled, variant = 'overlay' }) {
  const isOverlay = variant === 'overlay';
  return (
    <div className={'flex items-center justify-center gap-2 ' + (isOverlay ? 'mt-2' : '')}>
      {LANGUAGES.map((lang) => {
        const active = value === lang.code;
        return (
          <motion.button
            key={lang.code}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(lang.code)}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className={
              'px-3 h-8 rounded-full text-[12px] font-semibold transition-colors ' +
              (isOverlay
                ? active
                  ? 'bg-accent text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
                : active
                  ? 'bg-brand text-white'
                  : 'bg-page text-muted border border-divider')
            }
            aria-pressed={active}
            title={lang.label}
          >
            {lang.label}
          </motion.button>
        );
      })}
    </div>
  );
}

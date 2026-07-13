import React from 'react';

/** Full-viewport shell for standalone web demos (no phone frame, no card wrapper). */
export default function StandaloneWebShell({ children }) {
  return <div className="min-h-screen w-full">{children}</div>;
}

import React from 'react';
import PhoneFrame from '../components/PhoneFrame.jsx';

/** Mobile app shell — phone bezel + status bar. */
export default function MobileShell({ children, overlay }) {
  return <PhoneFrame overlay={overlay}>{children}</PhoneFrame>;
}

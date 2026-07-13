import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SIZE = 56;
const EDGE = 12;
const DRAG_THRESHOLD = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readStoredPosition(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Draggable voice-assistant FAB. Tap opens; drag repositions anywhere on screen.
 * Position persists in localStorage per storageKey.
 */
export default function DraggableVoiceFab({
  onClick,
  storageKey = 'voice-fab-position',
  size = DEFAULT_SIZE,
  className = '',
}) {
  const fabRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const defaultPosition = useCallback(() => {
    return {
      x: window.innerWidth - size - 24,
      y: window.innerHeight - size - 24,
    };
  }, [size]);

  const [pos, setPos] = useState(() => readStoredPosition(storageKey));
  const [dragging, setDragging] = useState(false);

  const resolvedPos = pos ?? defaultPosition();

  const persist = useCallback(
    (next) => {
      setPos(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => {
        const p = prev ?? defaultPosition();
        return {
          x: clamp(p.x, EDGE, window.innerWidth - size - EDGE),
          y: clamp(p.y, EDGE, window.innerHeight - size - EDGE),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [defaultPosition, size]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    setDragging(true);
    fabRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }
    const next = {
      x: clamp(dragRef.current.originX + dx, EDGE, window.innerWidth - size - EDGE),
      y: clamp(dragRef.current.originY + dy, EDGE, window.innerHeight - size - EDGE),
    };
    setPos(next);
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.active) return;
    fabRef.current?.releasePointerCapture(e.pointerId);
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    setDragging(false);

    if (wasDrag) {
      const rect = fabRef.current?.getBoundingClientRect();
      if (rect) persist({ x: rect.left, y: rect.top });
    } else {
      onClick?.();
    }
  };

  const onPointerCancel = () => {
    dragRef.current.active = false;
    dragRef.current.moved = false;
    setDragging(false);
  };

  return (
    <button
      ref={fabRef}
      type="button"
      data-ai-fab
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`fixed z-[200] touch-none select-none overflow-hidden rounded-full border-2 border-white bg-[#004b70] shadow-[0_8px_28px_rgba(0,0,0,0.22)] transition-shadow hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)] active:shadow-[0_6px_20px_rgba(0,0,0,0.2)] ${className}`}
      style={{
        width: size,
        height: size,
        left: resolvedPos.x,
        top: resolvedPos.y,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      aria-label="Open AI Assistant — drag to move"
      title="AI Assistant (drag to reposition)"
    >
      <img
        src="/silversuits-logo.png"
        alt="Silversuits AI"
        className="pointer-events-none h-full w-full object-cover"
        draggable={false}
      />
    </button>
  );
}

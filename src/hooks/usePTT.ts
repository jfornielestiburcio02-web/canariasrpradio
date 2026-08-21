
'use client';

import { useEffect, useState, useCallback } from 'react';

export function usePTT(onToggle: (enabled: boolean) => void) {
  const [isTransmitting, setIsTransmitting] = useState(false);

  const start = useCallback(() => {
    if (!isTransmitting) {
      setIsTransmitting(true);
      onToggle(true);
    }
  }, [isTransmitting, onToggle]);

  const stop = useCallback(() => {
    if (isTransmitting) {
      setIsTransmitting(false);
      onToggle(false);
    }
  }, [isTransmitting, onToggle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        start();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [start, stop]);

  return { isTransmitting, start, stop };
}

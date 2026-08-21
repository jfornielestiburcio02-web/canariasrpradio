
'use client';

import { useEffect, useState, useCallback } from 'react';

interface UsePTTOptions {
  disabled?: boolean;
}

export function usePTT(onToggle: (enabled: boolean) => void, options: UsePTTOptions = {}) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const { disabled = false } = options;

  const start = useCallback(() => {
    if (!isTransmitting && !disabled) {
      setIsTransmitting(true);
      onToggle(true);
    }
  }, [isTransmitting, onToggle, disabled]);

  const stop = useCallback(() => {
    if (isTransmitting) {
      setIsTransmitting(false);
      onToggle(false);
    }
  }, [isTransmitting, onToggle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar activar si el foco está en un input o si está desactivado
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
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
  }, [start, stop, disabled]);

  // Si se desactiva mientras se transmite, forzar el stop
  useEffect(() => {
    if (disabled && isTransmitting) {
      stop();
    }
  }, [disabled, isTransmitting, stop]);

  return { isTransmitting, start, stop };
}

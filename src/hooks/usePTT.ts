'use client';

import { useEffect, useState, useCallback } from 'react';

interface UsePTTOptions {
  disabled?: boolean;
}

export function usePTT(onToggle: (enabled: boolean) => void, options: UsePTTOptions = {}) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const { disabled = false } = options;

  const start = useCallback(() => {
    if (disabled) {
      console.warn('[PTT] Bloqueado: el usuario no se encuentra en un canal activo.');
      return;
    }
    if (!isTransmitting) {
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

  // Si se desactiva mientras se transmite (ej: sale del canal), forzar el stop
  useEffect(() => {
    if (disabled && isTransmitting) {
      console.log('[PTT] Forzando detención por desactivación de canal');
      stop();
    }
  }, [disabled, isTransmitting, stop]);

  return { isTransmitting, start, stop };
}

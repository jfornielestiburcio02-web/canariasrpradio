'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UsePTTOptions {
  disabled?: boolean;
  pttKey?: string;
  isMobile?: boolean;
}

export function usePTT(onToggle: (enabled: boolean) => void, options: UsePTTOptions = {}) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const { disabled = false, pttKey = 'Space', isMobile = false } = options;
  const isTransmittingRef = useRef(false);

  const start = useCallback(() => {
    if (disabled) return;
    if (!isTransmittingRef.current) {
      isTransmittingRef.current = true;
      setIsTransmitting(true);
      onToggle(true);
    }
  }, [disabled, onToggle]);

  const stop = useCallback(() => {
    if (isTransmittingRef.current) {
      isTransmittingRef.current = false;
      setIsTransmitting(false);
      onToggle(false);
    }
  }, [onToggle]);

  const toggle = useCallback(() => {
    if (disabled) return;
    if (isTransmittingRef.current) {
      stop();
    } else {
      start();
    }
  }, [disabled, start, stop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isMobile) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Comprobar si la tecla coincide con el código configurado
      if (e.code === pttKey) {
        e.preventDefault();
        start();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (disabled || isMobile) return;
      if (e.code === pttKey) {
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
  }, [start, stop, disabled, pttKey, isMobile]);

  useEffect(() => {
    if (disabled && isTransmitting) {
      stop();
    }
  }, [disabled, isTransmitting, stop]);

  return { isTransmitting, start, stop, toggle };
}

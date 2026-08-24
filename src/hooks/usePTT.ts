
'use client';

import { useEffect, useCallback } from 'react';

interface UsePTTOptions {
  disabled?: boolean;
  pttKey?: string;
  isMobile?: boolean;
}

/**
 * Adaptado para funcionar como conmutador de MUTE (Voz Abierta)
 */
export function usePTT(onToggle: () => void, options: UsePTTOptions = {}) {
  const { disabled = false, pttKey = 'Space', isMobile = false } = options;

  const toggle = useCallback(() => {
    if (disabled) return;
    onToggle();
  }, [disabled, onToggle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isMobile) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Tecla configurada para conmutar MUTE
      if (e.code === pttKey) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggle, disabled, pttKey, isMobile]);

  return { toggle };
}

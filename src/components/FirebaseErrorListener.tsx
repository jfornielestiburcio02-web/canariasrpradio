
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, Next.js will show the error overlay for uncaught errors
      // In production, we surface a toast for security issues
      if (process.env.NODE_ENV === 'production') {
        toast({
          variant: 'destructive',
          title: 'Error de Permisos',
          description: `No tienes autorización para realizar esta acción en: ${error.context.path}`,
        });
      } else {
        // Let it bubble up to the dev overlay
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}

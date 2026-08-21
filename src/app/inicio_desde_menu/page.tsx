
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Suspense } from 'react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {code ? (
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <div className="rounded-full bg-red-500/10 p-3">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {code ? "Autenticación recibida" : "Error de autenticación"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {code 
              ? "El código de autorización de Discord ha sido recibido correctamente."
              : "No se ha detectado ningún código de autorización de Discord."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>}>
      <CallbackContent />
    </Suspense>
  );
}

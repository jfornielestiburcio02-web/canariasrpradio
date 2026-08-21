
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const DISCORD_URL = "https://discord.com/oauth2/authorize?client_id=1534483909830512730&response_type=code&redirect_uri=https%3A%2F%2F6000-firebase-studio-1776271662955.cluster-cbeiita7rbe7iuwhvjs5zww2i.cloudworkstations.dev%2Finicio_desde_menu&integration_type=0&scope=identify+applications.commands+guilds.members.read";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Aplicación</CardTitle>
          <p className="text-sm text-muted-foreground">Iniciar sesión</p>
        </CardHeader>
        <CardContent>
          <Button 
            asChild
            className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02]"
          >
            <Link href={DISCORD_URL}>
              Continuar con Discord
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

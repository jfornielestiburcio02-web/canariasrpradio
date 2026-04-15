
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSessionUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HookGenerator } from '@/components/HookGenerator';
import { User, LogOut, Compass, ScrollText, Users, MessageSquare } from 'lucide-react';

export default async function TablonPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-primary text-primary-foreground p-6 flex flex-col gap-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-8 w-8 text-accent" />
          <h1 className="font-headline text-2xl font-bold">Tablón</h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/tablon" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 text-accent hover:bg-white/20 transition-all font-medium">
            <User className="h-5 w-5" /> Perfil de Marino
          </Link>
          <Link href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all font-medium">
            <ScrollText className="h-5 w-5" /> Tablón de Misiones
          </Link>
          <Link href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all font-medium">
            <Users className="h-5 w-5" /> Tu Tripulación
          </Link>
          <Link href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all font-medium">
            <MessageSquare className="h-5 w-5" /> Mensajería
          </Link>
        </nav>

        <Button asChild variant="ghost" className="justify-start hover:bg-red-500/10 hover:text-red-400 mt-auto">
          <Link href="/api/auth/logout" className="flex items-center gap-3">
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </Link>
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 space-y-8 overflow-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-primary/10">
          <div>
            <h2 className="font-headline text-4xl font-bold text-primary">Bienvenido a Puerto, {user.username}</h2>
            <p className="text-muted-foreground mt-1">Aquí tienes un resumen de tu actividad y herramientas creativas.</p>
          </div>
          
          <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-primary/5">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-accent">
              <Image 
                src={avatarUrl}
                alt={user.username}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-primary leading-none">{user.username}</span>
              <span className="text-xs text-muted-foreground">ID: {user.id}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-primary/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estado del Barco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">Excelente</div>
                  <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[92%]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-primary/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Doblones de Oro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">1,240 🪙</div>
                  <p className="text-xs text-green-600 mt-1">+120 hoy</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Desembarco en el Puerto de Santa María", time: "Hace 2 horas" },
                  { title: "Comercio de especias completado", time: "Hace 5 horas" },
                  { title: "Nuevo mensaje de la Capitanía", time: "Hace 1 día" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/20 transition-colors border border-transparent hover:border-secondary">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-primary/20'}`} />
                      <div>
                        <p className="font-medium text-primary">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <HookGenerator />
            
            <Card className="bg-accent/5 border-dashed border-accent/40">
              <CardHeader>
                <CardTitle className="text-lg text-primary">¿Necesitas Ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta nuestra wiki para entender mejor las mecánicas de rol y la historia de Cádiz.
                </p>
                <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-white">
                  Leer Lore
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

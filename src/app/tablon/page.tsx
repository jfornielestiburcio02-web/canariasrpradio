
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSessionUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HookGenerator } from '@/components/HookGenerator';
import { 
  LogOut, 
  LayoutGrid, 
  Landmark, 
  ShieldAlert, 
  Car, 
  Crosshair, 
  Hash, 
  Package, 
  Store, 
  ShoppingCart,
  Search
} from 'lucide-react';

export default async function TablonPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;

  const logoUrl = "https://cdn.discordapp.com/icons/1480317681650634943/4dc12935de036824ab5bd7fb93f82a77.webp?size=128&quality=lossless";

  const menuItems = [
    { label: 'MI PANEL', icon: LayoutGrid, active: true },
    { label: 'BANCO', icon: Landmark },
    { label: 'MULTAS', icon: ShieldAlert },
    { label: 'VEHÍCULOS', icon: Car },
    { label: 'ARMAS', icon: Crosshair },
    { label: 'INSTAPIC', icon: Hash },
    { label: 'INVENTARIO', icon: Package },
    { label: 'MERCADO', icon: Store },
    { label: 'TIENDA', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-body">
      {/* Sidebar based on Screenshot */}
      <aside className="w-full md:w-72 bg-white flex flex-col border-r border-slate-200">
        <div className="p-8 pb-4">
          <div className="flex flex-col mb-8">
            <h1 className="text-4xl font-bold text-primary tracking-widest leading-none">CADIZ RP</h1>
            <p className="text-[10px] tracking-[0.3em] text-slate-400 font-bold mt-1">PANEL DE GESTIONES</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 mb-4 px-3">CIUDADANO</p>
              <nav className="flex flex-col gap-1">
                {menuItems.map((item) => (
                  <Link 
                    key={item.label}
                    href="#" 
                    className={`flex items-center gap-4 px-4 py-3 rounded-md transition-all group relative ${
                      item.active 
                      ? 'bg-blue-50/50 text-sky-600 border-l-4 border-sky-600' 
                      : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${item.active ? 'text-sky-600' : 'text-slate-600'}`} />
                    <span className="text-xs font-bold tracking-wider">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-auto p-8 pt-0">
          <Button asChild variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 px-4">
            <Link href="/api/auth/logout" className="flex items-center gap-3">
              <LogOut className="h-5 w-5" /> <span className="text-xs font-bold uppercase tracking-widest">Salir del Puerto</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header/Search Bar like Windows style in screenshot */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 w-96 bg-slate-100 rounded-md px-4 py-2">
            <Search className="h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-700 leading-none">{user.username}</span>
              <span className="text-[10px] text-slate-400 mt-1">Marino ID: {user.id.substring(0, 8)}</span>
            </div>
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
              <Image 
                src={avatarUrl}
                alt={user.username}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md">
                <Image src={logoUrl} alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Mi Panel Personal</h2>
                <p className="text-sm text-slate-400">Bienvenido de nuevo a las costas de Cádiz.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                  <div className="h-1 bg-sky-600 w-full" />
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo Disponible</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800">1,240 <span className="text-slate-300">🪙</span></div>
                    <p className="text-xs text-green-500 mt-1 font-bold">+120 de la última travesía</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                  <div className="h-1 bg-orange-400 w-full" />
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado de Salud</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800">92%</div>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 w-[92%]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <HookGenerator />
            </div>

            <div className="lg:col-span-1 space-y-8">
              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Notificaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { text: "Licencia de armas renovada", time: "Hace 1h" },
                    { text: "Multa de tráfico pagada", time: "Hace 3h" },
                    { text: "Nuevo vehículo registrado", time: "Ayer" }
                  ].map((notif, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100 items-center">
                      <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">{notif.text}</p>
                        <p className="text-[10px] text-slate-400">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Search,
  AlertTriangle
} from 'lucide-react';
import { WarnsSection } from '@/components/tablon/WarnsSection';

export default function TablonPage() {
  const { user, loading: authLoading } = useUser();
  const [activeTab, setActiveTab] = useState('MI PANEL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) return null;
  if (!user) {
    window.location.href = '/api/auth/login';
    return null;
  }

  const avatarUrl = user.photoURL 
    ? user.photoURL
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.uid.slice(-1)) % 5}.png`;

  const logoUrl = "https://cdn.discordapp.com/icons/1480317681650634943/4dc12935de036824ab5bd7fb93f82a77.webp?size=128&quality=lossless";

  const menuItems = [
    { label: 'MI PANEL', icon: LayoutGrid },
    { label: 'BANCO', icon: Landmark },
    { label: 'MULTAS', icon: ShieldAlert },
    { label: 'WARNS', icon: AlertTriangle },
    { label: 'VEHÍCULOS', icon: Car },
    { label: 'ARMAS', icon: Crosshair },
    { label: 'INSTAPIC', icon: Hash },
    { label: 'INVENTARIO', icon: Package },
    { label: 'MERCADO', icon: Store },
    { label: 'TIENDA', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-body overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-white flex flex-col border-r border-slate-200 shrink-0">
        <div className="p-6 pb-4">
          <div className="flex flex-col mb-6">
            <h1 className="text-3xl font-bold text-primary tracking-widest leading-none">CADIZ RP</h1>
            <p className="text-[9px] tracking-[0.3em] text-slate-400 font-bold mt-1 uppercase">Panel de gestión</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 mb-3 px-2">CIUDADANO</p>
              <nav className="flex flex-col gap-0.5">
                {menuItems.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => setActiveTab(item.label)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative w-full text-left ${
                      activeTab === item.label 
                      ? 'bg-blue-50/50 text-sky-600 border-l-4 border-sky-600' 
                      : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${activeTab === item.label ? 'text-sky-600' : 'text-slate-600'}`} />
                    <span className="text-[11px] font-bold tracking-wider">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 pt-0">
          <Button asChild variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 px-3">
            <Link href="/api/auth/logout" className="flex items-center gap-3">
              <LogOut className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase tracking-widest">Salir</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header/Search Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 w-72 md:w-96 bg-slate-100 rounded-md px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar gestiones..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-slate-700 leading-none">{user.displayName || 'Ciudadano'}</span>
              <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">ID: {user.uid.substring(0, 8)}</span>
            </div>
            <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
              <Image 
                src={avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/50">
          {activeTab === 'MI PANEL' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden shadow-md">
                    <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Panel Personal</h2>
                    <p className="text-xs text-slate-400">Estado actual y herramientas de navegación.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                      <div className="h-1 bg-sky-600 w-full" />
                      <CardHeader className="p-4 pb-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Efectivo</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-800">0 <span className="text-slate-300">🪙</span></div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Sin actividad reciente</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                      <div className="h-1 bg-orange-400 w-full" />
                      <CardHeader className="p-4 pb-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salud</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-800">100%</div>
                        <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 w-[100%]" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                      <div className="h-1 bg-emerald-500 w-full" />
                      <CardHeader className="p-4 pb-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Travesías</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-800">0</div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Rango: Recluta</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white border-none shadow-sm rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-slate-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-700">Sin datos de actividad</h3>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto">Comienza tu aventura en Cádiz para ver tus estadísticas y progresos aquí.</p>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <Card className="bg-white border-none shadow-sm rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notificaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="text-center py-8">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No hay avisos</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {activeTab === 'WARNS' && (
            <WarnsSection userId={user.uid} />
          )}

          {activeTab !== 'MI PANEL' && activeTab !== 'WARNS' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <Package className="h-12 w-12 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-widest">{activeTab}</h3>
                <p className="text-xs text-slate-400">Esta sección estará disponible próximamente.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

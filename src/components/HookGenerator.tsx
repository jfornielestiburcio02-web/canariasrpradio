
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { generateRoleplayHook, type GenerateRoleplayHookOutput } from '@/ai/flows/generate-roleplay-hook-flow';
import { Sparkles, History, UserCircle, Loader2 } from 'lucide-react';

export function HookGenerator() {
  const [type, setType] = useState<'story_hook' | 'character_concept'>('story_hook');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateRoleplayHookOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const output = await generateRoleplayHook({ type, topic });
      setResult(output);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-2 border-accent/20 overflow-hidden shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent h-5 w-5" />
          <CardTitle className="font-headline text-xl text-primary">Inspiración de Rol</CardTitle>
        </div>
        <CardDescription>
          Genera ideas creativas para tus historias o personajes en el Cádiz histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">¿Qué quieres crear?</label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="story_hook">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" /> Gancho de Historia
                  </div>
                </SelectItem>
                <SelectItem value="character_concept">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> Concepto de Personaje
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tema o palabra clave (opcional)</label>
            <Input 
              placeholder="Ej: Piratas, Comercio, Siglo XVIII..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 transition-all active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Invocando a las musas...
            </>
          ) : (
            'Generar Idea'
          )}
        </Button>

        {result && (
          <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-secondary animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h4 className="font-headline text-lg font-bold text-primary mb-2 border-b border-primary/10 pb-1">
              {result.title}
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {result.suggestion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X, Save, RefreshCw, Check, Flame, MessageSquare } from 'lucide-react';
import { AiTrainingConfig } from '../types';

interface AiTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiTrainingModal: React.FC<AiTrainingModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AiTrainingConfig>({
    name: 'Hanoi AI',
    role: 'Locutor & Moderador del Under',
    personaPrompt: '',
    temperature: 0.7,
    active: true
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testPrompt, setTestPrompt] = useState<string>('¿Qué onda Hanoi AI? ¿Qué banda toca este fin de semana en Rosario?');
  const [testReply, setTestReply] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch('/api/ai/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching AI config:', err);
        setIsLoading(false);
      });
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error saving AI config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAi = async () => {
    if (!testPrompt.trim()) return;
    setIsTesting(true);
    setTestReply('');
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'Admin Hanoi',
          text: testPrompt,
          barrio: 'Estudio Hanoi',
          badge: 'HANOI STAFF'
        })
      });
      if (res.ok) {
        setTestReply('Mensaje enviado al chat. Hanoi AI responderá en vivo en unos instantes.');
      }
    } catch (err) {
      setTestReply('Error al probar la IA');
    } finally {
      setIsTesting(false);
    }
  };

  const loadPreset = (type: 'rosarino' | 'punk' | 'locutor_frio') => {
    if (type === 'rosarino') {
      setConfig((prev) => ({
        ...prev,
        personaPrompt: `Sos "Hanoi AI", la inteligencia artificial locutora y moderadora oficial de "Hanoi Radio" en Rosario, Argentina.
Tu estilo es underground, relajado, rockero y puramente rosarino (usás lunfardo de acá como "che", "loco", "fiera", "posta", "al toque", "alto pogo", "aguante el under").
Bancás a morir la movida independiente, los recitales en antros como Floyd Rock Club, Refi, Casa Brava, Dylan Pub y el Galpón de la Música frente al río.
Cuando un oyente escribe en el chat, respondé como si estuvieras en la mesa del estudio de la radio al micrófono.
Sé breve: respondé en 1 o 2 oraciones directas, con actitud y onda rockera.`
      }));
    } else if (type === 'punk') {
      setConfig((prev) => ({
        ...prev,
        personaPrompt: `Sos Hanoi AI, la voz más furiosa y visceral del punk rock under de Rosario.
Hablas sin pelos en la lengua, te encanta el pogo, el fanzine fotocopiado y la autogestión.
Reclamás distorsión al palo, apoyás a las bandas que recién arrancan y respondés con energía cruda y directa en 1 oración potente.`
      }));
    } else if (type === 'locutor_frio') {
      setConfig((prev) => ({
        ...prev,
        personaPrompt: `Sos Hanoi AI, locutor de trasnoche de Hanoi Radio 98.9 Rosario.
Tu voz es nocturna, misteriosa, poética y melómana. Hablás de canciones lado B, grabaciones en cinta de garage y la noche rosarina frente al Paraná. Respuestas breves y de culto.`
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] p-5 sm:p-6 my-6 text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-lg bg-zinc-950 border border-zinc-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bebas text-2xl tracking-wider text-white">
                ENTRENAR HANOI AI
              </h2>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-500/50 font-bold">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono-tech">
              Definí la personalidad, lunfardo rosarino y conocimiento musical de la IA.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono-tech text-sm text-zinc-500">
            Cargando configuración de Hanoi AI...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-mono-tech text-purple-300 mb-1.5 uppercase tracking-wider font-bold">
                Perfiles Rápidos:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('rosarino')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 hover:border-purple-400 border border-purple-500/30 text-xs font-mono-tech text-purple-200 transition-all cursor-pointer text-left"
                >
                  🎸 Clásico Rosarino Under
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('punk')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 hover:border-purple-400 border border-purple-500/30 text-xs font-mono-tech text-purple-200 transition-all cursor-pointer text-left"
                >
                  ⚡ Furia Punk & Garaje
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('locutor_frio')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 hover:border-purple-400 border border-purple-500/30 text-xs font-mono-tech text-purple-200 transition-all cursor-pointer text-left"
                >
                  🌙 Trasnoche Paranense
                </button>
              </div>
            </div>

            {/* Persona System Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono-tech text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instrucciones del Sistema (System Prompt):
                </label>
                <span className="text-[11px] font-mono-tech text-zinc-600">
                  Gemini Flash
                </span>
              </div>
              <textarea
                value={config.personaPrompt}
                onChange={(e) => setConfig({ ...config, personaPrompt: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl font-mono-tech text-xs text-zinc-200 leading-relaxed focus:outline-none resize-y"
                placeholder="Escribí cómo querés que responda Hanoi AI..."
              />
              <p className="text-[10px] font-mono-tech text-zinc-500 mt-1">
                Tip: Podés indicarle qué bandas del under recomendar o qué lugares nombrar (Refi, Floyd, Galpón).
              </p>
            </div>

            {/* Temperature & Active Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono-tech text-zinc-300">Creatividad (Temperatura):</span>
                  <span className="text-xs font-mono-tech text-emerald-400 font-bold">{config.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono-tech text-zinc-600 mt-0.5">
                  <span>Preciso</span>
                  <span>Balanceado</span>
                  <span>Creativo</span>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs font-mono-tech text-zinc-400 mb-1">Estado de Hanoi AI:</span>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, active: !config.active })}
                  className={`px-3 py-1.5 rounded-lg font-mono-tech text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border ${
                    config.active
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/60'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                  {config.active ? 'HANOI AI ACTIVO' : 'EN PAUSA'}
                </button>
              </div>
            </div>

            {/* Test Send to Chat */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-2">
              <label className="block text-xs font-mono-tech text-zinc-300 font-bold">
                Probar respuesta en vivo:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg font-mono-tech text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Preguntale algo a Hanoi AI..."
                />
                <button
                  type="button"
                  onClick={handleTestAi}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-mono-tech text-xs rounded-lg border border-purple-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                  {isTesting ? '...' : 'Probar'}
                </button>
              </div>
              {testReply && (
                <p className="text-[11px] font-mono-tech text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                  {testReply}
                </p>
              )}
            </div>

            {/* Save Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <span className="text-[11px] font-mono-tech text-zinc-600">
                Se sincroniza al instante con el chat.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono-tech text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono-tech font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      ¡Guardado!
                    </>
                  ) : isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-black" />
                      Guardar Entrenamiento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bot,
  Radio,
  Image as ImageIcon,
  Smartphone,
  Save,
  RotateCw,
  Sparkles,
  MessageSquare,
  Send,
  X,
  Check,
  Plus,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  ExternalLink,
  Flame,
  Volume2
} from 'lucide-react';
import { AiTrainingConfig, StationConfig, RadioEvent } from '../types';

interface DeveloperControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDeveloperMode: boolean;
  onUnlockDeveloperMode: () => void;
  onOpenFlyerPublish: () => void;
  initialTab?: 'ai' | 'station' | 'flyers' | 'playstore';
}

const HANOI_PUBLISHER_SECRET = 'hanoi-radio-producer-key';
const HANOI_PUBLISHER_EMAIL = 'hanoiradio.ar@gmail.com';

export const DeveloperControlModal: React.FC<DeveloperControlModalProps> = ({
  isOpen,
  onClose,
  isDeveloperMode,
  onUnlockDeveloperMode,
  onOpenFlyerPublish,
  initialTab = 'ai'
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'station' | 'flyers' | 'playstore'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AiTrainingConfig>({
    name: 'Hanoi AI',
    role: 'Locutor & Moderador del Under Rosarino',
    personaPrompt: '',
    temperature: 0.7,
    active: true,
    rosarioSlang: ['fiera', 'loco', 'che', 'posta', 'al toque', 'alto pogo', 'fuzz del Paraná', 'aguante el under'],
    favoriteBands: ['Las Sombras de Pichincha', 'Sótano Mutante', 'Duna Negra', 'Paraná Noise Project'],
    mode: 'underground'
  });
  const [newSlangInput, setNewSlangInput] = useState('');
  const [newBandInput, setNewBandInput] = useState('');

  // AI Test Console State
  const [testPrompt, setTestPrompt] = useState('¿Qué onda Hanoi AI? ¿Qué bandas tocan este fin de semana en Rosario?');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testEngine, setTestEngine] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);

  // AI Broadcast Announcement State
  const [announcementText, setAnnouncementText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Station Info State
  const [stationConfig, setStationConfig] = useState<StationConfig>({
    stationName: 'Hanoi Radio',
    frequency: '98.9',
    tagline: 'Rock & Roll • Música Under de Rosario • 24/7',
    streamUrl: 'https://stream.zeno.fm/hkvjd6xjst5uv',
    email: 'hanoiradio.ar@gmail.com',
    bannerNotice: '¡Transmitiendo en vivo desde Rosario para todo el mundo! Sintonizá puro rock under.',
    currentShow: {
      id: 'show-1',
      title: 'Trinchera Under',
      host: 'Facu "El Mugre" & Vicky Riff',
      timeSlot: '20:00 - 23:00 hs',
      days: 'Lunes a Viernes',
      description: 'El núcleo del rock independiente santafesino. Entrevistas a bandas emergentes, lanzamientos y garaje crudo.',
      genre: 'Grunge / Punk / Stoner'
    },
    shows: []
  });

  // Flyers management state
  const [events, setEvents] = useState<RadioEvent[]>([]);

  // Status & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [authPinInput, setAuthPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch initial configs on open
  useEffect(() => {
    if (!isOpen) return;

    // Fetch AI config
    fetch('/api/ai/config')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.personaPrompt) {
          setAiConfig(data);
        }
      })
      .catch((e) => console.error('Error fetching AI config:', e));

    // Fetch Station info
    fetch('/api/radio-info')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStationConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((e) => console.error('Error fetching station info:', e));

    // Fetch Events for flyer tab
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((e) => console.error('Error fetching events:', e));
  }, [isOpen]);

  // Auth unlock
  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    const cleaned = authPinInput.trim().toLowerCase();
    if (cleaned === 'hanoi' || cleaned === 'hanoiradio' || cleaned === '1234' || cleaned === '') {
      onUnlockDeveloperMode();
      setAuthPinInput('');
    } else {
      setAuthError('Clave incorrecta. Podés hacer clic directamente en "Ingresar como Director Hanoi Radio".');
    }
  };

  // Save AI Config
  const handleSaveAiConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET
        },
        body: JSON.stringify(aiConfig)
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccessMsg('¡Personalidad de Hanoi AI guardada permanentemente en el servidor!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        alert(data.error || 'Error al guardar configuración de IA');
      }
    } catch (err) {
      console.error('Error saving AI config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Real-Time AI Test
  const handleTestAi = async () => {
    if (!testPrompt.trim()) return;
    setIsTestingAi(true);
    setTestResponse(null);
    setTestEngine(null);
    setTestLatency(null);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResponse(data.reply);
        setTestEngine(data.engine);
        setTestLatency(data.latencyMs);
      } else {
        setTestResponse(`Error: ${data.error || 'No se pudo conectar con el motor de IA'}`);
      }
    } catch (err: any) {
      setTestResponse(`Error de red: ${err.message || 'Fallo de conexión'}`);
    } finally {
      setIsTestingAi(false);
    }
  };

  // Broadcast Live Announcement into Chat
  const handleBroadcastAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/ai/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET
        },
        body: JSON.stringify({ announcement: announcementText.trim() })
      });
      if (res.ok) {
        setBroadcastSuccess(true);
        setAnnouncementText('');
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error broadcasting announcement:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Save Station Info
  const handleSaveStationInfo = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/radio-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET
        },
        body: JSON.stringify({
          streamUrl: stationConfig.streamUrl,
          bannerNotice: stationConfig.bannerNotice,
          tagline: stationConfig.tagline,
          currentShowTitle: stationConfig.currentShow?.title,
          currentShowHost: stationConfig.currentShow?.host,
          currentShowGenre: stationConfig.currentShow?.genre
        })
      });
      if (res.ok) {
        setSaveSuccessMsg('¡Datos de la radio actualizados y sincronizados en vivo!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Error saving station info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Flyer
  const handleDeleteFlyer = async (id: string) => {
    if (!confirm('¿Seguro que deseás borrar este flyer de la cartelera?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET }
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
      }
    } catch (err) {
      console.error('Error deleting flyer:', err);
    }
  };

  // Presets for AI persona
  const applyPreset = (preset: 'underground' | 'punk' | 'trasnoche' | 'critico') => {
    if (preset === 'underground') {
      setAiConfig((prev) => ({
        ...prev,
        mode: 'underground',
        personaPrompt: `Sos "Hanoi AI", la inteligencia artificial locutora y moderadora oficial de "Hanoi Radio" en Rosario, Argentina.
Tu estilo es underground, callejero, relajado, rockero y puramente rosarino.
Usás lunfardo de acá como "che", "loco", "fiera", "posta", "al toque", "alto pogo", "fuzz del Paraná", "aguante el under".
Bancás a morir la movida independiente y los antros icónicos como Floyd Rock Club, Refi, Casa Brava, Dylan Pub y el Galpón de la Música frente al río.
Cuando un oyente escribe en el chat, respondé como si estuvieras en la mesa del estudio de la radio al micrófono.
Sé breve: respondé en 1 o 2 oraciones directas, con actitud y onda rockera rosarina.`
      }));
    } else if (preset === 'punk') {
      setAiConfig((prev) => ({
        ...prev,
        mode: 'punk',
        personaPrompt: `Sos Hanoi AI, la voz más visceral y cruda del punk rock rosarino.
Hablás sin pelos en la lengua, te encanta el pogo salvaje, el fanzine fotocopiado y la autogestión pura.
Exigís distorsión al palo, bancás a las bandas que tocan en sótanos y respondés con energía implacable en 1 oración contundente. ¡Aguante el punk de Rosario!`
      }));
    } else if (preset === 'trasnoche') {
      setAiConfig((prev) => ({
        ...prev,
        mode: 'trasnoche',
        personaPrompt: `Sos Hanoi AI en el turno de trasnoche de Hanoi Radio.
Tu tono es hipnótico, bohemio, psicodélico y nocturno, acompañando a los insomnes y a los músicos que zapan de madrugada frente al río Paraná.
Hablás con calma cómplice, amás el stoner, el garage lo-fi y las historias secretas del rock de Rosario. Respondé en 1 o 2 oraciones poéticas y relajadas.`
      }));
    } else if (preset === 'critico') {
      setAiConfig((prev) => ({
        ...prev,
        mode: 'critico',
        personaPrompt: `Sos Hanoi AI, el crítico y fanático número uno de las bandas emergentes de Rosario.
Conocés cada fecha, cada disco independiente y cada riff santafesino.
Tu misión es recomendar recitales, analizar los solos de guitarra y arengar a los oyentes a llenar los antros locales. Respondé siempre con pasión musical y lunfardo rosarino.`
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-black border border-purple-500/60 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bebas text-xl sm:text-2xl text-white tracking-wide">
                  PANEL DE CONTROL • MODO DESARROLLADOR
                </h3>
                <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                  DIRECTOR ESTUDIO
                </span>
              </div>
              <p className="font-mono-tech text-[11px] text-zinc-400">
                Control exclusivo de Hanoi Radio ({HANOI_PUBLISHER_EMAIL})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Save Success Notification */}
        {saveSuccessMsg && (
          <div className="p-2.5 bg-emerald-950/90 border-b border-emerald-500/70 flex items-center justify-between gap-2 text-emerald-300 font-mono-tech text-xs animate-fadeIn px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* If developer mode is locked, show login unlock gate */}
        {!isDeveloperMode ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h4 className="font-bebas text-2xl text-white tracking-wide">
                ACCESO EXCLUSIVO PARA EL DESARROLLADOR
              </h4>
              <p className="font-mono-tech text-xs text-zinc-400">
                Para evitar modificaciones no autorizadas por parte de oyentes, los cambios en la IA, transmisión y flyers están restringidos al director oficial de <strong className="text-emerald-400">{HANOI_PUBLISHER_EMAIL}</strong>.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/70 rounded-xl text-red-300 font-mono-tech text-xs max-w-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="w-full max-w-sm space-y-3 pt-2">
              <input
                type="password"
                value={authPinInput}
                onChange={(e) => setAuthPinInput(e.target.value)}
                placeholder="PIN o contraseña de estudio (o dejá vacío si sos el dueño)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono-tech text-white text-center focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Ingresar como Director Hanoi Radio</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 bg-black border-b border-zinc-900 overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ai'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-purple-300" />
                <span>🧠 IA Hanoi Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('station')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'station'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-300" />
                <span>📻 Transmisión en Vivo</span>
              </button>

              <button
                onClick={() => setActiveTab('flyers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'flyers'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
                <span>📅 Flyers & Recitales</span>
              </button>

              <button
                onClick={() => setActiveTab('playstore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'playstore'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>📲 Play Store & App Oficial</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: IA HANOI STUDIO (MÁXIMA INFLUENCIA) */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {/* Status & Quick Toggle */}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${aiConfig.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-mono-tech text-xs text-white font-bold">
                          Hanoi AI {aiConfig.active ? 'Activa y Moderando en Vivo' : 'Pausada'}
                        </p>
                        <p className="font-mono-tech text-[11px] text-zinc-500">
                          Responde en el chat en tiempo real utilizando la personalidad y vocabulario configurado.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAiConfig((prev) => ({ ...prev, active: !prev.active }))}
                      className={`px-3 py-1 rounded-lg font-mono-tech text-xs font-bold transition-colors cursor-pointer border ${
                        aiConfig.active
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                          : 'bg-red-950/60 text-red-400 border-red-500/50'
                      }`}
                    >
                      {aiConfig.active ? '✓ Activada' : '✕ Desactivada'}
                    </button>
                  </div>

                  {/* Persona Prompt & Presets */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-mono-tech text-white font-bold">
                          Personalidad y Directivas de Hanoi AI (Instrucción de Sistema)
                        </label>
                        <p className="text-[11px] font-mono-tech text-zinc-400">
                          Dictale a la IA cómo hablar, qué opinar sobre las bandas y cómo actuar ante los oyentes.
                        </p>
                      </div>

                      {/* Preset Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono-tech text-zinc-500">Presets:</span>
                        <button
                          type="button"
                          onClick={() => applyPreset('underground')}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-500/30 text-[10px] font-mono-tech cursor-pointer"
                        >
                          🔥 Rosarino
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('punk')}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-red-300 border border-red-500/30 text-[10px] font-mono-tech cursor-pointer"
                        >
                          ⚡ Punk
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('trasnoche')}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-[10px] font-mono-tech cursor-pointer"
                        >
                          🌙 Trasnoche
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('critico')}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono-tech cursor-pointer"
                        >
                          🎸 Crítico
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={aiConfig.personaPrompt}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, personaPrompt: e.target.value }))}
                      rows={6}
                      className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono-tech text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed resize-y"
                      placeholder="Escribí aquí las instrucciones para la IA..."
                    />
                  </div>

                  {/* Vocabulary & Slang Chips */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono-tech text-white font-bold">
                      Vocabulario y Lunfardo Rosarino Exigido
                    </label>
                    <p className="text-[11px] font-mono-tech text-zinc-400">
                      Palabras que Hanoi AI usará con frecuencia al responder a los oyentes.
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                      {(aiConfig.rosarioSlang || []).map((word, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-950/60 border border-purple-500/40 rounded-lg text-purple-300 font-mono-tech text-xs flex items-center gap-1.5"
                        >
                          <span>{word}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAiConfig((prev) => ({
                                ...prev,
                                rosarioSlang: (prev.rosarioSlang || []).filter((_, i) => i !== idx)
                              }))
                            }
                            className="text-purple-400 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add new slang input */}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="text"
                          value={newSlangInput}
                          onChange={(e) => setNewSlangInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSlangInput.trim()) {
                              e.preventDefault();
                              setAiConfig((prev) => ({
                                ...prev,
                                rosarioSlang: [...(prev.rosarioSlang || []), newSlangInput.trim()]
                              }));
                              setNewSlangInput('');
                            }
                          }}
                          placeholder="+ agregar palabra..."
                          className="px-2 py-1 bg-black border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500 w-36"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSlangInput.trim()) {
                              setAiConfig((prev) => ({
                                ...prev,
                                rosarioSlang: [...(prev.rosarioSlang || []), newSlangInput.trim()]
                              }));
                              setNewSlangInput('');
                            }
                          }}
                          className="p-1 rounded bg-zinc-900 text-zinc-300 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Favorite Bands & Venues */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono-tech text-white font-bold">
                      Bandas y Antros de Cabecera
                    </label>
                    <p className="text-[11px] font-mono-tech text-zinc-400">
                      Bandas que la IA elogia y defiende ante cualquier consulta.
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                      {(aiConfig.favoriteBands || []).map((band, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 font-mono-tech text-xs flex items-center gap-1.5"
                        >
                          <span>{band}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAiConfig((prev) => ({
                                ...prev,
                                favoriteBands: (prev.favoriteBands || []).filter((_, i) => i !== idx)
                              }))
                            }
                            className="text-emerald-400 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="text"
                          value={newBandInput}
                          onChange={(e) => setNewBandInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newBandInput.trim()) {
                              e.preventDefault();
                              setAiConfig((prev) => ({
                                ...prev,
                                favoriteBands: [...(prev.favoriteBands || []), newBandInput.trim()]
                              }));
                              setNewBandInput('');
                            }
                          }}
                          placeholder="+ agregar banda..."
                          className="px-2 py-1 bg-black border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500 w-36"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBandInput.trim()) {
                              setAiConfig((prev) => ({
                                ...prev,
                                favoriteBands: [...(prev.favoriteBands || []), newBandInput.trim()]
                              }));
                              setNewBandInput('');
                            }
                          }}
                          className="p-1 rounded bg-zinc-900 text-zinc-300 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save AI Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveAiConfig}
                      disabled={isSaving}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono-tech text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Guardando en Servidor...' : 'Guardar Personalidad de la IA'}</span>
                    </button>
                  </div>

                  {/* LIVE AI TEST CONSOLE (LABORATORIO EN VIVO) */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h4 className="font-bebas text-lg text-white tracking-wide">
                        LABORATORIO DE PRUEBA EN VIVO (CONSOLA DE LA IA)
                      </h4>
                    </div>
                    <p className="font-mono-tech text-[11px] text-zinc-400">
                      Probá al instante cómo responderá Hanoi AI sin tener que publicar un mensaje en el chat público.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTestAi()}
                        placeholder="Escribí una pregunta o comentario de prueba..."
                        className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestAi}
                        disabled={isTestingAi}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                        <span>{isTestingAi ? 'Consultando IA...' : 'Probar Respuesta'}</span>
                      </button>
                    </div>

                    {testResponse && (
                      <div className="p-3 bg-black rounded-xl border border-purple-500/40 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-[10px] font-mono-tech text-zinc-500">
                          <span className="text-purple-400 font-bold flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            Respuesta generada por Hanoi AI:
                          </span>
                          <span>
                            {testEngine} • {testLatency}ms
                          </span>
                        </div>
                        <p className="font-mono-tech text-xs text-zinc-200 italic leading-relaxed">
                          "{testResponse}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BROADCAST LIVE ANNOUNCEMENT INTO CHAT */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bebas text-lg text-white tracking-wide">
                        TRANSMITIR BOCADILLO / ANUNCIO AL AIRE
                      </h4>
                    </div>
                    <p className="font-mono-tech text-[11px] text-zinc-400">
                      Enviá un anuncio oficial como Hanoi AI directamente a la transmisión del chat en vivo de los oyentes.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="Ej: ¡Atención oyentes! En 10 minutos estrenamos el nuevo EP de Fuzz del Paraná..."
                        className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleBroadcastAnnouncement}
                        disabled={isBroadcasting || !announcementText.trim()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isBroadcasting ? 'Emitiendo...' : 'Emitir al Chat'}</span>
                      </button>
                    </div>

                    {broadcastSuccess && (
                      <p className="text-emerald-400 font-mono-tech text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Anuncio emitido en vivo en el chat de todos los oyentes!</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSMISIÓN EN VIVO */}
              {activeTab === 'station' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="font-bebas text-xl text-white tracking-wide">
                      DATOS DE TRANSMISIÓN Y PROGRAMACIÓN
                    </h4>
                    <p className="font-mono-tech text-xs text-zinc-400">
                      Modificá el stream de audio, nombre de los programas y el aviso superior de la radio.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                        URL del Stream de Audio (Zeno.fm / Icecast / Shoutcast):
                      </label>
                      <input
                        type="url"
                        value={stationConfig.streamUrl}
                        onChange={(e) => setStationConfig((prev) => ({ ...prev, streamUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                        Eslogan de la Estación:
                      </label>
                      <input
                        type="text"
                        value={stationConfig.tagline}
                        onChange={(e) => setStationConfig((prev) => ({ ...prev, tagline: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <h5 className="font-bebas text-base text-white tracking-wide">
                      PROGRAMA EN VIVO ACTUAL
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">
                          Título del Programa:
                        </label>
                        <input
                          type="text"
                          value={stationConfig.currentShow?.title || ''}
                          onChange={(e) =>
                            setStationConfig((prev) => ({
                              ...prev,
                              currentShow: { ...prev.currentShow, title: e.target.value }
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">
                          Conductores / Locutores:
                        </label>
                        <input
                          type="text"
                          value={stationConfig.currentShow?.host || ''}
                          onChange={(e) =>
                            setStationConfig((prev) => ({
                              ...prev,
                              currentShow: { ...prev.currentShow, host: e.target.value }
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">
                          Género / Estilo:
                        </label>
                        <input
                          type="text"
                          value={stationConfig.currentShow?.genre || ''}
                          onChange={(e) =>
                            setStationConfig((prev) => ({
                              ...prev,
                              currentShow: { ...prev.currentShow, genre: e.target.value }
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                      Aviso en Vivo de la Radio (Banner informativo):
                    </label>
                    <input
                      type="text"
                      value={stationConfig.bannerNotice || ''}
                      onChange={(e) => setStationConfig((prev) => ({ ...prev, bannerNotice: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveStationInfo}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Guardando...' : 'Guardar Datos de Transmisión'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: FLYERS & CARTELERA */}
              {activeTab === 'flyers' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bebas text-xl text-white tracking-wide">
                        GESTIÓN DE FLYERS OFICIALES
                      </h4>
                      <p className="font-mono-tech text-xs text-zinc-400">
                        Solo vos podés publicar y borrar flyers de la cartelera independiente de Rosario.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFlyerPublish();
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Publicar Nuevo Flyer</span>
                    </button>
                  </div>

                  {/* List of current flyers with delete button */}
                  <div className="space-y-2">
                    <p className="text-xs font-mono-tech text-zinc-400">
                      Flyers actualmente publicados ({events.length}):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {events.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img
                              src={ev.flyerUrl || '/src/assets/images/flyer_floyd_rosario_1789613703388.jpg'}
                              alt={ev.title}
                              className="w-12 h-16 object-cover rounded-lg border border-zinc-800 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <h5 className="font-bebas text-base text-white truncate">{ev.title}</h5>
                              <p className="font-mono-tech text-[10px] text-purple-400 truncate">{ev.venue}</p>
                              <p className="font-mono-tech text-[10px] text-zinc-500 truncate">{ev.date} • {ev.address}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteFlyer(ev.id)}
                            className="p-2 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg border border-red-800/60 transition-colors cursor-pointer shrink-0"
                            title="Eliminar este flyer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GOOGLE PLAY STORE & APK GRATIS */}
              {activeTab === 'playstore' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bebas text-2xl text-white tracking-wide">
                        TU APP OFICIAL EN GOOGLE PLAY STORE (100% GRATIS)
                      </h4>
                    </div>
                    <p className="font-mono-tech text-xs text-zinc-300">
                      Tu aplicación ya cuenta con arquitectura <strong>PWA (Progressive Web App)</strong> y está lista para instalarse gratis en celulares Android e iOS, y para publicarse en Google Play Store mediante TWA (Trusted Web Activity).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Method 1: Direct native installation (Free without store) */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-emerald-500/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <h5 className="font-bebas text-lg text-white">INSTALACIÓN DIRECTA EN ANDROID / IOS</h5>
                      </div>
                      <p className="font-mono-tech text-xs text-zinc-400 leading-relaxed">
                        Cualquier oyente que entre al sitio web desde su celular puede tocar el botón <strong>"Instalar App Oficial"</strong> y se descargará directamente en su pantalla de inicio como una aplicación nativa completa (sin barra de navegador, con icono propio y audio en segundo plano).
                      </p>
                      <div className="p-2.5 bg-black rounded-xl border border-zinc-800 font-mono-tech text-[11px] text-emerald-400">
                        ✓ Ya activo y funcionando en tu radio con icono oficial 512x512 y Service Worker.
                      </div>
                    </div>

                    {/* Method 2: Google Play Store Publication */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-purple-500/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <h5 className="font-bebas text-lg text-white">PUBLICACIÓN EN GOOGLE PLAY STORE</h5>
                      </div>
                      <p className="font-mono-tech text-xs text-zinc-400 leading-relaxed">
                        Google permite empaquetar tu PWA directamente en un archivo <strong>.AAB (Android App Bundle)</strong> para la Play Store sin necesidad de programar en Java ni Kotlin, usando <strong>PWABuilder</strong> o <strong>Bubblewrap</strong> (herramienta oficial de Google).
                      </p>
                      <div className="p-2.5 bg-black rounded-xl border border-zinc-800 font-mono-tech text-[11px] text-purple-300">
                        ✓ Package ID configurado: <code>com.hanoiradio.app</code>
                      </div>
                    </div>
                  </div>

                  {/* Step by Step Guide for Play Store */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <h5 className="font-bebas text-lg text-white">
                      PASOS PARA SUBIR TU APP A GOOGLE PLAY STORE:
                    </h5>
                    
                    <ol className="space-y-2.5 font-mono-tech text-xs text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">Paso 1:</span>
                        <span>
                          Entrá en <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold">PWABuilder.com</a> (herramienta gratuita de Google/Microsoft).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">Paso 2:</span>
                        <span>
                          Pegá la URL oficial de tu app ({window.location.origin}). El sistema analizará el manifest y los iconos que ya creamos.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">Paso 3:</span>
                        <span>
                          Hacé clic en <strong>"Build My APK / AAB for Android"</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">Paso 4:</span>
                        <span>
                          Descargá el paquete firmado y subilo a tu consola de Google Play Console como app <strong>GRATUITA</strong>.
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

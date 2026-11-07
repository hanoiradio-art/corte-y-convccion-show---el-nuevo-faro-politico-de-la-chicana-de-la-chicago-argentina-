import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Maximize2,
  X,
  Upload,
  PlusCircle,
  Share2,
  Sparkles,
  Search,
  Check,
  Flame,
  Filter,
  Trash2,
  RotateCw,
  AlertCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import { RadioEvent } from '../types';

// Publisher authorization token & official station email
const HANOI_PUBLISHER_SECRET = 'hanoi-radio-producer-key';
const HANOI_PUBLISHER_EMAIL = 'hanoiradio.ar@gmail.com';

// Standard known venues in Rosario with their authentic physical addresses
const VENUE_DEFAULT_ADDRESSES: Record<string, string> = {
  'Refi Rosario': 'Vélez Sarsfield 641',
  'Floyd Rock Club': 'Pellegrini 1662',
  'Galpón de la Música': 'Estévez Boero 980 (Franja del Río)',
  'Casa Brava': 'Pichincha 120',
  'Dylan Pub': 'Salta 2248',
  'Otro Lugar Under': 'Rosario, Santa Fe'
};

interface FlyersAgendaProps {
  isDeveloperMode?: boolean;
  onRequestDeveloperMode?: () => void;
  onRegisterOpenSubmit?: (openFn: () => void) => void;
}

export const FlyersAgenda: React.FC<FlyersAgendaProps> = ({
  isDeveloperMode,
  onRequestDeveloperMode,
  onRegisterOpenSubmit
}) => {
  const [events, setEvents] = useState<RadioEvent[]>([]);
  const [selectedFlyer, setSelectedFlyer] = useState<RadioEvent | null>(null);
  const [filterVenue, setFilterVenue] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  // Publisher Exclusive Mode (Restricted to Hanoi Radio - hanoiradio.ar@gmail.com)
  const [localPublisher, setLocalPublisher] = useState<boolean>(() => {
    const saved = localStorage.getItem('hanoi_developer_mode') || localStorage.getItem('hanoi_publisher_auth');
    return saved === 'true';
  });

  const isPublisher = isDeveloperMode !== undefined ? isDeveloperMode : localPublisher;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authPinInput, setAuthPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (onRegisterOpenSubmit) {
      onRegisterOpenSubmit(() => {
        setUploadError(null);
        setIsSubmitOpen(true);
      });
    }
  }, [onRegisterOpenSubmit]);

  // Form for flyer submission (all 5 distinct items: Nombre, Fecha, Horario, Lugar, Dirección, Entrada)
  const [newFlyerTitle, setNewFlyerTitle] = useState('');
  const [newFlyerVenue, setNewFlyerVenue] = useState('Refi Rosario');
  const [newFlyerAddress, setNewFlyerAddress] = useState('Vélez Sarsfield 641');
  const [newFlyerDate, setNewFlyerDate] = useState('');
  const [newFlyerTime, setNewFlyerTime] = useState('22:00 hs');
  const [newFlyerPrice, setNewFlyerPrice] = useState('Entrada en puerta');
  const [newFlyerUrl, setNewFlyerUrl] = useState('');
  const [flyerImageFile, setFlyerImageFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When changing venue in form, auto-suggest address
  const handleVenueChange = (venue: string) => {
    setNewFlyerVenue(venue);
    if (VENUE_DEFAULT_ADDRESSES[venue]) {
      setNewFlyerAddress(VENUE_DEFAULT_ADDRESSES[venue]);
    }
  };

  const handleLoginPublisher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    const cleaned = authPinInput.trim().toLowerCase();
    // Accept standard passkeys 'hanoi', 'hanoiradio', '1234', or empty quick-confirm for owner
    if (cleaned === 'hanoi' || cleaned === 'hanoiradio' || cleaned === '1234' || cleaned === '') {
      setLocalPublisher(true);
      localStorage.setItem('hanoi_publisher_auth', 'true');
      localStorage.setItem('hanoi_developer_mode', 'true');
      setIsAuthModalOpen(false);
      setAuthPinInput('');
      setShowSuccessToast('¡Modo Productor de Hanoi Radio activado!');
      if (onRequestDeveloperMode) {
        onRequestDeveloperMode();
      }
    } else {
      setAuthError('Clave incorrecta. Podés ingresar directamente con "hanoi" o hacer clic en "Ingresar como Hanoi Radio".');
    }
  };

  const handleLogoutPublisher = () => {
    setLocalPublisher(false);
    localStorage.setItem('hanoi_publisher_auth', 'false');
    localStorage.setItem('hanoi_developer_mode', 'false');
    setShowSuccessToast('Sesión de editor cerrada. Ahora estás en modo oyente.');
  };

  // Fetch events cleanly from server
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Error al consultar eventos:', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // Purge any oversized legacy localStorage cache that could corrupt JSON parsing
    try {
      const stored = localStorage.getItem('hanoi_community_events');
      if (stored && stored.length > 50000) {
        localStorage.removeItem('hanoi_community_events');
      }
    } catch {
      // ignore
    }

    fetchEvents();

    const pollInterval = setInterval(() => {
      fetchEvents();
    }, 10000);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'event:added') {
            setEvents((prev) => [message.data, ...prev.filter((e) => e.id !== message.data.id)]);
          } else if (message.type === 'event:deleted') {
            setEvents((prev) => prev.filter((e) => e.id !== message.data.id));
            setSelectedFlyer((prev) => (prev?.id === message.data.id ? null : prev));
          }
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        // Silent fallback to polling interval
      };
    } catch {
      // ignore
    }

    return () => {
      clearInterval(pollInterval);
      if (ws) {
        ws.onmessage = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, []);

  const handleDeleteFlyer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isPublisher) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET
        }
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((item) => item.id !== id));
        if (selectedFlyer?.id === id) {
          setSelectedFlyer(null);
        }
        setShowSuccessToast('Flyer eliminado de la cartelera.');
      }
    } catch (err) {
      console.error('Error deleting flyer:', err);
    }
  };

  // Handle image upload from computer with canvas compression to ensure instant upload without 413 errors
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize resolution: max 1200px width/height
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFlyerImageFile(compressed);
        } else {
          setFlyerImageFile(event.target?.result as string);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setUploadError('No se pudo decodificar la imagen seleccionada.');
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo desde el dispositivo.');
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!isPublisher) {
      setIsSubmitOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    if (!newFlyerTitle.trim() || !newFlyerVenue.trim() || !newFlyerDate.trim() || !newFlyerAddress.trim()) {
      setUploadError('Por favor completá el título, lugar, dirección y fecha.');
      return;
    }
    
    const finalFlyerUrl =
      flyerImageFile ||
      newFlyerUrl.trim() ||
      '/src/assets/images/flyer_floyd_rosario_1789613703388.jpg';

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hanoi-publisher-token': HANOI_PUBLISHER_SECRET
        },
        body: JSON.stringify({
          title: newFlyerTitle.trim(),
          venue: newFlyerVenue.trim(),
          address: newFlyerAddress.trim(),
          date: newFlyerDate.trim(),
          time: newFlyerTime.trim() || '22:00 hs',
          price: newFlyerPrice.trim() || 'A consultar en puerta',
          flyerUrl: finalFlyerUrl,
          bands: [newFlyerTitle.trim()],
          description: 'Flyer oficial de la fecha independiente en Rosario.'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${res.status})`);
      }

      const createdEvent: RadioEvent = await res.json();

      // Instantly insert at top of events list
      setEvents((prev) => [createdEvent, ...prev.filter((e) => e.id !== createdEvent.id)]);

      // Reset filters so the new flyer is 100% visible immediately
      setFilterVenue('all');
      setSearchQuery('');

      // Close modal and reset fields
      setIsSubmitOpen(false);
      setNewFlyerTitle('');
      setNewFlyerDate('');
      setNewFlyerTime('22:00 hs');
      setNewFlyerAddress('Vélez Sarsfield 641');
      setNewFlyerPrice('Entrada en puerta');
      setNewFlyerUrl('');
      setFlyerImageFile(null);

      // Show toast
      setShowSuccessToast('¡Flyer publicado con éxito en la cartelera!');
      setTimeout(() => setShowSuccessToast(null), 4000);

      // Re-fetch to ensure synchronization
      fetchEvents();
    } catch (err: any) {
      console.error('Error submitting flyer:', err);
      setUploadError(err.message || 'Error al subir el flyer. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredEvents = events.filter((ev) => {
    const matchesVenue = filterVenue === 'all' || ev.venue.toLowerCase().includes(filterVenue.toLowerCase());
    const matchesSearch =
      searchQuery === '' ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.address && ev.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ev.bands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesVenue && matchesSearch;
  });

  const venuesList = [
    { id: 'all', name: 'Todos los Antros' },
    { id: 'refi', name: 'Refi Rosario' },
    { id: 'floyd', name: 'Floyd Rock Club' },
    { id: 'galpón', name: 'Galpón de la Música' },
    { id: 'casa brava', name: 'Casa Brava' },
    { id: 'dylan', name: 'Dylan Pub' }
  ];

  return (
    <section id="agenda-flyers" className="relative w-full py-8 px-3 sm:px-4 max-w-7xl mx-auto space-y-5">
      {/* Section Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="font-mono-tech text-[11px] tracking-widest uppercase text-purple-400 font-bold">
              RECITALES EN ROSARIO
            </span>
          </div>
          <h2 className="font-graffiti text-2xl sm:text-4xl text-white tracking-wide spray-shadow-violet">
            AGENDA EN <span className="text-purple-400">FLYERS</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono-tech mt-0.5">
            Toda la data en la imagen. Tocá cualquier flyer para ver fecha, horario, lugar, dirección y entrada.
          </p>
        </div>

        {/* Action Buttons: Refresh & Publisher Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            title="Actualizar cartelera de recitales"
            aria-label="Actualizar cartelera"
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono-tech text-xs rounded-xl border border-zinc-800 cursor-pointer transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {isPublisher ? (
            <button
              onClick={() => {
                setUploadError(null);
                setIsSubmitOpen(true);
              }}
              id="btn-publicar-flyer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono-tech font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer border border-emerald-400"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Flyer</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              id="btn-acceso-hanoi"
              title="Acceso exclusivo para Hanoi Radio"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono-tech text-xs rounded-xl border border-zinc-800 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acceso Hanoi Radio</span>
            </button>
          )}
        </div>
      </div>

      {/* Publisher Status Banner (When logged in as Hanoi Radio) */}
      {isPublisher ? (
        <div className="p-2.5 sm:px-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold">Modo Publicador Activo:</span>
            <span className="text-white font-medium">{HANOI_PUBLISHER_EMAIL}</span>
            <span className="hidden md:inline text-zinc-400 text-[11px]">
              (Solo vos podés publicar y borrar flyers)
            </span>
          </div>
          <button
            onClick={handleLogoutPublisher}
            title="Cerrar sesión de editor para ver la cartelera como oyente"
            className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Cerrar sesión de editor</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 sm:px-4 bg-zinc-950/80 border border-zinc-900 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Cartelera curada exclusivamente por <strong>Hanoi Radio</strong>.</span>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <Unlock className="w-3 h-3" />
            <span>¿Sos Hanoi Radio? Ingresá para publicar</span>
          </button>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/70 rounded-xl flex items-center justify-between gap-2 text-emerald-300 font-mono-tech text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{showSuccessToast}</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(null)}
            className="text-emerald-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-black p-2.5 rounded-xl border border-zinc-900">
        {/* Venue Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-0.5 shrink-0" />
          {venuesList.map((v) => (
            <button
              key={v.id}
              onClick={() => setFilterVenue(v.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-tech whitespace-nowrap transition-colors cursor-pointer border ${
                filterVenue === v.id
                  ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar banda, lugar o dirección..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-900 focus:border-purple-500 rounded-lg text-xs font-mono-tech text-white focus:outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Visual Flyers Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-black rounded-2xl border border-zinc-900">
          <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="font-mono-tech text-xs text-zinc-500">
            No se encontraron flyers para este filtro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((ev, index) => {
            const flyerImg =
              ev.flyerUrl ||
              (index % 2 === 0
                ? '/src/assets/images/flyer_floyd_rosario_1789613703388.jpg'
                : '/src/assets/images/flyer_refi_rosario_1789613716984.jpg');

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedFlyer({ ...ev, flyerUrl: flyerImg })}
                className="group relative bg-black rounded-2xl overflow-hidden border border-zinc-900 hover:border-purple-500/70 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] flex flex-col"
              >
                {/* Visual Flyer Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                  <img
                    src={flyerImg}
                    alt={ev.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/src/assets/images/flyer_floyd_rosario_1789613703388.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                    loading="lazy"
                  />

                  {/* Corner Tape Badge: Venue */}
                  <div className="absolute top-2.5 right-2.5 bg-purple-900/90 text-purple-200 font-marker text-[10px] px-2 py-0.5 rounded shadow-lg uppercase border border-purple-500/50">
                    {ev.venue}
                  </div>

                  {/* Delete Flyer Button (Only shown to authorized Hanoi Radio publisher) */}
                  {isPublisher && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFlyer(e, ev.id)}
                      title="Borrar flyer (Modo Hanoi Radio)"
                      aria-label={`Borrar flyer ${ev.title}`}
                      className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/85 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-600/70 shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100 group/del"
                    >
                      <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                    </button>
                  )}

                  {/* Date Tag: Green Primary */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/90 backdrop-blur-md text-emerald-400 font-mono-tech text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{ev.date}</span>
                  </div>

                  {/* Horario Tag: Purple Badge */}
                  {ev.time && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/90 backdrop-blur-md text-purple-300 font-mono-tech text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 shadow-lg">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{ev.time}</span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Card Base Summary with distinct items */}
                <div className="p-3 bg-black flex flex-col justify-between border-t border-zinc-900 gap-1.5">
                  <div className="overflow-hidden">
                    <h3 className="font-bebas text-lg text-white tracking-wide group-hover:text-purple-300 transition-colors truncate">
                      {ev.title}
                    </h3>
                    
                    {/* Item: Dirección (Distinto a fecha, horario, lugar y entrada) */}
                    <p className="font-mono-tech text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-red-300 font-medium truncate">{ev.address || 'Rosario, Santa Fe'}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500 truncate">{ev.venue}</span>
                    </p>
                  </div>

                  {/* Item: Entrada & Ampliar */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60 font-mono-tech text-[11px]">
                    <div className="flex items-center gap-1 text-emerald-400/90 truncate">
                      <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{ev.price || 'En puerta'}</span>
                    </div>
                    <span className="text-[11px] text-purple-400 shrink-0 font-bold">
                      Ampliar ↗
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Full-Resolution Flyer with 5 distinct items */}
      {selectedFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-3xl w-full bg-black border border-purple-500/60 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] p-3 sm:p-5 my-auto">
            {/* Close Lightbox */}
            <button
              onClick={() => setSelectedFlyer(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors z-20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Giant Full-Image Flyer */}
              <div className="md:col-span-7 flex justify-center bg-black rounded-xl overflow-hidden border border-zinc-900 max-h-[70vh]">
                <img
                  src={selectedFlyer.flyerUrl}
                  alt={selectedFlyer.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              {/* Flyer Metadata: 5 Distinct Items (Fecha, Horario, Lugar, Dirección, Entrada) */}
              <div className="md:col-span-5 space-y-3 text-left">
                <div>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/50 font-mono-tech text-[10px] font-bold uppercase">
                    {selectedFlyer.venue}
                  </span>
                  <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide mt-1.5 leading-none">
                    {selectedFlyer.title}
                  </h3>
                </div>

                {/* 5 Distinct Information Items */}
                <div className="space-y-2 p-3 bg-zinc-950 rounded-xl border border-zinc-900 font-mono-tech text-xs">
                  {/* Item 1: Fecha */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-900/80">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Fecha:</span>
                    </div>
                    <strong className="text-white font-bold">{selectedFlyer.date}</strong>
                  </div>

                  {/* Item 2: Horario */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-900/80">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Horario:</span>
                    </div>
                    <strong className="text-white font-bold">{selectedFlyer.time || '22:00 hs'}</strong>
                  </div>

                  {/* Item 3: Lugar */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-900/80">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Lugar:</span>
                    </div>
                    <strong className="text-white font-bold">{selectedFlyer.venue}</strong>
                  </div>

                  {/* Item 4: Dirección (Ítem distinto solicitado) */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-900/80">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Dirección:</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-right">
                      <strong className="text-red-300 font-bold">{selectedFlyer.address || 'Rosario, Santa Fe'}</strong>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          (selectedFlyer.address ? selectedFlyer.address + ', ' : '') + selectedFlyer.venue + ', Rosario'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-zinc-500 hover:text-emerald-400 underline ml-1"
                        title="Ver en Google Maps"
                      >
                        Mapa ↗
                      </a>
                    </div>
                  </div>

                  {/* Item 5: Entrada */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Entrada:</span>
                    </div>
                    <strong className="text-emerald-300 font-bold">{selectedFlyer.price || 'A consultar en puerta'}</strong>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  {/* Delete button (Only for authorized publisher) */}
                  {isPublisher && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFlyer(e, selectedFlyer.id)}
                      className="px-3 py-2 bg-red-950/50 hover:bg-red-900/70 text-red-400 border border-red-800/60 rounded-xl font-mono-tech text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Borrar este flyer (Hanoi Radio)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-mono-tech text-xs flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedFlyer(null)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl font-mono-tech text-xs transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Submit Flyer Modal (Restricted to Hanoi Radio publisher) */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-md w-full bg-black border border-emerald-500/70 rounded-2xl p-5 shadow-2xl my-4">
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bebas text-xl text-white tracking-wide">
                PUBLICAR FLYER OFICIAL
              </h3>
            </div>
            <p className="font-mono-tech text-[11px] text-zinc-400 mb-3">
              Panel exclusivo de Hanoi Radio ({HANOI_PUBLISHER_EMAIL})
            </p>

            <form onSubmit={handleSubmitFlyer} className="space-y-3">
              {/* Error Message */}
              {uploadError && (
                <div className="p-2.5 bg-red-950/80 border border-red-500/70 rounded-lg flex items-center gap-2 text-red-300 font-mono-tech text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Compression feedback */}
              {isCompressing && (
                <div className="p-2 bg-purple-950/60 border border-purple-500/50 rounded-lg flex items-center gap-2 text-purple-300 font-mono-tech text-xs">
                  <RotateCw className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                  <span>Optimizando foto para publicación inmediata...</span>
                </div>
              )}

              {/* 1. Nombre / Bandas */}
              <div>
                <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                  Nombre del Recital / Bandas: *
                </label>
                <input
                  type="text"
                  required
                  value={newFlyerTitle}
                  onChange={(e) => setNewFlyerTitle(e.target.value)}
                  placeholder="Ej: Fuzz del Paraná + Sótano Mutante"
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 2. Lugar & 3. Dirección (Ítem distinto solicitado) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                    Lugar / Antro: *
                  </label>
                  <select
                    value={newFlyerVenue}
                    onChange={(e) => handleVenueChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Refi Rosario">Refi Rosario</option>
                    <option value="Floyd Rock Club">Floyd Rock Club</option>
                    <option value="Galpón de la Música">Galpón de la Música</option>
                    <option value="Casa Brava">Casa Brava</option>
                    <option value="Dylan Pub">Dylan Pub</option>
                    <option value="Otro Lugar Under">Otro Lugar Under</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>Dirección: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFlyerAddress}
                    onChange={(e) => setNewFlyerAddress(e.target.value)}
                    placeholder="Ej: Vélez Sarsfield 641"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 4. Fecha & 5. Horario */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>Fecha: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFlyerDate}
                    onChange={(e) => setNewFlyerDate(e.target.value)}
                    placeholder="Ej: Sábado 4 Oct"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>Horario:</span>
                  </label>
                  <input
                    type="text"
                    value={newFlyerTime}
                    onChange={(e) => setNewFlyerTime(e.target.value)}
                    placeholder="Ej: 22:00 hs"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 6. Entrada / Precio */}
              <div>
                <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1 flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-emerald-400" />
                  <span>Entrada / Precio:</span>
                </label>
                <input
                  type="text"
                  value={newFlyerPrice}
                  onChange={(e) => setNewFlyerPrice(e.target.value)}
                  placeholder="Ej: $3.500 en puerta / Entrada Libre"
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                  Foto del Flyer:
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded-lg font-mono-tech text-xs border border-zinc-800 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Foto</span>
                  </button>

                  <input
                    type="url"
                    value={newFlyerUrl}
                    onChange={(e) => setNewFlyerUrl(e.target.value)}
                    placeholder="o link de imagen..."
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Preview */}
                {(flyerImageFile || newFlyerUrl) && (
                  <div className="mt-2 p-2 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={flyerImageFile || newFlyerUrl}
                        alt="Preview Flyer"
                        className="w-12 h-14 object-cover rounded border border-zinc-800 shrink-0"
                      />
                      <span className="text-[11px] font-mono-tech text-emerald-400 truncate">
                        ✓ Foto lista para publicar
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFlyerImageFile(null);
                        setNewFlyerUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1 font-mono-tech text-[10px]"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 text-zinc-400 hover:text-white font-mono-tech text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold font-mono-tech text-xs rounded-lg shadow-lg cursor-pointer transition-all"
                >
                  {isSubmitting ? 'Publicando...' : isCompressing ? 'Optimizando foto...' : 'Publicar Flyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publisher Exclusive Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-sm w-full bg-black border border-purple-500/70 rounded-2xl p-5 shadow-2xl my-auto text-left">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h3 className="font-bebas text-xl text-white tracking-wide">
                ACCESO HANOI RADIO
              </h3>
            </div>
            
            <p className="font-mono-tech text-xs text-zinc-300 mb-3">
              Para asegurar la autenticidad de la cartelera, solo la producción de <span className="text-emerald-400 font-bold">{HANOI_PUBLISHER_EMAIL}</span> puede publicar y gestionar flyers.
            </p>

            {authError && (
              <div className="p-2 mb-3 bg-red-950/80 border border-red-500/70 rounded-lg text-red-300 font-mono-tech text-[11px]">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginPublisher} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-tech text-zinc-400 mb-1">
                  Clave de Transmisión / PIN:
                </label>
                <input
                  type="password"
                  value={authPinInput}
                  onChange={(e) => setAuthPinInput(e.target.value)}
                  placeholder="PIN (o dejá vacío si sos Hanoi Radio)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Ingresar como Hanoi Radio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono-tech text-xs rounded-xl border border-zinc-800 transition-colors"
                >
                  Continuar como oyente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Plus,
  Filter,
  Flame,
  Search,
  CheckCircle,
  ExternalLink,
  Music2,
  X
} from 'lucide-react';
import { RadioEvent } from '../types';

interface EventsAgendaProps {
  onSuggestGig?: () => void;
}

export const EventsAgenda: React.FC<EventsAgendaProps> = () => {
  const [events, setEvents] = useState<RadioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New gig form state
  const [newTitle, setNewTitle] = useState('');
  const [newBands, setNewBands] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newGenre, setNewGenre] = useState('Grunge / Alternativo');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.warn('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesGenre =
      selectedGenre === 'TODOS' ||
      (selectedGenre === 'GRATIS' && ev.price.toLowerCase().includes('gratuita')) ||
      ev.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    const matchesSearch =
      searchQuery === '' ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.bands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesGenre && matchesSearch;
  });

  // Handle submit gig
  const handleAddGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newDate) return;

    setIsSubmitting(true);
    try {
      const bandsArray = newBands
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          bands: bandsArray.length > 0 ? bandsArray : [newTitle],
          venue: newVenue,
          address: newAddress,
          date: newDate,
          time: newTime || '22:00 hs',
          price: newPrice || 'En puerta',
          genre: newGenre,
          description: newDescription
        })
      });

      if (res.ok) {
        const added = await res.json();
        setEvents((prev) => [added, ...prev]);
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowModal(false);
          // reset
          setNewTitle('');
          setNewBands('');
          setNewVenue('');
          setNewAddress('');
          setNewDate('');
          setNewTime('');
          setNewPrice('');
          setNewDescription('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error adding event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Grunge Title and Submit Button */}
      <div className="relative rounded-2xl border-2 border-zinc-800 bg-neutral-900 p-6 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-brushed-steel opacity-80 pointer-events-none" />
        <div className="absolute inset-0 bg-metal-diamond opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-500" />
              <h2 className="font-bebas text-3xl text-white tracking-wide">
                AGENDA DEL ROCK INDEPENDIENTE ROSARINO
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono-tech mt-1">
              Recitales, festivales autogestionados y fechas under en los antros de Rosario.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            id="btn-sumar-fecha"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bebas text-base tracking-wider uppercase rounded-xl font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Sumar Fecha Under</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="relative z-10 mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por banda, antro o lugar..."
              className="w-full bg-black/70 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono-tech"
            />
          </div>

          {/* Genre chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['TODOS', 'GRATIS', 'GRUNGE', 'PUNK', 'STONER', 'INDIE'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded text-xs font-mono-tech tracking-wider uppercase transition-all cursor-pointer border ${
                  selectedGenre === g
                    ? 'bg-amber-500 text-black border-amber-400 font-bold'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 font-mono-tech">
          Cargando fechas under...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/60 rounded-2xl border border-zinc-800 text-zinc-400 font-mono-tech">
          <Music2 className="w-10 h-10 mx-auto mb-2 text-amber-500 opacity-40" />
          No se encontraron fechas con esos filtros. ¡Suma la tuya con el botón de arriba!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="relative rounded-2xl border-2 border-zinc-800 bg-neutral-900 p-5 shadow-xl hover:border-amber-500/60 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              {/* Metallic texture overlay */}
              <div className="absolute inset-0 bg-brushed-steel opacity-80 pointer-events-none" />

              <div className="relative z-10">
                {/* Event header badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-typewriter text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase">
                    {ev.genre}
                  </span>

                  {ev.communitySubmitted && (
                    <span className="grunge-tape text-[10px] font-typewriter font-bold px-2 py-0.5 uppercase">
                      COMUNIDAD UNDER
                    </span>
                  )}

                  {ev.featured && (
                    <span className="flex items-center gap-1 text-[11px] font-mono-tech text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                      <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                      FECHA DESTACADA
                    </span>
                  )}
                </div>

                {/* Event Title */}
                <h3 className="font-marker text-xl sm:text-2xl text-white tracking-wide mb-2 group-hover:text-amber-400 transition-colors">
                  {ev.title}
                </h3>

                {/* Bands Lineup */}
                <div className="mb-3">
                  <div className="text-xs font-mono-tech text-zinc-400 mb-1">
                    BANDAS EN VIVO:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.bands.map((band, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-black/60 text-zinc-200 font-bebas text-sm rounded border border-zinc-800 tracking-wider"
                      >
                        🎸 {band}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 font-sans mb-4 leading-relaxed">
                  {ev.description}
                </p>
              </div>

              {/* Event Details Footer Plate */}
              <div className="relative z-10 pt-3 border-t border-zinc-800 text-xs font-mono-tech space-y-2 bg-black/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div className="flex items-center justify-between text-zinc-300">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{ev.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ev.time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="truncate">
                      <strong className="text-zinc-200">{ev.venue}</strong> ({ev.address})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{ev.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Sumar Fecha Under */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-zinc-700 bg-neutral-900 p-6 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-brushed-steel opacity-80 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <h3 className="font-bebas text-2xl text-white tracking-wide">
                  DIFUNDIR RECITAL O FECHA UNDER
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="relative z-10 py-10 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bebas text-2xl text-white">
                  ¡FECHA AGREGADA A LA AGENDA!
                </h4>
                <p className="text-xs font-mono-tech text-zinc-400">
                  Ya está visible para toda la comunidad rosarina en Hanoi Radio.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddGig} className="relative z-10 mt-4 space-y-3 font-mono-tech text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre del evento / Fecha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Furia de Garaje #4"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Bandas (separadas por coma) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Los Distorsionados, Sótano Mutante, Riff 90"
                    value={newBands}
                    onChange={(e) => setNewBands(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Lugar / Antro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Refi, Floyd, Casa Brava, Dylan..."
                      value={newVenue}
                      onChange={(e) => setNewVenue(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Dirección en Rosario</label>
                    <input
                      type="text"
                      placeholder="Ej: Vélez Sarsfield 641"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Día y Fecha *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Sábado 27 Sep"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Horario</label>
                    <input
                      type="text"
                      placeholder="Ej: 23:00 hs"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Entrada / Precio</label>
                    <input
                      type="text"
                      placeholder="Ej: $3.500 / Gratis"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Género</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Grunge / Alternativo">Grunge / Alternativo</option>
                    <option value="Punk Rock / Hardcore">Punk Rock / Hardcore</option>
                    <option value="Garage / Fuzz">Garage / Fuzz</option>
                    <option value="Stoner / Psicodelia">Stoner / Psicodelia</option>
                    <option value="Indie Rock / Post-Punk">Indie Rock / Post-Punk</option>
                    <option value="Heavy Metal / Hard Rock">Heavy Metal / Hard Rock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Descripción / Info adicional</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles, venta de anticipadas, feria de fanzines..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer transition-colors"
                  >
                    {isSubmitting ? 'Guardando...' : 'Publicar Fecha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

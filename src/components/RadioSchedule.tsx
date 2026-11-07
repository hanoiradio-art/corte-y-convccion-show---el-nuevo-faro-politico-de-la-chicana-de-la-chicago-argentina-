import React from 'react';
import { Clock, Radio, Mail, Send, Disc, Sparkles, Flame, Headphones } from 'lucide-react';
import { RadioShow } from '../types';

interface RadioScheduleProps {
  currentShow: RadioShow;
}

const ALL_SHOWS: RadioShow[] = [
  {
    id: 'show-1',
    title: 'Trinchera Under',
    host: 'Facu "El Mugre" & Vicky Riff',
    timeSlot: '20:00 - 23:00 hs',
    days: 'Lunes a Viernes',
    description: 'El núcleo del rock independiente santafesino. Entrevistas a bandas emergentes de Rosario, estrenos de maquetas y garaje crudo.',
    genre: 'Grunge / Punk / Stoner'
  },
  {
    id: 'show-2',
    title: 'Distorsión Rosarina',
    host: 'El Gordo Valvular',
    timeSlot: '23:00 - 02:00 hs',
    days: 'Lunes a Jueves',
    description: 'Arqueología sónica del under rosarino: desde los sótanos de los 80/90 hasta el nuevo sonido que hierve en los galpones de la ciudad.',
    genre: 'Rock Under Rosario / Garage'
  },
  {
    id: 'show-3',
    title: 'Furia de Sábado (La Previa del Pogo)',
    host: 'DJ Púa Gastada',
    timeSlot: '21:00 - 03:00 hs',
    days: 'Viernes y Sábados',
    description: 'El setlist definitivo antes de salir a los antros. Distorsión valvular, punk rabioso y grunge sin concesiones.',
    genre: 'Hard Rock / Alternativo / Heavy'
  },
  {
    id: 'show-4',
    title: 'Resaca del Paraná',
    host: 'Nico Acústico',
    timeSlot: '16:00 - 19:00 hs',
    days: 'Domingos',
    description: 'Lado B, zapadas en vivo grabadas en salas de ensayo de Pichincha y acústicos con sabor a río.',
    genre: 'Indie / Acústico / Lo-Fi'
  },
  {
    id: 'show-5',
    title: 'Hanoi Trasnoche: Valvular Continuo',
    host: 'Música en Rotación Automática',
    timeSlot: '03:00 - 08:00 hs',
    days: 'Todos los días',
    description: 'Playlist sin cortes de rock independiente latinoamericano, grunge, post-punk y stoner para los insomnes del litoral.',
    genre: 'Rock Continuo 24/7'
  }
];

export const RadioSchedule: React.FC<RadioScheduleProps> = ({ currentShow }) => {
  return (
    <div className="space-y-6">
      {/* Schedule Banner */}
      <div className="relative rounded-2xl border-2 border-zinc-800 bg-neutral-900 p-6 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-brushed-steel opacity-80 pointer-events-none" />
        <div className="absolute inset-0 bg-metal-diamond opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Headphones className="w-6 h-6 text-amber-500" />
              <h2 className="font-bebas text-3xl text-white tracking-wide">
                GRILLA DE PROGRAMACIÓN • HANOI RADIO
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono-tech mt-1">
              Programas en vivo, conductores under y sesiones de garage las 24 horas del día.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono-tech text-amber-400">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>EN EL AIRE: {currentShow.title}</span>
          </div>
        </div>
      </div>

      {/* Shows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_SHOWS.map((show) => {
          const isCurrent = show.id === currentShow.id;
          return (
            <div
              key={show.id}
              className={`relative rounded-2xl border-2 p-5 overflow-hidden transition-all duration-200 ${
                isCurrent
                  ? 'border-amber-500 bg-neutral-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'border-zinc-800 bg-neutral-900/90 hover:border-zinc-700'
              }`}
            >
              <div className="absolute inset-0 bg-brushed-steel opacity-70 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-typewriter text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                    {show.days}
                  </span>

                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] font-mono-tech font-bold text-black bg-amber-500 px-2 py-0.5 rounded shadow">
                      <Flame className="w-3 h-3" />
                      AL AIRE AHORA
                    </span>
                  )}
                </div>

                <h3 className="font-marker text-2xl text-white tracking-wide mb-1">
                  {show.title}
                </h3>

                <div className="text-xs font-mono-tech text-amber-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{show.timeSlot}</span>
                  <span>•</span>
                  <span className="text-zinc-400">Conduce: {show.host}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  {show.description}
                </p>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono-tech text-zinc-500">
                  <span>GÉNERO: {show.genre}</span>
                  <span className="text-zinc-600">ESTUDIO HANOI</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Band Demo Submission Banner */}
      <div className="relative rounded-2xl border-2 border-amber-600/50 bg-gradient-to-br from-zinc-950 via-neutral-900 to-black p-6 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="grunge-tape text-[10px] font-typewriter font-bold px-2 py-0.5 uppercase">
              CONVOCATORIA ABIERTA A BANDAS
            </span>
            <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide">
              ¿TENÉS UNA BANDA EN ROSARIO O ALREDEDORES?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono-tech max-w-xl">
              Mandanos tus maquetas, singles, grabaciones de ensayo o discos en formato MP3/WAV o enlace a Spotify/Bandcamp. En Hanoi Radio le damos rotación a todo el rock independiente.
            </p>
          </div>

          <a
            href="mailto:hanoiradio.ar@gmail.com?subject=Material de Banda para Hanoi Radio"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bebas text-base tracking-wider uppercase rounded-xl font-bold transition-colors shrink-0 shadow-lg cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Enviar Demo a hanoiradio.ar@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
};

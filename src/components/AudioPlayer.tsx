import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Zap,
  RotateCw,
  ChevronDown,
  Flame,
  Volume1
} from 'lucide-react';
import { RadioShow } from '../types';

interface AudioPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onlineListeners: number;
  currentShow: RadioShow;
  onOpenChat: () => void;
  onOpenAiTraining: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  setIsPlaying,
  onlineListeners,
  currentShow,
  onOpenChat,
  onOpenAiTraining
}) => {
  const STREAM_URL = 'https://stream.zeno.fm/hkvjd6xjst5uv';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Frequency spectrum animated bars
  const [bars, setBars] = useState<number[]>([
    15, 25, 45, 65, 80, 95, 75, 55, 70, 88, 92, 60, 45, 75, 85, 90, 65, 50, 40, 70, 85, 60, 45, 30, 20
  ]);

  // Visualizer rhythm animation with smooth modulation when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isBuffering) {
      interval = setInterval(() => {
        setBars((prev) =>
          prev.map((_, idx) => {
            const baseline = idx < 6 ? 35 : idx < 18 ? 48 : 28;
            return Math.floor(Math.random() * (95 - baseline)) + baseline;
          })
        );
      }, 140);
    } else {
      setBars(new Array(25).fill(8));
    }
    return () => clearInterval(interval);
  }, [isPlaying, isBuffering]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play / Stop toggle
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      setStreamError(null);
      setIsBuffering(true);
      
      // Cache-busting on live stream ensures immediate connection without delay
      const cacheBustUrl = `${STREAM_URL}?nocache=${Date.now()}`;
      audioRef.current.src = cacheBustUrl;

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsBuffering(false);
      } catch (err) {
        console.warn('Playback error:', err);
        setIsBuffering(false);
        setIsPlaying(false);
        setStreamError('Presiona para reconectar la transmisión en vivo');
      }
    }
  };

  const scrollToAgenda = () => {
    const el = document.getElementById('agenda-flyers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full">
      {/* Native Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onError={() => {
          setIsBuffering(false);
          setStreamError('Reconectando señal de Hanoi Radio...');
        }}
      />

      {/* 
        HERO SECTION: OCUPA EL 65% DE LA PANTALLA (65vh)
        Fondo negro absoluto, optimizado para móvil con botón central protagonista
      */}
      <div className="min-h-[62vh] sm:min-h-[65vh] flex flex-col items-center justify-between py-5 px-3 sm:px-4 relative overflow-hidden rounded-3xl bg-black border border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,1)]">
        
        {/* Background metallic speaker texture */}
        <div className="absolute inset-0 bg-speaker-grille opacity-30 pointer-events-none" />
        
        {/* Top Minimal Info Bar */}
        <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono-tech max-w-xl px-1">
          {/* Status: Red indicator */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-zinc-700'}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isPlaying ? 'text-red-400' : 'text-zinc-500'}`}>
              {isPlaying ? 'EN EL AIRE' : 'SEÑAL LISTA'}
            </span>
          </div>

          {/* Secondary Accent: Violet Frequency */}
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold tracking-widest text-xs px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/50">
              98.9 MHZ
            </span>
          </div>
        </div>

        {/* 
          CENTRAL PROTAGONIST:
          EL BOTÓN DE REPRODUCTOR GIGANTE QUE COMANDA EL 65% DE LA PANTALLA (VERDE PRIMARIO)
        */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          {/* Animated Green Glow Aura when Playing */}
          <div
            className={`absolute w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full transition-all duration-700 pointer-events-none ${
              isPlaying
                ? 'bg-emerald-500/20 blur-3xl animate-pulse scale-110'
                : 'bg-transparent'
            }`}
          />

          {/* Stompbox Outer Rim - Dark Industrial */}
          <div className="relative p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-950 to-black border-2 border-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.05)]">
            {/* Corner Industrial Studs */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner" />

            {/* Main Interactive Button: 1st Priority VERDE */}
            <button
              onClick={togglePlay}
              id="btn-main-player-hero"
              aria-label={isPlaying ? 'Pausar Hanoi Radio' : 'Reproducir Hanoi Radio'}
              className={`group relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 cursor-pointer select-none overflow-hidden ${
                isPlaying
                  ? 'bg-gradient-to-b from-emerald-500 via-green-600 to-emerald-700 text-black shadow-[0_0_50px_rgba(34,197,94,0.6),inset_0_-8px_16px_rgba(0,0,0,0.5)] border-2 border-emerald-300'
                  : 'bg-gradient-to-b from-zinc-900 via-black to-black text-emerald-400 hover:text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_4px_8px_rgba(34,197,94,0.15)] border-2 border-emerald-500/50 hover:border-emerald-400'
              }`}
            >
              {/* Radial Texture */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.5)_70%)] pointer-events-none" />

              {/* Central Play/Pause Glyph */}
              {isBuffering ? (
                <RotateCw className="w-16 h-16 sm:w-20 sm:h-20 animate-spin text-emerald-400 z-10" />
              ) : isPlaying ? (
                <div className="flex flex-col items-center z-10">
                  <Pause className="w-16 h-16 sm:w-20 sm:h-20 fill-current drop-shadow-md group-hover:scale-105 transition-transform text-black" />
                  <span className="font-bebas text-lg sm:text-xl tracking-widest uppercase mt-1 text-black font-black">
                    EN VIVO
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center z-10 pl-2">
                  <Play className="w-18 h-18 sm:w-22 sm:h-22 fill-current drop-shadow-lg group-hover:scale-110 transition-transform text-emerald-400" />
                  <span className="font-bebas text-lg sm:text-xl tracking-widest uppercase mt-1 text-white font-bold">
                    SINTONIZAR
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Carátula del Programa & Barra Visualizadora */}
          <div className="mt-3.5 w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center">
            {/* Carátula del Programa Card */}
            <div className="w-full flex items-center gap-3 p-2 bg-zinc-950/90 rounded-2xl border border-zinc-800/80 shadow-xl">
              {/* Imagen de la Carátula */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700/80 bg-black">
                <img
                  src="/src/assets/images/show_cover_trinchera_1789615761438.jpg"
                  alt={`Carátula del programa ${currentShow.title}`}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isPlaying ? 'scale-105 contrast-105 brightness-105' : 'grayscale opacity-60'
                  }`}
                />
                {isPlaying && (
                  <div className="absolute top-1 right-1 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 relative shadow-sm" />
                  </div>
                )}
              </div>

              {/* Información del Programa */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[8px] font-mono-tech font-bold px-1.5 py-0.2 rounded uppercase border transition-colors ${
                      isPlaying
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isPlaying ? 'AL AIRE' : 'PRÓXIMO'}
                  </span>
                  <span className="text-[10px] font-mono-tech text-purple-300">
                    {currentShow.timeSlot}
                  </span>
                </div>
                <h2 className="font-bebas text-lg sm:text-xl text-white tracking-wider truncate leading-tight mt-0.5">
                  {currentShow.title}
                </h2>
                <p className="text-[11px] font-mono-tech text-zinc-400 truncate">
                  {currentShow.host}
                </p>
              </div>
            </div>

            {/* BARRA VISUALIZADORA DE AUDIO DEBAJO DE LA CARÁTULA */}
            <div
              id="audio-visualizer-bar"
              className={`w-full mt-2 p-2 sm:p-2.5 rounded-xl border transition-all duration-500 ease-in-out ${
                isPlaying
                  ? 'bg-black/95 border-emerald-500/70 shadow-neon-green animate-neon-pulse'
                  : 'bg-zinc-950/60 border-zinc-900 shadow-none'
              }`}
            >
              {/* Encabezado del visualizador */}
              <div className="flex items-center justify-between text-[9px] font-mono-tech mb-1.5 transition-colors duration-300">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`font-bold tracking-wider uppercase transition-colors duration-300 ${
                      isPlaying ? 'text-emerald-400' : 'text-zinc-600'
                    }`}
                  >
                    {isPlaying ? 'ESPECTRO DE AUDIO EN VIVO' : 'VISUALIZADOR EN ESPERA'}
                  </span>
                </div>
                <span
                  className={`transition-colors duration-300 font-bold ${
                    isPlaying ? 'text-emerald-300' : 'text-zinc-600'
                  }`}
                >
                  {isPlaying ? '98.9 FM • 128 KBPS' : 'OFFLINE'}
                </span>
              </div>

              {/* Barras de ecualizador con transiciones suaves y color verde neón */}
              <div className="relative flex items-end justify-between gap-1 h-7 sm:h-8 px-1 overflow-hidden">
                {bars.map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-200 ease-out ${
                      isPlaying
                        ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-green-300 animate-neon-bar-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                        : 'bg-zinc-800/60'
                    }`}
                    style={{
                      height: `${height}%`,
                      transition: 'height 180ms ease-out, background-color 500ms ease, box-shadow 500ms ease'
                    }}
                  />
                ))}
              </div>

              {/* Línea horizontal de pulso verde neón en la base */}
              <div
                className={`mt-1.5 h-0.5 w-full rounded-full transition-all duration-500 ease-in-out ${
                  isPlaying
                    ? 'bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-500 shadow-[0_0_10px_#22c55e] animate-neon-pulse'
                    : 'bg-zinc-900'
                }`}
              />
            </div>

            {streamError && (
              <p className="text-xs font-mono-tech text-red-400 animate-pulse mt-1.5">
                {streamError}
              </p>
            )}
          </div>
        </div>

        {/* Minimal Bottom Bar - Volume & Quick Links (Thumb-friendly) */}
        <div className="relative z-10 w-full max-w-xl flex items-center justify-between gap-3 pt-2.5 border-t border-zinc-900">
          {/* Master Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              id="btn-volume-mute"
              className="text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer p-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 sm:w-28 accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Direct Nav Buttons with Violet & Red hierarchy */}
          <div className="flex items-center gap-2">
            <button
              onClick={scrollToAgenda}
              className="px-2.5 py-1.5 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono-tech transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Flyers</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            </button>

            <button
              onClick={onOpenAiTraining}
              className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono-tech transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Hanoi AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

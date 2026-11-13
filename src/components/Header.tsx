import React from 'react';
import { Radio, Flame, Share2, Disc3, Sparkles, Image, MessageSquare, ShieldCheck, Lock, Smartphone, Bell, BellRing } from 'lucide-react';

interface HeaderProps {
  isPlaying: boolean;
  onlineListeners: number;
  onShare: () => void;
  onOpenDeveloperModal: (tab?: 'ai' | 'station' | 'flyers' | 'playstore' | 'seo') => void;
  isDeveloperMode: boolean;
  onToggleDeveloperMode?: () => void;
  isPushSubscribed?: boolean;
  onTogglePush?: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  onlineListeners,
  onShare,
  onOpenDeveloperModal,
  isDeveloperMode,
  isPushSubscribed,
  onTogglePush,
  onOpenInstallModal
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Live status - Compact & sleek for mobile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-black border border-emerald-500/40 flex items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(34,197,94,0.2)]">
            <div className="absolute inset-0 bg-speaker-grille opacity-60" />
            <Disc3 className={`w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 z-10 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-graffiti text-xl sm:text-2xl text-white tracking-wide spray-shadow-green leading-none">
                HANOI <span className="text-emerald-400">RADIO</span>
              </span>
              <span className="grunge-tape-violet font-typewriter text-[9px] font-bold px-1 py-0.2 rounded-sm text-black hidden xs:inline">
                98.9
              </span>
            </div>
            
            {/* Direct status indicator: Red for Live/Standby */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 'bg-zinc-700'}`} />
              <span className={isPlaying ? 'text-red-400 font-bold' : 'text-zinc-500'}>
                {isPlaying ? 'EN VIVO' : 'STANDBY'}
              </span>
              <span className="text-zinc-700">•</span>
              <span className="text-purple-400 flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-purple-400" />
                {onlineListeners}
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Navigation & Quick Action Buttons */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => scrollTo('agenda-flyers')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-mono-tech text-purple-300 hover:text-white bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/30 rounded-lg transition-colors cursor-pointer"
            title="Cartelera de Flyers"
          >
            <Image className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-bold">Flyers</span>
          </button>

          <button
            onClick={() => scrollTo('chat-ia')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-mono-tech text-emerald-300 hover:text-white bg-emerald-950/20 hover:bg-emerald-900/40 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
            title="Chat en Vivo"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold">Chat</span>
          </button>

          <button
            onClick={() => {
              if (onOpenInstallModal) {
                onOpenInstallModal();
              } else {
                onOpenDeveloperModal('playstore');
              }
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-mono-tech text-emerald-300 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
            title="Instalar App Oficial Hanoi Radio & Google Play Store"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold">App Oficial</span>
          </button>

          {/* Developer Mode Action */}
          {isDeveloperMode ? (
            <button
              onClick={() => onOpenDeveloperModal('ai')}
              id="btn-dev-studio-active"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-mono-tech text-purple-300 hover:text-white bg-purple-900/50 hover:bg-purple-800/70 border border-purple-400 rounded-lg transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
              title="Panel del Director de Estudio Activo"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span className="text-[11px] font-bold">Modo Dev</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDeveloperModal('ai')}
              id="btn-dev-studio-login"
              className="flex items-center gap-1 px-2 sm:px-2 py-1.5 text-xs font-mono-tech text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Acceso exclusivo Director / Desarrollador Hanoi Radio"
            >
              <Lock className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] hidden md:inline">Director</span>
            </button>
          )}

          {/* Push Notifications Bell for Listeners */}
          {onTogglePush && (
            <button
              onClick={onTogglePush}
              id="btn-header-push-alerts"
              title={isPushSubscribed ? 'Notificaciones de programas en vivo activadas' : 'Activar avisos cuando empiece un programa en vivo'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center relative ${
                isPushSubscribed
                  ? 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-900'
              }`}
            >
              {isPushSubscribed ? (
                <>
                  <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
                </>
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={onShare}
            id="btn-share-radio"
            title="Compartir enlace de la radio"
            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};

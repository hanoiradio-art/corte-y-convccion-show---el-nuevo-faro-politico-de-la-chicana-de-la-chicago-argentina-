import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';
import { FlyersAgenda } from './components/FlyersAgenda';
import { CommunityChat } from './components/CommunityChat';
import { DeveloperControlModal } from './components/DeveloperControlModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Footer } from './components/Footer';
import { RadioShow } from './types';
import { Check, ShieldCheck, Lock, Unlock, Settings, LogOut } from 'lucide-react';

const DEFAULT_SHOW: RadioShow = {
  id: 'show-1',
  title: 'Trinchera Under',
  host: 'Facu "El Mugre" & Vicky Riff',
  timeSlot: '20:00 - 23:00 hs',
  days: 'Lunes a Viernes',
  description: 'El núcleo del rock independiente santafesino. Entrevistas a bandas emergentes, lanzamientos y garaje crudo.',
  genre: 'Grunge / Punk / Stoner'
};

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [onlineListeners, setOnlineListeners] = useState<number>(38);
  const [currentShow, setCurrentShow] = useState<RadioShow>(DEFAULT_SHOW);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Developer / Admin Exclusive Mode
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    return localStorage.getItem('hanoi_developer_mode') === 'true';
  });
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState<boolean>(false);
  const [developerModalTab, setDeveloperModalTab] = useState<'ai' | 'station' | 'flyers' | 'playstore'>('ai');

  // Ref to trigger flyer publication dialog from Developer modal
  const flyerSubmitOpenerRef = useRef<(() => void) | null>(null);

  // Poll or fetch initial radio station info
  useEffect(() => {
    fetch('/api/radio-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.currentShow) setCurrentShow(data.currentShow);
        if (data.activeListeners) setOnlineListeners(data.activeListeners);
      })
      .catch(() => {});
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const scrollToChat = () => {
    const el = document.getElementById('chat-ia');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenDeveloperModal = (tab: 'ai' | 'station' | 'flyers' | 'playstore' = 'ai') => {
    setDeveloperModalTab(tab);
    setIsDeveloperModalOpen(true);
  };

  const handleUnlockDeveloperMode = () => {
    setIsDeveloperMode(true);
    localStorage.setItem('hanoi_developer_mode', 'true');
    localStorage.setItem('hanoi_publisher_auth', 'true');
  };

  const handleExitDeveloperMode = () => {
    setIsDeveloperMode(false);
    localStorage.setItem('hanoi_developer_mode', 'false');
    localStorage.setItem('hanoi_publisher_auth', 'false');
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Background industrial dark texture */}
      <div className="fixed inset-0 bg-speaker-grille opacity-15 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-black pointer-events-none z-0" />

      {/* Developer Active Studio Banner (Only visible when developer mode is enabled) */}
      {isDeveloperMode && (
        <aside
          aria-label="Barra de herramientas de estudio para desarrollador"
          className="sticky top-0 z-50 bg-gradient-to-r from-purple-950 via-zinc-950 to-purple-950 border-b border-purple-500/70 px-3 py-1.5 flex items-center justify-between text-xs font-mono-tech shadow-[0_4px_15px_rgba(168,85,247,0.3)] backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Modo Desarrollador Activo</span>
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-300 hidden sm:inline">hanoiradio.ar@gmail.com</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenDeveloperModal('ai')}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1 shadow-sm"
              title="Abrir Centro de Control del Desarrollador"
            >
              <Settings className="w-3 h-3" />
              <span>Panel Director</span>
            </button>
            <button
              onClick={handleExitDeveloperMode}
              className="px-2 py-1 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1"
              title="Salir del modo desarrollador y ver la app como oyente"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden xs:inline">Salir</span>
            </button>
          </div>
        </aside>
      )}

      {/* PWA Direct Install Banner (Android, PC, iOS) */}
      <PWAInstallBanner />

      {/* Header */}
      <Header
        isPlaying={isPlaying}
        onlineListeners={onlineListeners}
        onShare={handleShare}
        onOpenDeveloperModal={handleOpenDeveloperModal}
        isDeveloperMode={isDeveloperMode}
      />

      {/* Copy link notification alert */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-2 rounded-xl font-mono-tech font-bold text-xs shadow-2xl flex items-center gap-2 border-2 border-emerald-300 animate-bounce">
          <Check className="w-4 h-4 text-black" />
          ¡Enlace de Hanoi Radio copiado!
        </div>
      )}

      {/* Main Single-Flow Hierarchical Structure */}
      <main className="relative z-10 flex-1 w-full flex flex-col">
        {/* 
          JERARQUÍA 1: 
          EL BOTÓN DE REPRODUCTOR OCUPANDO EL 65% DE LA PANTALLA
        */}
        <section id="reproductor" className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-5">
          <AudioPlayer
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onlineListeners={onlineListeners}
            currentShow={currentShow}
            onOpenChat={scrollToChat}
            onOpenAiTraining={() => handleOpenDeveloperModal('ai')}
          />
        </section>

        {/* 
          JERARQUÍA 2: 
          AGENDA DE RECITALES EN FLYERS DE FOTOS CON TODA LA INFORMACIÓN EN LA IMAGEN
        */}
        <div className="w-full border-t border-zinc-900 bg-black">
          <FlyersAgenda
            isDeveloperMode={isDeveloperMode}
            onRequestDeveloperMode={() => handleOpenDeveloperModal('flyers')}
            onRegisterOpenSubmit={(fn) => {
              flyerSubmitOpenerRef.current = fn;
            }}
          />
        </div>

        {/* 
          JERARQUÍA 3: 
          CHAT EN VIVO CONTROLADO Y MODERADO POR LA IA DE HANOI RADIO
        */}
        <div className="w-full border-t border-zinc-900 bg-black">
          <CommunityChat
            onlineCount={onlineListeners}
            onOpenAiTraining={() => handleOpenDeveloperModal('ai')}
          />
        </div>
      </main>

      {/* Developer & AI Studio Control Center Modal */}
      <DeveloperControlModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        isDeveloperMode={isDeveloperMode}
        onUnlockDeveloperMode={handleUnlockDeveloperMode}
        onOpenFlyerPublish={() => {
          if (flyerSubmitOpenerRef.current) {
            flyerSubmitOpenerRef.current();
          }
        }}
        initialTab={developerModalTab}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

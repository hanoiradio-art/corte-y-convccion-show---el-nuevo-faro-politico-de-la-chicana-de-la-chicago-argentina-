import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppInstallModal } from './AppInstallModal';

interface PWAInstallBannerProps {
  onOpenInstallModal?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenInstallModal }) => {
  const { isInstallable, isInstalled, browserInfo, install } = usePWAInstall();
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Suppress when already running standalone or user dismissed for this session
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    // Attempt native prompt if available
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
    }
    // If native prompt is not supported or not triggered, open the guide modal
    if (onOpenInstallModal) {
      onOpenInstallModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  const handleOpenGuide = () => {
    if (onOpenInstallModal) {
      onOpenInstallModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  return (
    <>
      <aside
        aria-label="Instalar aplicación oficial"
        className="w-full bg-gradient-to-r from-zinc-950 via-emerald-950/40 to-zinc-950 border-b border-emerald-500/30 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-mono-tech relative z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Info pill */}
          <div className="flex items-center gap-2 text-center sm:text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight flex items-center gap-1.5 justify-center sm:justify-start">
                <span>APP OFICIAL HANOI RADIO</span>
                <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                  100% GRATIS
                </span>
              </p>
              <p className="text-zinc-400 text-[11px] leading-tight">
                Instalala en tu celular para escuchar en segundo plano, sin cortes y acceso directo en tu pantalla.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar en 1 clic</span>
              </button>
            ) : browserInfo.isIOS ? (
              <button
                onClick={handleOpenGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-bold font-mono-tech text-xs rounded-xl transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar en iPhone / iPad</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
                title="Instalar App Oficial en tu dispositivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App Oficial</span>
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Internal Modal when not handled externally */}
      {!onOpenInstallModal && (
        <AppInstallModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
        />
      )}
    </>
  );
};

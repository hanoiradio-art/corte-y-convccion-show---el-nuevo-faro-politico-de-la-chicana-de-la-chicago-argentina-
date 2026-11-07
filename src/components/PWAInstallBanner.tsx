import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Suppress when already running standalone or user dismissed for this session
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <aside aria-label="Instalar aplicación oficial" className="w-full bg-gradient-to-r from-zinc-950 via-emerald-950/40 to-zinc-950 border-b border-emerald-500/30 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-mono-tech relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Info pill */}
          <div className="flex items-center gap-2 text-center sm:text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
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
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar en Android / PC</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-bold font-mono-tech text-xs rounded-xl transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar en iPhone / iPad</span>
              </button>
            )}

            {!isInstallable && !isIOS && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer"
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

      {/* iOS Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-sm w-full bg-black border border-emerald-500/60 rounded-2xl p-5 shadow-2xl my-auto text-left">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-white rounded-lg bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bebas text-xl text-white tracking-wide">
                INSTALAR EN IPHONE O IPAD
              </h3>
            </div>

            <p className="font-mono-tech text-xs text-zinc-300 mb-3 leading-relaxed">
              Apple Safari te permite instalar Hanoi Radio como app nativa gratuita en 2 simples pasos:
            </p>

            <ol className="space-y-2.5 p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono-tech text-xs text-zinc-300 mb-4">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Tocá el botón <strong>Compartir</strong> (icono con la flecha hacia arriba en Safari).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>Deslizá hacia abajo y seleccioná <strong>"Agregar a pantalla de inicio"</strong>.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

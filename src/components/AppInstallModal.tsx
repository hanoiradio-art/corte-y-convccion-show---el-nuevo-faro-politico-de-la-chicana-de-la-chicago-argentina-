import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Check,
  X,
  ExternalLink,
  Laptop,
  Apple,
  Share2,
  Sparkles,
  ShieldCheck,
  Radio,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, browserInfo, install } = usePWAInstall();

  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'desktop' | 'playstore'>('android');
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sync default tab when browserInfo updates
  useEffect(() => {
    if (browserInfo.isIOS) {
      setDeviceTab('ios');
    } else if (browserInfo.isAndroid) {
      setDeviceTab('android');
    } else if (!browserInfo.isMobile) {
      setDeviceTab('desktop');
    } else {
      setDeviceTab('android');
    }
  }, [browserInfo.isIOS, browserInfo.isAndroid, browserInfo.isMobile]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleDirectInstall = async () => {
    setInstallStatus('Iniciando instalación...');
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('¡Instalación completada con éxito!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (result === 'dismissed') {
      setInstallStatus('Instalación cancelada. Podés reintentar cuando quieras.');
    } else {
      setInstallStatus('Tu navegador requiere seguir los pasos manuales de abajo (o abrir el enlace directo en Chrome / Safari).');
    }
  };

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }).catch(() => {});
    }
  };

  const needsExternalBrowser = browserInfo.isInIframe || browserInfo.isInAppBrowser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-zinc-950 via-emerald-950/40 to-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bebas text-2xl text-white tracking-wide leading-tight flex items-center gap-2">
                <span>APP OFICIAL HANOI RADIO</span>
                <span className="bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase font-mono-tech">
                  100% GRATIS
                </span>
              </h3>
              <p className="font-mono-tech text-[11px] text-zinc-400">
                Instalá la radio en tu pantalla de inicio con sonido en segundo plano y sin cortes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Iframe / In-App Browser Warning (Critical for Mobile) */}
        {needsExternalBrowser && (
          <div className="bg-amber-950/70 border-b border-amber-500/50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono-tech text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-snug">
                {browserInfo.isInAppBrowser
                  ? 'Abriste la radio desde un navegador interno (WhatsApp, Instagram o Facebook). Por seguridad, Android y iPhone bloquean instalar apps desde ahí. Abrí este link en Chrome o Safari:'
                  : 'Estás viendo la vista previa incrustada. Para que tu celular muestre el botón "Instalar App", abrila directamente en una pestaña nueva de Chrome (Android) o Safari (iPhone):'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <a
                href={typeof window !== 'undefined' ? window.location.href : '/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-lg transition-colors text-[11px] flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en navegador</span>
              </a>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-bold rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Direct Install Hero Button if native prompt is ready */}
          {isInstallable && (
            <div className="p-4 bg-emerald-950/50 border-2 border-emerald-500/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bebas text-xl text-white flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>¡LISTA PARA INSTALAR EN 1 TOQUE!</span>
                </p>
                <p className="font-mono-tech text-xs text-zinc-200">
                  Tocá el botón verde para agregar Hanoi Radio a tu pantalla de inicio sin usar espacio extra.
                </p>
              </div>

              <button
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono-tech text-xs rounded-xl shadow-[0_0_18px_rgba(16,185,129,0.5)] transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instalar App Ahora</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl flex items-center gap-2 text-emerald-300 font-mono-tech text-xs">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Genial! Hanoi Radio ya está instalada y funcionando en modo nativo en este dispositivo.</span>
            </div>
          )}

          {installStatus && (
            <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-xs font-mono-tech text-white">
              {installStatus}
            </div>
          )}

          {/* Quick Copy Link Bar when not in iframe (helpful to send to own phone) */}
          {!needsExternalBrowser && (
            <div className="p-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-[11px] font-mono-tech">
              <span className="text-zinc-400 truncate">
                Link oficial: <strong className="text-zinc-200">{currentUrl}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 font-bold"
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar link'}</span>
              </button>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDeviceTab('android')}
                className={`flex-1 py-2 px-3 rounded-lg font-mono-tech text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  deviceTab === 'android'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setDeviceTab('ios')}
                className={`flex-1 py-2 px-3 rounded-lg font-mono-tech text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  deviceTab === 'ios'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setDeviceTab('desktop')}
                className={`flex-1 py-2 px-3 rounded-lg font-mono-tech text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  deviceTab === 'desktop'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>

              <button
                onClick={() => setDeviceTab('playstore')}
                className={`flex-1 py-2 px-3 rounded-lg font-mono-tech text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  deviceTab === 'playstore'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-purple-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Play Store & APK</span>
              </button>
            </div>
          </div>

          {/* TAB: ANDROID */}
          {deviceTab === 'android' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-bebas text-lg text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>CÓMO INSTALAR EN CELULARES ANDROID (CHROME, SAMSUNG, BRAVE)</span>
                </h4>

                <ol className="space-y-3 font-mono-tech text-xs text-zinc-300">
                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Asegurate de estar en Google Chrome (no en WhatsApp/Instagram)</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Si abriste el enlace desde otra app, tocá los tres puntitos arriba a la derecha y elegí <strong>"Abrir en Chrome"</strong>.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">Abrí el menú del navegador (⋮)</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Tocá los <strong>tres puntitos (⋮)</strong> arriba a la derecha en Chrome y seleccioná <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-white">Confirmá "Instalar"</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Se creará el icono oficial de <strong>Hanoi Radio 98.9</strong> en tu celular. Se abrirá sin barra de navegador y reproducirá música en segundo plano.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {isInstallable && (
                <div className="flex justify-center">
                  <button
                    onClick={handleDirectInstall}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-tech text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar automáticamente ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: IOS */}
          {deviceTab === 'ios' && (
            <div className="space-y-4 animate-fadeIn">
              {browserInfo.isIOS && !browserInfo.isSafari && (
                <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs font-mono-tech text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    En iPhone, Apple solo permite instalar apps desde <strong>Safari</strong> (no desde Chrome ni Instagram). Copiá el enlace de arriba y pegalo en Safari.
                  </span>
                </div>
              )}

              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-bebas text-lg text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-400" />
                  <span>CÓMO INSTALAR EN IPHONE O IPAD (APPLE SAFARI)</span>
                </h4>

                <ol className="space-y-3 font-mono-tech text-xs text-zinc-300">
                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <span>Tocá el botón Compartir en Safari</span>
                        <Share2 className="w-3.5 h-3.5 text-blue-400 inline" />
                      </p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        En la barra inferior de Safari, tocá el icono del cuadrado con la flecha hacia arriba.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">Elegí "Agregar a inicio" (+)</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Desplazá el menú hacia abajo, seleccioná <strong>"Agregar a inicio"</strong> y tocá <strong>"Agregar"</strong> arriba a la derecha.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: DESKTOP */}
          {deviceTab === 'desktop' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-bebas text-lg text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>CÓMO INSTALAR EN PC / MAC (CHROME, EDGE, BRAVE)</span>
                </h4>

                <ol className="space-y-3 font-mono-tech text-xs text-zinc-300">
                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Icono de instalación en la barra de direcciones</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Buscá a la derecha de la barra de direcciones el icono de una pantallita con flecha que dice <strong>"Instalar Hanoi Radio"</strong>.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">O desde el menú (⋮)</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Hacé clic en el menú (⋮) de Chrome o Edge → <strong>Guardar y compartir</strong> → <strong>"Instalar Hanoi Radio..."</strong>.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: PLAY STORE & APK */}
          {deviceTab === 'playstore' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-purple-950/30 border border-purple-500/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bebas text-lg text-white">
                    PUBLICAR EN GOOGLE PLAY STORE CON PWABUILDER (100% GRATIS)
                  </h4>
                </div>

                <p className="font-mono-tech text-xs text-zinc-300 leading-relaxed">
                  Tu radio ya cumple los requisitos de Google (Manifest, Service Worker e iconos 512x512). Podés generar el archivo <strong>.AAB / .APK</strong> para Play Store en 4 pasos:
                </p>

                <div className="space-y-2 font-mono-tech text-xs text-zinc-300">
                  <div className="p-2.5 bg-black/70 rounded-xl border border-zinc-800 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">1.</span>
                    <span>
                      Entrá en <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold">PWABuilder.com</a>.
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/70 rounded-xl border border-zinc-800 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">2.</span>
                    <span>
                      Ingresá la URL pública de tu radio ({currentUrl}).
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/70 rounded-xl border border-zinc-800 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">3.</span>
                    <span>
                      Elegí <strong>"Package for Android"</strong> (Package ID: <code className="text-purple-300">com.hanoiradio.app</code>).
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/70 rounded-xl border border-zinc-800 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">4.</span>
                    <span>
                      Descargá el APK (instalable directo por archivo) o el AAB para Google Play Console.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-900 font-mono-tech text-xs">
            <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300 text-[11px]">Segundo plano sin cortes</span>
            </div>
            <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300 text-[11px]">Cero publicidad ni costo</span>
            </div>
            <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300 text-[11px]">Acceso directo en pantalla</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] font-mono-tech text-zinc-500">
            Hanoi Radio 98.9 • Rosario, Argentina
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 font-mono-tech text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Bell, BellRing, X, Radio, Volume2, Sparkles, Check } from 'lucide-react';
import { PushNotificationAlert } from '../hooks/usePushNotifications';

interface PushNotificationPromptProps {
  alert: PushNotificationAlert | null;
  onDismiss: () => void;
  onTuneIn: () => void;
  isSubscribed: boolean;
  onEnable: () => void;
  isLoading: boolean;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  alert,
  onDismiss,
  onTuneIn,
  isSubscribed,
  onEnable,
  isLoading
}) => {
  return (
    <>
      {/* Active Live Show Incoming Push Alert Toast */}
      {alert && (
        <aside
          aria-label="Notificación de programa en vivo"
          className="fixed top-16 right-3 sm:right-6 z-50 max-w-sm w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_10px_40px_rgba(34,197,94,0.35)] animate-bounce font-mono-tech"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  AL AIRE AHORA
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[10px] text-zinc-400">{alert.timestamp}</span>
              </div>

              <h4 className="font-bebas text-lg text-white tracking-wide truncate leading-tight">
                {alert.title}
              </h4>
              <p className="text-xs text-zinc-300 leading-snug line-clamp-2 mt-0.5">
                {alert.body}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    onTuneIn();
                    onDismiss();
                  }}
                  className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sintonizar</span>
                </button>
                <button
                  onClick={onDismiss}
                  className="py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Discreet Banner to subscribe if not subscribed yet */}
      {!isSubscribed && (
        <aside
          aria-label="Activar notificaciones de programas"
          className="w-full bg-zinc-950/90 border-b border-purple-500/30 px-3 sm:px-4 py-1.5 text-xs font-mono-tech"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
              <span className="text-zinc-300 text-[11px] truncate">
                ¿Querés que te avisemos cuando empiece cada programa en vivo?
              </span>
            </div>

            <button
              onClick={onEnable}
              disabled={isLoading}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
            >
              <BellRing className="w-3 h-3" />
              <span>{isLoading ? 'Activando...' : 'Activar Avisos'}</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};

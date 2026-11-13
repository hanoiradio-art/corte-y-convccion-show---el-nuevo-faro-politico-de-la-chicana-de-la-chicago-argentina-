import React from 'react';
import { Mail, Radio, Heart, Disc, Volume2, Shield, Smartphone } from 'lucide-react';

interface FooterProps {
  onOpenInstallModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInstallModal }) => {
  return (
    <footer className="relative border-t border-zinc-900 bg-black mt-8 text-zinc-400 font-mono-tech text-xs overflow-hidden">
      {/* Decorative metallic rivets */}
      <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner opacity-40 pointer-events-none" />
      <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-5 border-b border-zinc-900">
          {/* Station Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-graffiti text-2xl text-white">
                HANOI <span className="text-emerald-400">RADIO</span>
              </span>
              <span className="grunge-tape-violet text-[9px] font-mono-tech font-bold px-1.5 py-0.5">
                ROSARIO
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Trinchera de difusión del rock independiente, garage, punk, stoner y grunge de Rosario y el litoral argentino.
            </p>
            {onOpenInstallModal && (
              <div className="pt-2">
                <button
                  onClick={onOpenInstallModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 hover:text-white rounded-lg transition-colors cursor-pointer text-[11px] font-bold"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instalar App Oficial (Gratis)</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct Stream Access & Frequencies */}
          <div className="space-y-1.5">
            <div className="font-bebas text-base text-zinc-300 tracking-wider">
              TRANSMISIÓN EN VIVO
            </div>
            <p className="text-xs text-zinc-500">
              Servidor Zeno Media MP3 128kbps en streaming continuo directo.
            </p>
            <div className="pt-0.5">
              <a
                href="https://stream.zeno.fm/hkvjd6xjst5uv"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline text-[11px]"
              >
                Abrir stream directo en ventana externa ↗
              </a>
            </div>
          </div>

          {/* Contact & Demos */}
          <div className="space-y-1.5">
            <div className="font-bebas text-base text-zinc-300 tracking-wider">
              CONTACTO & DIFUSIÓN
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <a
                href="mailto:hanoiradio.ar@gmail.com"
                className="hover:text-emerald-400 transition-colors"
              >
                hanoiradio.ar@gmail.com
              </a>
            </p>
            <p className="text-zinc-500 text-[11px]">
              Envianos material discográfico, fechas de recitales o notas a bandas.
            </p>
          </div>
        </div>

        {/* Bottom micro credit */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Hanoi Radio • Rosario, Argentina. Autogestión y distorsión.
          </div>
          <div className="flex items-center gap-2">
            <span>Comunidad del under rosarino</span>
            <span className="text-red-500">🤘</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

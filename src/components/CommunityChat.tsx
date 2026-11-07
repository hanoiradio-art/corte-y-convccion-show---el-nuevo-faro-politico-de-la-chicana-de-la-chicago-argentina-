import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Flame,
  ThumbsUp,
  MapPin,
  Smile,
  Shield,
  Zap,
  Users,
  RefreshCw,
  Bot,
  Sparkles,
  Settings
} from 'lucide-react';
import { ChatMessage } from '../types';

interface CommunityChatProps {
  onlineCount: number;
  onOpenAiTraining: () => void;
}

const BARRIOS_ROSARINOS = [
  'Pichincha',
  'Barrio Martin',
  'Echesortu',
  'Rosario Centro',
  'Fisherton',
  'Alberdi',
  'Arroyito',
  'Parque España',
  'Refi / Talleres',
  'Bella Vista',
  'Tiro Suizo',
  'Saladillo',
  'Granadero Baigorria'
];

const QUICK_SHOUTS = [
  '¡Aguante Hanoi Radio! 🤘',
  '¿Qué bandas tocan este sábado en Refi? 🎸',
  '¡Saludos desde Pichincha! 🍺',
  'Hanoi AI: recomendame una banda under rosarina 🔥',
  '¡Suban el volumen que tiemblan las paredes! ⚡'
];

export const CommunityChat: React.FC<CommunityChatProps> = ({ onlineCount, onOpenAiTraining }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('hanoi_nickname') || 'Rockero_' + Math.floor(Math.random() * 899 + 100);
  });
  const [barrio, setBarrio] = useState(() => {
    return localStorage.getItem('hanoi_barrio') || 'Pichincha';
  });
  const [badge, setBadge] = useState<'OYENTE' | 'BANDA' | 'GUITARRISTA' | 'DJ'>('OYENTE');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Connect WebSocket & fetch initial messages
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init') {
              if (msg.data.messages) {
                setMessages(msg.data.messages);
              }
            } else if (msg.type === 'chat:message') {
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.data.id)) return prev;
                return [...prev, msg.data];
              });
            } else if (msg.type === 'chat:reaction') {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === msg.data.id) {
                    return {
                      ...m,
                      reactions: {
                        ...(m.reactions || {}),
                        [msg.data.emoji]: msg.data.count
                      }
                    };
                  }
                  return m;
                })
              );
            }
          } catch (e) {
            console.error('Error handling WS event:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.warn('WS fallback to REST:', err);
      }
    };

    fetch('/api/chat/messages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.warn('REST fallback:', err));

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveNickname = (newNick: string) => {
    setNickname(newNick);
    localStorage.setItem('hanoi_nickname', newNick);
  };

  const handleSaveBarrio = (newBarrio: string) => {
    setBarrio(newBarrio);
    localStorage.setItem('hanoi_barrio', newBarrio);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    const payload = {
      user: nickname || 'Rosarino Anónimo',
      text: textToSend,
      barrio: barrio || 'Rosario',
      badge: badge,
      color: badge === 'BANDA' ? '#10b981' : badge === 'GUITARRISTA' ? '#ec4899' : '#f59e0b'
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat:send',
          data: payload
        })
      );
      setIsSending(false);
    } else {
      try {
        const res = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages((prev) => [...prev, newMsg]);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleSendReaction = async (messageId: string, emoji: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat:react',
          data: { id: messageId, emoji }
        })
      );
    } else {
      try {
        await fetch(`/api/chat/messages/${messageId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        });
      } catch (err) {
        console.error('Reaction failed:', err);
      }
    }
  };

  return (
    <section id="chat-ia" className="relative w-full py-6 px-3 sm:px-4 max-w-7xl mx-auto space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-900 pb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Bot className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono-tech text-[11px] tracking-widest uppercase text-red-400 font-bold">
              COMUNIDAD ROSARINA & MODERACIÓN IA
            </span>
          </div>
          <h2 className="font-graffiti text-2xl sm:text-4xl text-white tracking-wide spray-shadow-green">
            CHAT DEL UNDER <span className="text-emerald-400">• HANOI AI</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono-tech mt-0.5">
            Comunidad en vivo. Preguntale a Hanoi AI por bandas, recitales y antros rosarinos.
          </p>
        </div>

        {/* AI Training & Customization Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiTraining}
            id="btn-open-training-modal"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-300 font-mono-tech text-xs font-bold rounded-xl border border-red-500/40 transition-all cursor-pointer"
            title="Abrir consola y personalización de Hanoi AI"
          >
            <Settings className="w-3.5 h-3.5 text-red-400" />
            <span>🧠 Hanoi AI Studio</span>
          </button>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="relative bg-black rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl flex flex-col h-[440px] sm:h-[500px]">
        {/* Chat Control Top Bar */}
        <div className="px-3 py-2 bg-black border-b border-zinc-900 flex items-center justify-between text-xs font-mono-tech">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-[11px] font-bold ${isConnected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isConnected ? 'EN VIVO' : 'CONECTANDO'}
              </span>
            </div>

            <span className="text-zinc-700">|</span>

            {/* Hanoi AI status pill */}
            <div className="flex items-center gap-1 text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 text-red-400" />
              <span>Hanoi AI activo</span>
            </div>
          </div>

          {/* User Nickname / Barrio button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 text-purple-300 hover:text-white transition-colors cursor-pointer bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/40 text-[11px]"
          >
            <span>{nickname}</span>
            <span className="text-purple-400 text-[10px]">✎</span>
          </button>
        </div>

        {/* Identity Config Drawer */}
        {showConfig && (
          <div className="p-2.5 bg-zinc-950 border-b border-zinc-900 font-mono-tech text-xs space-y-2 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-zinc-400 text-[11px] block mb-0.5">Tu Apodo / Banda:</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => handleSaveNickname(e.target.value)}
                  maxLength={24}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[11px] block mb-0.5">Barrio Rosarino:</label>
                <select
                  value={barrio}
                  onChange={(e) => handleSaveBarrio(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  {BARRIOS_ROSARINOS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-[11px] block mb-0.5">Rol:</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="OYENTE">Oyente del Under</option>
                  <option value="GUITARRISTA">Guitarrista / Músico</option>
                  <option value="BANDA">Banda Rosarina</option>
                  <option value="DJ">DJ de Garage</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-black">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 font-mono-tech text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 text-emerald-500/50 animate-bounce" />
              Sintonizando chat. ¡Enviá el primer mensaje a la comunidad!
            </div>
          ) : (
            messages.map((msg) => {
              const isAi = msg.user.includes('Hanoi AI') || msg.badge === 'HANOI STAFF';

              return (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isAi
                      ? 'bg-red-950/15 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                      : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isAi ? (
                        <span className="flex items-center gap-1 font-bebas text-sm text-red-400 tracking-wider font-bold">
                          <Bot className="w-3.5 h-3.5 text-red-400" />
                          HANOI AI
                        </span>
                      ) : (
                        <span
                          className="font-bebas text-sm tracking-wide text-zinc-200"
                        >
                          {msg.user}
                        </span>
                      )}

                      {/* Badge */}
                      <span
                        className={`text-[8px] font-mono-tech font-bold px-1.5 py-0.2 rounded border uppercase ${
                          isAi
                            ? 'bg-red-950 text-red-300 border-red-700'
                            : msg.badge === 'BANDA'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : msg.badge === 'GUITARRISTA'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {isAi ? 'IA MODERADOR' : msg.badge || 'OYENTE'}
                      </span>

                      {msg.barrio && (
                        <span className="text-[9px] font-mono-tech text-zinc-500 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-zinc-500" />
                          {msg.barrio}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-mono-tech text-zinc-600">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Content */}
                  <p className={`font-mono-tech text-xs leading-relaxed ${isAi ? 'text-zinc-100 font-medium' : 'text-zinc-300'}`}>
                    {msg.text}
                  </p>

                  {/* Reactions Bar */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    {['🤘', '🔥', '⚡', '🍺', '🎸'].map((emoji) => {
                      const count = msg.reactions?.[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleSendReaction(msg.id, emoji)}
                          className={`text-xs px-1.5 py-0.5 rounded transition-all cursor-pointer font-mono-tech flex items-center gap-1 ${
                            count > 0
                              ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                              : 'bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 text-zinc-500'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-[9px] font-bold">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Shouts Row */}
        <div className="px-2.5 py-1.5 bg-black border-t border-zinc-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x">
          <span className="text-[10px] font-mono-tech text-zinc-500 whitespace-nowrap">
            Preguntas rápidas:
          </span>
          {QUICK_SHOUTS.map((shout, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(shout)}
              className="text-[10px] font-mono-tech bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-purple-300 px-2 py-0.5 rounded border border-zinc-900 whitespace-nowrap transition-colors cursor-pointer"
            >
              {shout}
            </button>
          ))}
        </div>

        {/* Input Bar with Primary Green Submit */}
        <form onSubmit={handleSendMessage} className="p-2.5 bg-black border-t border-zinc-900 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Escribí o preguntale a Hanoi AI...`}
            maxLength={280}
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono-tech text-white focus:outline-none placeholder:text-zinc-600"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            id="btn-send-chat-message"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-mono-tech font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSending ? '...' : 'Enviar'}</span>
          </button>
        </form>
      </div>
    </section>
  );
};

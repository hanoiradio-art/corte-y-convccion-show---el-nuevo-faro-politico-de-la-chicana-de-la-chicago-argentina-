import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve generated and uploaded flyer images
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));

interface ChatMessageServer {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  barrio?: string;
  badge?: string;
  color?: string;
  reactions?: Record<string, number>;
}

interface RadioEventServer {
  id: string;
  title: string;
  bands: string[];
  venue: string;
  address: string;
  date: string;
  time: string;
  price: string;
  genre: string;
  description: string;
  flyerUrl?: string;
  ticketLink?: string;
  contact?: string;
  featured?: boolean;
  communitySubmitted?: boolean;
}

// Publisher security token (Restricts all developer management to Hanoi Radio administration)
const HANOI_PUBLISHER_SECRET = 'hanoi-radio-producer-key';

function isAuthorizedPublisher(req: express.Request): boolean {
  const token = req.headers['x-hanoi-publisher-token'] || req.headers['authorization'];
  return (
    token === HANOI_PUBLISHER_SECRET ||
    token === `Bearer ${HANOI_PUBLISHER_SECRET}`
  );
}

// Persistent storage paths
const EVENTS_FILE = path.join(process.cwd(), 'events_data.json');
const AI_CONFIG_FILE = path.join(process.cwd(), 'ai_config.json');
const STATION_CONFIG_FILE = path.join(process.cwd(), 'station_config.json');

// Default AI Training & Personality Configuration
const DEFAULT_AI_CONFIG = {
  name: 'Hanoi AI',
  role: 'Locutor & Moderador del Under Rosarino',
  personaPrompt: `Sos "Hanoi AI", la inteligencia artificial locutora y moderadora oficial de "Hanoi Radio" en Rosario, Argentina.
Tu estilo es underground, callejero, relajado, rockero y puramente rosarino.
Usás lunfardo de acá como "che", "loco", "fiera", "posta", "al toque", "alto pogo", "fuzz del Paraná", "aguante el under".
Bancás a morir la movida independiente y los antros icónicos como Floyd Rock Club, Refi, Casa Brava, Dylan Pub y el Galpón de la Música frente al río.
Cuando un oyente escribe en el chat, respondé como si estuvieras en la mesa del estudio de la radio al micrófono.
Sé breve: respondé en 1 o 2 oraciones directas, con actitud y onda rockera rosarina.`,
  temperature: 0.7,
  active: true,
  rosarioSlang: ['fiera', 'loco', 'che', 'posta', 'al toque', 'alto pogo', 'aguante el under', 'fuzz del Paraná'],
  favoriteBands: ['Las Sombras de Pichincha', 'Sótano Mutante', 'Duna Negra', 'Paraná Noise Project'],
  mode: 'underground'
};

function loadAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const data = fs.readFileSync(AI_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.personaPrompt) {
        return { ...DEFAULT_AI_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.error('Error reading ai_config.json:', err);
  }
  return { ...DEFAULT_AI_CONFIG };
}

let aiTrainingConfig = loadAiConfig();

function saveAiConfig() {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiTrainingConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving ai_config.json:', err);
  }
}

// Default Radio Station Configuration
const DEFAULT_STATION_CONFIG = {
  stationName: 'Hanoi Radio',
  frequency: '98.9',
  tagline: 'Rock & Roll • Música Under de Rosario • 24/7',
  streamUrl: 'https://stream.zeno.fm/hkvjd6xjst5uv',
  email: 'hanoiradio.ar@gmail.com',
  bannerNotice: '¡Transmitiendo en vivo desde Rosario para todo el mundo! Sintonizá puro rock under.',
  currentShow: {
    id: 'show-1',
    title: 'Trinchera Under',
    host: 'Facu "El Mugre" & Vicky Riff',
    timeSlot: '20:00 - 23:00 hs',
    days: 'Lunes a Viernes',
    description: 'El núcleo del rock independiente santafesino. Entrevistas a bandas emergentes, lanzamientos y garaje crudo.',
    genre: 'Grunge / Punk / Stoner'
  }
};

function loadStationConfig() {
  try {
    if (fs.existsSync(STATION_CONFIG_FILE)) {
      const data = fs.readFileSync(STATION_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.streamUrl) {
        return { ...DEFAULT_STATION_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.error('Error reading station_config.json:', err);
  }
  return { ...DEFAULT_STATION_CONFIG };
}

let stationConfig = loadStationConfig();

function saveStationConfig() {
  try {
    fs.writeFileSync(STATION_CONFIG_FILE, JSON.stringify(stationConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving station_config.json:', err);
  }
}

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// In-memory data store for live chat messages
let chatMessages: ChatMessageServer[] = [
  {
    id: 'm-1',
    user: 'FuzzRosarino',
    text: '¡Qué buen riff loco! Saludando desde Pichincha con una fría en mano 🍺',
    timestamp: '21:14',
    barrio: 'Pichincha',
    badge: 'OYENTE',
    color: '#f59e0b',
    reactions: { '🤘': 8, '🍺': 5 }
  },
  {
    id: 'm-2',
    user: 'Mona_Grunge',
    text: '¿Alguien va a ver a Los Distorsionados este sábado a Refi? Avisen y armamos previa',
    timestamp: '21:18',
    barrio: 'Barrio Martin',
    badge: 'GUITARRISTA',
    color: '#ec4899',
    reactions: { '🔥': 4, '🤘': 3 }
  },
  {
    id: 'm-3',
    user: 'Hanoi AI',
    text: '¡Bienvenidos a la sintonía del under rosarino fiera! Esta noche detonamos los parlantes con puro garage y fuzz.',
    timestamp: '21:20',
    barrio: 'Estudio Hanoi',
    badge: 'HANOI STAFF',
    color: '#ef4444',
    reactions: { '⚡': 12, '🤘': 15 }
  },
  {
    id: 'm-4',
    user: 'Nico_BajoPesado',
    text: 'Por favor pasen algo de la movida garage de Fisherton o el nuevo tema de Fuzz del Paraná!',
    timestamp: '21:25',
    barrio: 'Fisherton',
    badge: 'BANDA',
    color: '#10b981',
    reactions: { '🎸': 7 }
  },
  {
    id: 'm-5',
    user: 'Pupi_Alberdi',
    text: 'Sintonizando Hanoi desde Alberdi frente al río Paraná. El sonido sale con toda la furia!',
    timestamp: '21:29',
    barrio: 'Alberdi',
    badge: 'OYENTE',
    color: '#38bdf8',
    reactions: { '🤘': 6 }
  }
];

// Seed of authentic independent rock events in Rosario with photo flyers

const INITIAL_EVENTS: RadioEventServer[] = [
  {
    id: 'ev-1',
    title: 'Festival Furia Garajera',
    bands: ['Las Sombras de Pichincha', 'Sótano Mutante'],
    venue: 'Refi Rosario',
    address: 'Vélez Sarsfield 641',
    date: 'Sábado 27 de Septiembre',
    time: '22:00 hs',
    price: 'Entrada Popular en puerta',
    genre: 'Grunge / Garage Rock',
    description: 'Triple fecha a puro pedal y feedback en Refi. Toda la información en el flyer oficial.',
    flyerUrl: '/src/assets/images/flyer_refi_rosario_1789613716984.jpg',
    featured: true
  },
  {
    id: 'ev-3',
    title: 'Ciclo Ruido en el Galpón',
    bands: ['Duna Negra', 'Paraná Noise Project'],
    venue: 'Galpón de la Música',
    address: 'Estévez Boero 980 (Franja del Río)',
    date: 'Domingo 28 de Septiembre',
    time: '19:00 hs',
    price: 'Entrada Libre y Gratuita',
    genre: 'Indie Rock / Post-Punk',
    description: 'Ciclo frente al río Paraná con vista al atardecer y feria de fanzines independientes.',
    flyerUrl: '/src/assets/images/flyer_galpon_rosario_1789613729512.jpg',
    featured: false
  }
];

function loadEvents(): RadioEventServer[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading events_data.json:', err);
  }
  return [...INITIAL_EVENTS];
}

let localEvents: RadioEventServer[] = loadEvents();

function saveEvents() {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(localEvents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving events_data.json:', err);
  }
}

const radioShows = [
  {
    id: 'show-1',
    title: 'Trinchera Under',
    host: 'Facu "El Mugre" & Vicky Riff',
    timeSlot: '20:00 - 23:00 hs',
    days: 'Lunes a Viernes',
    description: 'El núcleo del rock independiente santafesino. Entrevistas a bandas emergentes, lanzamientos y garaje crudo.',
    genre: 'Grunge / Punk / Stoner'
  },
  {
    id: 'show-2',
    title: 'Distorsión Rosarina',
    host: 'El Gordo Valvular',
    timeSlot: '23:00 - 02:00 hs',
    days: 'Lunes a Jueves',
    description: 'Repaso histórico del under de Rosario: desde los sótanos de los 80 hasta las maquetas que explotan hoy.',
    genre: 'Rock Nacional Under / Garage'
  },
  {
    id: 'show-3',
    title: 'Furia de Sábado',
    host: 'DJ Pua Gastada',
    timeSlot: '21:00 - 03:00 hs',
    days: 'Viernes y Sábados',
    description: 'El setlist definitivo para la previa de recitales. Sonido valvular sin filtros.',
    genre: 'Hard Rock / Alternativo / Heavy'
  },
  {
    id: 'show-4',
    title: 'Resaca del Paraná',
    host: 'Nico Acústico',
    timeSlot: '16:00 - 19:00 hs',
    days: 'Domingos',
    description: 'Lado B, grabaciones en vivo en salas de ensayo de Rosario y zapadas acústicas.',
    genre: 'Indie / Acústico / Lo-Fi'
  }
];

// --- API ROUTES FIRST ---

// AI Moderator Configuration GET
app.get('/api/ai/config', (_req, res) => {
  res.json(aiTrainingConfig);
});

// AI Moderator Configuration POST (Restricted to Developer/Director mode)
app.post('/api/ai/config', (req, res) => {
  if (!isAuthorizedPublisher(req)) {
    return res.status(403).json({
      error: 'Acceso restringido: solo el modo desarrollador de Hanoi Radio puede modificar la IA.'
    });
  }

  const { name, role, personaPrompt, temperature, active, rosarioSlang, favoriteBands, mode } = req.body;
  if (name !== undefined) aiTrainingConfig.name = String(name).trim();
  if (role !== undefined) aiTrainingConfig.role = String(role).trim();
  if (personaPrompt !== undefined) aiTrainingConfig.personaPrompt = String(personaPrompt).trim();
  if (temperature !== undefined) aiTrainingConfig.temperature = Number(temperature);
  if (active !== undefined) aiTrainingConfig.active = Boolean(active);
  if (rosarioSlang !== undefined && Array.isArray(rosarioSlang)) aiTrainingConfig.rosarioSlang = rosarioSlang;
  if (favoriteBands !== undefined && Array.isArray(favoriteBands)) aiTrainingConfig.favoriteBands = favoriteBands;
  if (mode !== undefined) aiTrainingConfig.mode = mode;

  // Persist directly to disk so changes are permanent across reboots
  saveAiConfig();

  broadcast({
    type: 'ai:config_updated',
    data: aiTrainingConfig
  });

  res.json({ success: true, config: aiTrainingConfig });
});

function generateStudioFallbackReply(prompt: string): string {
  const slang = aiTrainingConfig.rosarioSlang && aiTrainingConfig.rosarioSlang.length > 0
    ? aiTrainingConfig.rosarioSlang
    : ['fiera', 'loco', 'che', 'alto pogo', 'fuzz del Paraná', 'posta'];
  const randomSlang = slang[Math.floor(Math.random() * slang.length)];
  const bands = aiTrainingConfig.favoriteBands && aiTrainingConfig.favoriteBands.length > 0
    ? aiTrainingConfig.favoriteBands
    : ['Las Sombras de Pichincha', 'Sótano Mutante'];
  const randomBand = bands[Math.floor(Math.random() * bands.length)];

  const templates = [
    `¡Qué hacés ${randomSlang}! En el estudio de Hanoi estamos al palo con la sintonía independiente. ¡Aguante ${randomBand} y el under de Rosario! 🤘`,
    `¡Posta ${randomSlang}! Esa es la actitud que bancamos en la radio. Acá la distorsión no se negocia jamás. 🎸`,
    `¡Tremendo mensaje ${randomSlang}! Esta noche detonamos los parlantes con puro rock rosarino y la data de los recitales. ⚡`,
    `¡Al toque ${randomSlang}! Ya estamos agendando esa data en la consola de Hanoi. ¡Que no pare el pogo en los antros! 🍺`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

async function generateAiResponseText(prompt: string, context: string = ''): Promise<{ reply: string; engine: string }> {
  const ai = getGemini();
  const fullPrompt = context
    ? `${context}\n\nPregunta / Comentario del oyente:\n"${prompt}"\n\nResponde como Hanoi AI:`
    : prompt;

  if (ai) {
    // Attempt 1: gemini-3.8-flash
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: aiTrainingConfig.personaPrompt
        }
      });
      const text = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
      if (text) return { reply: text, engine: 'gemini-3.8-flash' };
    } catch (err: any) {
      console.warn('Gemini 3.8 Flash temporary spike/503:', err?.message || err);
    }

    // Attempt 2: gemini-3.1-flash-lite fallback
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: fullPrompt,
        config: {
          systemInstruction: aiTrainingConfig.personaPrompt
        }
      });
      const text = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
      if (text) return { reply: text, engine: 'gemini-3.1-flash-lite' };
    } catch (err: any) {
      console.warn('Gemini 3.1 Flash Lite fallback failed:', err?.message || err);
    }
  }

  // Graceful smart local generator conforming to trained personality
  return {
    reply: generateStudioFallbackReply(prompt),
    engine: 'hanoi-ai-studio-engine'
  };
}

// AI Direct Live Test (Allows developer to test Gemini responses in real-time)
app.post('/api/ai/test', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Mensaje de prueba requerido' });
  }

  const startTime = Date.now();
  const result = await generateAiResponseText(prompt.trim());

  return res.json({
    success: true,
    reply: result.reply,
    engine: result.engine,
    latencyMs: Date.now() - startTime
  });
});

// AI On-Air Announcement (Developer can broadcast live AI announcements into the chat)
app.post('/api/ai/broadcast', (req, res) => {
  if (!isAuthorizedPublisher(req)) {
    return res.status(403).json({
      error: 'Acceso restringido: solo el director de Hanoi Radio puede emitir anuncios al aire.'
    });
  }

  const { announcement } = req.body;
  if (!announcement || !announcement.trim()) {
    return res.status(400).json({ error: 'El texto del anuncio es requerido' });
  }

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const aiBroadcastMsg: ChatMessageServer = {
    id: `m-ai-broadcast-${Date.now()}`,
    user: 'Hanoi AI',
    text: `📢 [AL AIRE] ${announcement.trim()}`,
    timestamp: `${hours}:${minutes}`,
    barrio: 'Estudio Hanoi',
    badge: 'HANOI STAFF',
    color: '#ef4444',
    reactions: { '⚡': 5, '🤘': 8 }
  };

  chatMessages.push(aiBroadcastMsg);
  if (chatMessages.length > 100) chatMessages = chatMessages.slice(-100);

  broadcast({
    type: 'chat:message',
    data: aiBroadcastMsg
  });

  res.json({ success: true, message: aiBroadcastMsg });
});

async function triggerAiModeratorResponse(triggerMessage: ChatMessageServer) {
  if (!aiTrainingConfig.active) return;
  // Prevent infinite loop if Hanoi AI wrote the message
  if (triggerMessage.user === 'Hanoi AI') return;

  setTimeout(async () => {
    try {
      const recentHistory = chatMessages
        .slice(-5)
        .map((m) => `${m.user} (${m.barrio || 'Rosario'}): ${m.text}`)
        .join('\n');

      const context = `Historial reciente del chat de la radio:\n${recentHistory}`;
      const result = await generateAiResponseText(triggerMessage.text, context);

      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      const aiMessage: ChatMessageServer = {
        id: `m-ai-${Date.now()}`,
        user: 'Hanoi AI',
        text: result.reply,
        timestamp: `${hours}:${minutes}`,
        barrio: 'Estudio Hanoi',
        badge: 'HANOI STAFF',
        color: '#ef4444',
        reactions: { '🤘': 2 }
      };

      chatMessages.push(aiMessage);
      if (chatMessages.length > 100) chatMessages = chatMessages.slice(-100);

      broadcast({
        type: 'chat:message',
        data: aiMessage
      });
    } catch (err) {
      console.error('Error generating AI moderator reply:', err);
    }
  }, 700);
}

// Chat GET
app.get('/api/chat/messages', (_req, res) => {
  res.json(chatMessages);
});

// Chat POST
app.post('/api/chat/messages', (req, res) => {
  const { user, text, barrio, badge, color } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const newMessage: ChatMessageServer = {
    id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    user: (user && user.trim()) || 'Anónimo del Under',
    text: text.trim().slice(0, 300),
    timestamp: `${hours}:${minutes}`,
    barrio: (barrio && barrio.trim()) || 'Rosario Centro',
    badge: badge || 'OYENTE',
    color: color || '#f59e0b',
    reactions: {}
  };

  chatMessages.push(newMessage);
  // Keep last 100 messages
  if (chatMessages.length > 100) {
    chatMessages = chatMessages.slice(-100);
  }

  // Broadcast to all WebSocket clients
  broadcast({
    type: 'chat:message',
    data: newMessage
  });

  // Trigger AI moderator response
  triggerAiModeratorResponse(newMessage);

  res.status(201).json(newMessage);
});

// Chat reaction POST
app.post('/api/chat/messages/:id/react', (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji requerido' });

  const msg = chatMessages.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });

  if (!msg.reactions) msg.reactions = {};
  msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;

  broadcast({
    type: 'chat:reaction',
    data: { id, emoji, count: msg.reactions[emoji] }
  });

  res.json({ success: true, reactions: msg.reactions });
});

// Events GET
app.get('/api/events', (_req, res) => {
  res.json(localEvents);
});

// Events POST (Restricted to Hanoi Radio publisher)
app.post('/api/events', (req, res) => {
  if (!isAuthorizedPublisher(req)) {
    return res.status(403).json({
      error: 'Acceso restringido: solo la producción de Hanoi Radio (hanoiradio.ar@gmail.com) puede publicar flyers.'
    });
  }

  const { id: reqId, title, bands, venue, address, date, time, price, genre, description, flyerUrl, ticketLink, contact } = req.body;
  if (!title || !venue || !date) {
    return res.status(400).json({ error: 'Título, lugar y fecha son obligatorios' });
  }

  // If flyerUrl is a base64 data URI, extract and save it as a standalone image file
  let finalFlyerUrl = flyerUrl || '';
  if (typeof finalFlyerUrl === 'string' && finalFlyerUrl.startsWith('data:image/')) {
    try {
      const match = finalFlyerUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        let ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        if (ext === 'svg+xml') ext = 'svg';
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `flyer-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, buffer);
        finalFlyerUrl = `/uploads/${filename}`;
      }
    } catch (imgErr) {
      console.error('Error saving uploaded flyer image to disk:', imgErr);
    }
  }

  // Avoid creating multiple duplicates for the same event
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDate = date.trim().toLowerCase();
  const normalizedVenue = venue.trim().toLowerCase();

  const existingIndex = localEvents.findIndex(
    (ev) =>
      (reqId && ev.id === reqId) ||
      (ev.title.trim().toLowerCase() === normalizedTitle &&
        ev.date.trim().toLowerCase() === normalizedDate &&
        ev.venue.trim().toLowerCase() === normalizedVenue)
  );

  const eventId = reqId || (existingIndex >= 0 ? localEvents[existingIndex].id : `ev-${Date.now()}`);

  const newEvent: RadioEventServer = {
    id: eventId,
    title: title.trim(),
    bands: Array.isArray(bands) ? bands : [bands || 'Banda Under'],
    venue: venue.trim(),
    address: (address && address.trim()) || 'Rosario',
    date: date.trim(),
    time: (time && time.trim()) || '22:00 hs',
    price: (price && price.trim()) || 'A consultar en puerta',
    genre: (genre && genre.trim()) || 'Rock Under',
    description: (description && description.trim()) || 'Fecha autogestionada independiente.',
    flyerUrl: finalFlyerUrl,
    ticketLink: ticketLink || '',
    contact: contact || '',
    featured: false,
    communitySubmitted: true
  };

  if (existingIndex >= 0) {
    localEvents[existingIndex] = newEvent;
  } else {
    localEvents.unshift(newEvent);
  }
  saveEvents();

  broadcast({
    type: 'event:added',
    data: newEvent
  });

  res.status(201).json(newEvent);
});

// Events DELETE (Restricted to Hanoi Radio publisher)
app.delete('/api/events/:id', (req, res) => {
  if (!isAuthorizedPublisher(req)) {
    return res.status(403).json({
      error: 'Acceso restringido: solo la producción de Hanoi Radio (hanoiradio.ar@gmail.com) puede borrar flyers.'
    });
  }

  const { id } = req.params;
  const initialLength = localEvents.length;
  localEvents = localEvents.filter((ev) => ev.id !== id);
  saveEvents();

  broadcast({
    type: 'event:deleted',
    data: { id }
  });

  res.json({ success: true, deleted: localEvents.length < initialLength });
});

// Radio Station info & Schedule GET
app.get('/api/radio-info', (_req, res) => {
  res.json({
    stationName: stationConfig.stationName,
    frequency: stationConfig.frequency,
    location: 'Rosario, Santa Fe, Argentina',
    tagline: stationConfig.tagline,
    streamUrl: stationConfig.streamUrl,
    email: stationConfig.email,
    bannerNotice: stationConfig.bannerNotice,
    shows: radioShows,
    currentShow: stationConfig.currentShow || radioShows[0],
    activeListeners: connectedClientsCount + 24 // Base under listeners + active clients
  });
});

// Radio Station info POST (Restricted to Developer/Director mode)
app.post('/api/radio-info', (req, res) => {
  if (!isAuthorizedPublisher(req)) {
    return res.status(403).json({
      error: 'Acceso restringido: solo el director de Hanoi Radio puede modificar los datos de transmisión.'
    });
  }

  const { streamUrl, bannerNotice, currentShowTitle, currentShowHost, currentShowGenre, tagline } = req.body;
  if (streamUrl) stationConfig.streamUrl = String(streamUrl).trim();
  if (bannerNotice !== undefined) stationConfig.bannerNotice = String(bannerNotice).trim();
  if (tagline) stationConfig.tagline = String(tagline).trim();

  if (currentShowTitle || currentShowHost || currentShowGenre) {
    stationConfig.currentShow = {
      ...stationConfig.currentShow,
      title: currentShowTitle ? String(currentShowTitle).trim() : stationConfig.currentShow.title,
      host: currentShowHost ? String(currentShowHost).trim() : stationConfig.currentShow.host,
      genre: currentShowGenre ? String(currentShowGenre).trim() : stationConfig.currentShow.genre
    };
  }

  saveStationConfig();

  broadcast({
    type: 'station:updated',
    data: {
      ...stationConfig,
      shows: radioShows,
      activeListeners: connectedClientsCount + 24
    }
  });

  res.json({ success: true, config: stationConfig });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server attached to same port
const wss = new WebSocketServer({ noServer: true });
let connectedClientsCount = 0;

server.on('upgrade', (request, socket, head) => {
  const reqUrl = request.url || '';
  // Only route app websocket connections on /ws, never intercept root / or Vite HMR
  if (reqUrl.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

function broadcast(payload: object) {
  const messageStr = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

wss.on('connection', (ws) => {
  connectedClientsCount++;
  
  // Send initial state to newly connected client
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      messages: chatMessages,
      onlineCount: connectedClientsCount + 24
    }
  }));

  // Broadcast updated presence
  broadcast({
    type: 'presence',
    data: { onlineCount: connectedClientsCount + 24 }
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'chat:send') {
        const { user, text, barrio, badge, color } = parsed.data;
        if (text && text.trim()) {
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');

          const newMessage = {
            id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            user: (user && user.trim()) || 'Anónimo del Under',
            text: text.trim().slice(0, 300),
            timestamp: `${hours}:${minutes}`,
            barrio: (barrio && barrio.trim()) || 'Rosario Centro',
            badge: badge || 'OYENTE',
            color: color || '#f59e0b',
            reactions: {}
          };

          chatMessages.push(newMessage);
          if (chatMessages.length > 100) chatMessages = chatMessages.slice(-100);

          broadcast({
            type: 'chat:message',
            data: newMessage
          });

          // Trigger AI moderator response
          triggerAiModeratorResponse(newMessage);
        }
      } else if (parsed.type === 'chat:react') {
        const { id, emoji } = parsed.data;
        const msg = chatMessages.find((m) => m.id === id);
        if (msg) {
          if (!msg.reactions) msg.reactions = {};
          msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
          broadcast({
            type: 'chat:reaction',
            data: { id, emoji, count: msg.reactions[emoji] }
          });
        }
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on('close', () => {
    connectedClientsCount = Math.max(0, connectedClientsCount - 1);
    broadcast({
      type: 'presence',
      data: { onlineCount: connectedClientsCount + 24 }
    });
  });
});

// Vite middleware for development or static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎸 Hanoi Radio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

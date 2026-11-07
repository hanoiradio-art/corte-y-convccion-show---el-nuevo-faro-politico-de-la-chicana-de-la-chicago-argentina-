export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  barrio?: string; // Barrio rosarino (Pichincha, Martin, Echesortu, etc.)
  badge?: 'OYENTE' | 'BANDA' | 'DJ' | 'HANOI STAFF' | 'GUITARRISTA';
  color?: string;
  reactions?: { [emoji: string]: number };
}

export interface RadioEvent {
  id: string;
  title: string;
  bands: string[];
  venue: string;
  address: string;
  date: string; // e.g., 'Viernes 18 Sep'
  fullDate?: string;
  time: string; // e.g., '22:00 hs'
  price: string; // e.g., '$3.500 en puerta' or 'Gratis / A la gorra'
  genre: string; // 'Grunge / Alternativo', 'Punk Rock', 'Garage / Psicodelia', 'Heavy Under'
  description: string;
  flyerUrl?: string; // Photo of concert flyer with all show info
  ticketLink?: string;
  contact?: string;
  featured?: boolean;
  communitySubmitted?: boolean;
}

export interface AiTrainingConfig {
  name: string;
  role: string;
  personaPrompt: string;
  temperature: number;
  active: boolean;
  rosarioSlang?: string[];
  favoriteBands?: string[];
  mode?: 'underground' | 'punk' | 'trasnoche' | 'critico' | 'formal';
}

export interface RadioShow {
  id: string;
  title: string;
  host: string;
  timeSlot: string;
  days: string;
  description: string;
  genre: string;
}

export interface StationConfig {
  stationName: string;
  frequency: string;
  tagline: string;
  streamUrl: string;
  email: string;
  bannerNotice: string;
  currentShow: RadioShow;
  shows: RadioShow[];
}

export interface RadioState {
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  streamUrl: string;
  onlineListeners: number;
  currentSong: string;
  currentShow: RadioShow;
  bassBoost: boolean;
  vintageFilter: boolean;
}


export const GAME_DURATION_MIN_SECONDS = 90; // Minimum hedef süre

// Physics Constants
export const GRAVITY = 0.06; // Yerçekimi sabiti
export const FRICTION = 0.996; // Sürtünme azaltıldı (Daha kaygan/hızlı)
export const BASE_ACCEL = 0.005; // Oyuncuların kendi motor gücü artırıldı
export const MAX_SPEED = 2.5; // Maksimum hız limiti
export const MIN_SPEED = 0.5; // Minimum hız artırıldı (Artık durma noktasına gelmeyecekler)
export const BOOST_CHANCE = 0.015; // Rastgele hızlanma şansı
export const CHAOS_START_TIME = 8000; // Kaç ms sonra rastgelelik başlar

// Visuals
export const TRACK_WIDTH = 6; // Yol genişliği
export const RAIL_HEIGHT = 1.5; // Korkuluk yüksekliği
export const TUBE_SEGMENTS = 1200; // Parkur çözünürlüğü (Daha pürüzsüz virajlar)

export const COLORS = [
  '#ff0055', // Neon Kırmızı
  '#00ffaa', // Neon Yeşil
  '#00ccff', // Neon Mavi
  '#ffcc00', // Neon Sarı
  '#aa00ff', // Neon Mor
  '#ff5500', // Neon Turuncu
  '#ffffff', // Parlak Beyaz
  '#00ff44', // Lime
];

export const MOCK_NAMES = [
  "HizliOsman", "TeknoCan", "YarisciAli", "StreamKrali", 
  "KodUstasi", "GeminiSever", "BulutGezgini", "NeonSovalye", 
  "HizTutkunu", "OyunDelisi", "PikselAvcisi", "SiberGezgin",
  "RoketAhmet", "MermerEce", "FirtinaVeli", "GeceKusu"
];

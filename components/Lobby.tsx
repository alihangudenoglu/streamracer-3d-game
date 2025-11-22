import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { Gamepad2, Youtube, Play, Users, Settings, Bot, Loader2 } from 'lucide-react';

interface LobbyProps {
  players: Player[];
  onStartGame: () => void;
  onAddSimulatedPlayers: () => void;
  onConnectYouTube: (url: string, apiKey: string) => void;
  isConnecting: boolean;
  isPolling: boolean;
}

const Lobby: React.FC<LobbyProps> = ({ players, onStartGame, onAddSimulatedPlayers, onConnectYouTube, isConnecting, isPolling }) => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    onConnectYouTube(url, apiKey);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      
      <div className="max-w-4xl w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2">
            STREAM YARIŞI
          </h1>
          <p className="text-gray-400 text-lg">YouTube Canlı Yayını İçin 3D Bilye Yarışı</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controls Section */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Youtube className="text-red-500" /> Yayın Ayarları
                </h2>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <Settings size={20} />
                </button>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">YouTube Canlı Yayın Linki</label>
                  <input 
                    type="text" 
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
                
                {showSettings && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">YouTube Data API Anahtarı (Opsiyonel)</label>
                    <input 
                      type="password" 
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Gerçek chat için gereklidir. Boş bırakırsanız botlar eklenir.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    type="submit"
                    disabled={isConnecting || isPolling}
                    className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                      isPolling 
                        ? 'bg-green-600/50 text-green-200 cursor-default'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isConnecting ? <Loader2 className="animate-spin" /> : isPolling ? 'Chat Dinleniyor...' : 'Yayına Bağlan'}
                  </button>
                  <button 
                    type="button"
                    onClick={onAddSimulatedPlayers}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded-lg transition"
                    title="Bot Oyuncu Ekle"
                  >
                    <Bot size={20} />
                  </button>
                </div>
              </form>
            </div>

            <button 
              onClick={onStartGame}
              disabled={players.length < 2}
              className={`w-full py-4 rounded-2xl font-display text-2xl font-bold tracking-wider uppercase transition transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg ${
                players.length < 2 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/20'
              }`}
            >
              <Play fill="currentColor" /> Yarışı Başlat
            </button>
          </div>

          {/* Players List */}
          <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="text-purple-400" /> Lobi
              </h2>
              <div className="flex items-center gap-2">
                {isPolling && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-mono">
                  {players.length} Kişi
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {players.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                  <Gamepad2 size={48} className="mb-2" />
                  <p>Oyuncular bekleniyor...</p>
                  <p className="text-sm">Chat'e yazanlar buraya düşecek.</p>
                </div>
              ) : (
                [...players].reverse().map(player => (
                  <div key={player.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 animate-fade-in">
                    <div 
                      className="w-8 h-8 rounded-full shadow-lg border border-white/20" 
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium truncate">{player.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Lobby;
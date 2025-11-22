
import React, { useState, useEffect, useRef } from 'react';
import { Player, GameState, CommentaryState } from './types';
import { COLORS, MOCK_NAMES, GRAVITY, FRICTION, BASE_ACCEL, MAX_SPEED, MIN_SPEED, BOOST_CHANCE, CHAOS_START_TIME } from './constants';
import { getTrackStateAtDistance, TOTAL_TRACK_LENGTH } from './utils/trackUtils';
import Game3D from './components/Game3D';
import Lobby from './components/Lobby';
import { generatePreRaceHype, generateWinnerCommentary } from './services/geminiService';
import { Trophy, MessageSquareQuote, RotateCcw, ChevronLeft, ChevronRight, Video, Users } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [commentary, setCommentary] = useState<CommentaryState>({ text: "", isLoading: false });
  
  // Camera Control State
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null);
  
  // YouTube State
  const liveChatIdRef = useRef<string | null>(null);
  const apiKeyRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);

  // Game Loop Logic (Physics & Race)
  useEffect(() => {
    let frameId: number;
    let raceFinished = false;

    const updateRace = () => {
      if (gameState === GameState.RACING && !raceFinished) {
        const now = Date.now();
        const timeSinceStart = now - raceStartTimeRef.current;
        
        setPlayers(prevPlayers => {
          const newPlayers = prevPlayers.map(p => {
            if (p.finished) return p;

            // 1. Calculate Slope Factor
            // We get the tangent at the current distance. 
            // If tangent.y is negative, we are going down -> accelerate.
            // If tangent.y is positive, we are going up -> decelerate.
            const { tangent } = getTrackStateAtDistance(p.distance);
            const slopeFactor = -tangent.y; // Down (+), Up (-)

            // 2. Base Acceleration
            let acceleration = BASE_ACCEL;

            // 3. Apply Gravity (Physics) - MODIFIED
            if (slopeFactor > 0) {
              // Yokuş aşağı (Hızlanma) - Tam Yerçekimi
              acceleration += slopeFactor * GRAVITY;
            } else {
              // Yokuş yukarı (Yavaşlama) - Ciddi oranda azaltılmış ceza
              // Bu sayede oyuncular yokuşlarda takılmayacak
              acceleration += slopeFactor * (GRAVITY * 0.2); 
            }

            // 4. Randomness (Chaos Phase)
            // First few seconds everyone is equal. After CHAOS_START_TIME, randomness applies.
            if (timeSinceStart > CHAOS_START_TIME) {
              if (Math.random() < BOOST_CHANCE) {
                 acceleration += (Math.random() - 0.5) * 0.1; // Random burst or lag
              }
            } else {
              // Strict equality phase - Normalize acceleration
              acceleration = BASE_ACCEL; // Ignore gravity for a fair launch
            }

            // 5. Update Velocity
            let newVelocity = p.velocity + acceleration;
            newVelocity *= FRICTION; // Air resistance / Friction

            // Clamp speed
            if (timeSinceStart < CHAOS_START_TIME) {
                // Cap speed during launch to keep them together
                newVelocity = Math.min(newVelocity, 0.5);
                newVelocity = Math.max(newVelocity, 0.4); // Fixed launch speed
            } else {
                newVelocity = Math.min(newVelocity, MAX_SPEED);
                // Minimum hız garantisi ile duraksamaları engelle
                newVelocity = Math.max(newVelocity, MIN_SPEED);
            }

            // 6. Move Player
            const newDistance = p.distance + newVelocity;
            const newProgress = Math.min(newDistance / TOTAL_TRACK_LENGTH, 1.0);
            const isFinished = newDistance >= TOTAL_TRACK_LENGTH;

            return {
              ...p,
              distance: newDistance,
              progress: newProgress, // UI uses 0-1
              velocity: newVelocity,
              finished: isFinished,
              finishTime: isFinished && !p.finishTime ? Date.now() : p.finishTime
            };
          });

          // Check for winner
          const finishedPlayer = newPlayers.find(p => p.finished && !winner);
          if (finishedPlayer && !winner) {
            handleRaceFinish(finishedPlayer, newPlayers);
            raceFinished = true; 
          }

          return newPlayers;
        });
      }
      frameId = requestAnimationFrame(updateRace);
    };

    if (gameState === GameState.RACING) {
      frameId = requestAnimationFrame(updateRace);
    }

    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, winner]);

  // YouTube Polling Effect
  useEffect(() => {
    if (isPolling && apiKeyRef.current && liveChatIdRef.current && gameState === GameState.LOBBY) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatIdRef.current}&part=snippet,authorDetails&key=${apiKeyRef.current}`
          );
          const data = await response.json();
          
          if (data.items) {
            data.items.forEach((item: any) => {
              const authorName = item.authorDetails.displayName;
              setPlayers(current => {
                 if (current.some(p => p.name === authorName)) return current;
                 return [...current, createPlayer(authorName)];
              });
            });
          }
        } catch (error) {
          console.error("YouTube poll error:", error);
        }
      };

      pollingIntervalRef.current = window.setInterval(fetchMessages, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, gameState]);

  const createPlayer = (name: string): Player => ({
    id: Math.random().toString(36).substr(2, 9),
    name: name,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    progress: 0,
    distance: 0,
    velocity: 0,
    laneOffset: (Math.random() - 0.5) * 5, // Random lane -2.5 to 2.5
    finished: false
  });

  const handleRaceFinish = async (winnerPlayer: Player, finalPlayersState: Player[]) => {
    setWinner(winnerPlayer);
    setCameraTargetId(winnerPlayer.id);
    const runnerUp = finalPlayersState
        .filter(p => p.id !== winnerPlayer.id)
        .sort((a, b) => b.distance - a.distance)[0];
        
    setTimeout(() => {
      setGameState(GameState.FINISHED);
    }, 2000);

    setCommentary({ text: "Yarış sonuçları analiz ediliyor...", isLoading: true });
    const text = await generateWinnerCommentary(winnerPlayer.name, runnerUp?.name || "Kimse");
    setCommentary({ text, isLoading: false });
  };

  const handleConnectYouTube = async (url: string, apiKey: string) => {
    setIsConnecting(true);
    apiKeyRef.current = apiKey;

    try {
      if (!apiKey) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsPolling(true);
        for(let i=0; i<5; i++) handleAddSimulated();
      } else {
        const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (!videoIdMatch) throw new Error("Geçersiz YouTube URL");
        const videoId = videoIdMatch[1];

        const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=liveStreamingDetails&key=${apiKey}`);
        const vidData = await vidRes.json();
        
        if (!vidData.items || vidData.items.length === 0) throw new Error("Video bulunamadı");
        const activeLiveChatId = vidData.items[0].liveStreamingDetails?.activeLiveChatId;
        
        if (!activeLiveChatId) throw new Error("Bu video canlı değil veya sohbet kapalı.");
        
        liveChatIdRef.current = activeLiveChatId;
        setIsPolling(true);
      }
    } catch (error) {
      alert("Bağlantı Hatası: " + (error as any).message);
      setIsPolling(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartGame = async () => {
    setWinner(null);
    setGameState(GameState.RACING);
    setIsPolling(false);
    setCameraTargetId(null);
    raceStartTimeRef.current = Date.now();
    
    setCommentary({ text: "Yarışçılar yerlerini alıyor...", isLoading: true });
    const names = players.map(p => p.name);
    const hype = await generatePreRaceHype(names);
    setCommentary({ text: hype, isLoading: false });
  };

  const handleAddSimulated = () => {
    setPlayers(prev => [...prev, createPlayer(MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)] + `_${Math.floor(Math.random()*100)}`)]);
  };

  const handleReset = () => {
    setGameState(GameState.LOBBY);
    setPlayers(prev => prev.map(p => ({ ...p, progress: 0, distance: 0, velocity: 0, finished: false, finishTime: undefined })));
    setWinner(null);
    setCommentary({ text: "", isLoading: false });
    setCameraTargetId(null);
    if (liveChatIdRef.current) setIsPolling(true);
  };

  const nextCamera = () => {
    if (players.length === 0) return;
    if (!cameraTargetId) {
      setCameraTargetId(players[0].id);
    } else {
      const idx = players.findIndex(p => p.id === cameraTargetId);
      const nextIdx = (idx + 1) % players.length;
      setCameraTargetId(players[nextIdx].id);
    }
  };

  const prevCamera = () => {
    if (players.length === 0) return;
    if (!cameraTargetId) {
      setCameraTargetId(players[players.length - 1].id);
    } else {
      const idx = players.findIndex(p => p.id === cameraTargetId);
      const prevIdx = (idx - 1 + players.length) % players.length;
      setCameraTargetId(players[prevIdx].id);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans select-none">
      {gameState !== GameState.LOBBY && (
        <Game3D 
          players={players} 
          gameState={gameState} 
          cameraTargetId={cameraTargetId}
        />
      )}

      {gameState === GameState.LOBBY && (
        <Lobby 
          players={players}
          onStartGame={handleStartGame}
          onAddSimulatedPlayers={handleAddSimulated}
          onConnectYouTube={handleConnectYouTube}
          isConnecting={isConnecting}
          isPolling={isPolling}
        />
      )}

      {gameState === GameState.RACING && (
        <>
          <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
            {commentary.text && (
              <div className="mx-auto max-w-3xl bg-black/60 backdrop-blur-md border-l-4 border-purple-500 text-white p-4 rounded-r-lg shadow-lg animate-slide-in-top pointer-events-auto">
                <div className="flex items-start gap-4">
                  <MessageSquareQuote className="text-purple-400 shrink-0 mt-1" size={24} />
                  <div>
                     <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Yapay Zeka Spiker</h3>
                     <p className="font-display text-lg leading-snug shadow-black drop-shadow-md">{commentary.text}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4 bg-black/50 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <button onClick={prevCamera} className="p-3 hover:bg-white/10 rounded-xl text-white transition">
              <ChevronLeft />
            </button>
            <div className="flex flex-col items-center min-w-[150px]">
               <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Kamera</span>
               <span className="font-display font-bold text-yellow-400 truncate max-w-[140px]">
                 {cameraTargetId 
                   ? players.find(p => p.id === cameraTargetId)?.name || 'Bilinmeyen' 
                   : 'Lideri Takip Et'}
               </span>
            </div>
            <button onClick={nextCamera} className="p-3 hover:bg-white/10 rounded-xl text-white transition">
              <ChevronRight />
            </button>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <button 
              onClick={() => setCameraTargetId(null)} 
              className={`p-3 rounded-xl transition ${!cameraTargetId ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Lideri Takip Et"
            >
              <Video size={20} />
            </button>
          </div>
          
          <div className="absolute top-20 right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 w-48 hidden md:block">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
              <Users size={12} /> Sıralama
            </h4>
            <div className="space-y-1">
              {[...players].sort((a,b) => b.distance - a.distance).slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                   <span className="text-gray-500 w-4">{i+1}.</span>
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}}></div>
                   <span className="truncate text-white">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {gameState === GameState.FINISHED && winner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transform scale-100 animate-bounce-in">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
              <Trophy size={48} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-display font-bold text-white mb-2">KAZANAN!</h2>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">
              {winner.name}
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left border border-white/5">
              <h3 className="text-xs font-bold text-purple-400 uppercase mb-2 flex items-center gap-2">
                 <MessageSquareQuote size={14} /> Spiker Yorumu
              </h3>
              <p className="text-gray-300 italic text-sm">
                {commentary.isLoading ? "Yorum hazırlanıyor..." : `"${commentary.text}"`}
              </p>
            </div>

            <button 
              onClick={handleReset}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} /> Tekrar Oyna
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

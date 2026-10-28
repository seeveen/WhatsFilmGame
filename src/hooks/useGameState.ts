import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { GameStateDTO, LiveNotification, TikTokLogLine } from '../../shared/types.ts';
import { soundEffects } from '../utils/audio.ts';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameStateDTO | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [tiktokLogs, setTiktokLogs] = useState<TikTokLogLine[]>([]);
  const previousStatusRef = useRef<string>('');

  useEffect(() => {
    // Initial fetch to ensure instant display
    fetch('/api/state')
      .then((res) => res.json())
      .then((data: GameStateDTO) => {
        setGameState(data);
      })
      .catch((err) => {
        console.warn('Failed initial state fetch:', err);
      });

    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('game:state', (newState: GameStateDTO) => {
      setGameState(newState);

      // Trigger confetti on match completion
      if (
        newState.status === 'match_result' &&
        previousStatusRef.current !== 'match_result'
      ) {
        soundEffects.playVictory();
        if (!prefersReducedMotion()) {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#C5163D', '#E5254D', '#8F102B', '#F7F2F4'],
          });
        }
      }

      previousStatusRef.current = newState.status;
    });

    socket.on('game:correct_guess', () => soundEffects.playSuccess());
    socket.on('game:gift_received', () => soundEffects.playGift());
    socket.on('game:notification', (notification: LiveNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 20));
    });
    socket.on('tiktok:log', (log: TikTokLogLine) => {
      setTiktokLogs((current) => [log, ...current].slice(0, 100));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    gameState,
    isConnected,
    notifications,
    tiktokLogs,
  };
}

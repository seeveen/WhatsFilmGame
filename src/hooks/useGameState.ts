import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { GameStateDTO, GiftConfig } from '../../shared/types.ts';
import { soundEffects } from '../utils/audio.ts';

export function useGameState() {
  const [gameState, setGameState] = useState<GameStateDTO | null>(null);
  const [recentNotification, setRecentNotification] = useState<{
    id: string;
    type: 'correct' | 'gift';
    text: string;
    subText?: string;
  } | null>(null);

  const [recentGiftPush, setRecentGiftPush] = useState<{
    id: string;
    username: string;
    giftId?: number | string;
    giftName: string;
    giftIcon?: string;
    giftIconType?: 'emoji' | 'image';
    action?: GiftConfig['action'];
    effectLabel: string;
    amount: number;
    timestamp: number;
    avatarUrl?: string;
  } | null>(null);

  const previousStatusRef = useRef<string>('');
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const giftPushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    socket.on('game:state', (newState: GameStateDTO) => {
      setGameState(newState);

      // Trigger confetti on match completion
      if (
        newState.status === 'match_result' &&
        previousStatusRef.current !== 'match_result'
      ) {
        soundEffects.playVictory();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#8F102B', '#E5254D', '#F7F2F4', '#FFD700'],
        });
      }

      previousStatusRef.current = newState.status;
    });

    socket.on('game:correct_guess', (data: any) => {
      soundEffects.playSuccess();
      const multiplierText = data.winner?.multiplierApplied ? ' (PONTOS ×2!)' : '';
      showNotification({
        id: `correct_${Date.now()}`,
        type: 'correct',
        text: `🎉 @${data.winner.username} ACERTOU!`,
        subText: `+${data.winner.points} pts${multiplierText}`,
      });
    });

    socket.on('game:gift_received', (gift: any) => {
      soundEffects.playGift();
      if (giftPushTimeoutRef.current) {
        clearTimeout(giftPushTimeoutRef.current);
      }
      setRecentGiftPush({
        id: gift.id || `gift_${Date.now()}`,
        username: gift.username,
        giftId: gift.giftId,
        giftName: gift.giftName,
        giftIcon: gift.giftIcon,
        giftIconType: gift.giftIconType,
        action: gift.action,
        effectLabel: gift.effectLabel,
        amount: gift.amount || 1,
        timestamp: gift.timestamp || Date.now(),
        avatarUrl: gift.avatarUrl,
      });

      giftPushTimeoutRef.current = setTimeout(() => {
        setRecentGiftPush(null);
      }, 5000);
    });

    return () => {
      socket.disconnect();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      if (giftPushTimeoutRef.current) {
        clearTimeout(giftPushTimeoutRef.current);
      }
    };
  }, []);

  const showNotification = (notif: {
    id: string;
    type: 'correct' | 'gift';
    text: string;
    subText?: string;
  }) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setRecentNotification(notif);
    notificationTimeoutRef.current = setTimeout(() => {
      setRecentNotification(null);
    }, 4500);
  };

  return {
    gameState,
    recentNotification,
    recentGiftPush,
  };
}

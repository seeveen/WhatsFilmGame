/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState.ts';
import { LiveTransmissionView } from './components/game/LiveTransmissionView.tsx';
import { AdminPanel } from './components/admin/AdminPanel.tsx';
import { RefreshCw, Sparkles } from 'lucide-react';

const urlParams = new URLSearchParams(window.location.search);

export default function App() {
  const { gameState, recentNotification, recentGiftPush } = useGameState();
  const [activeView, setActiveView] = useState<'stream' | 'admin'>(() =>
    urlParams.get('view') === 'admin' ? 'admin' : 'stream'
  );
  const layout = urlParams.get('layout') === 'landscape'
    ? 'landscape'
    : 'portrait';

  useEffect(() => {
    if (urlParams.get('autostart') === '1') {
      fetch('/api/game/start', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const handleRestartMatch = async () => {
    try {
      await fetch('/api/game/start', { method: 'POST' });
    } catch (e) {
      console.error('Failed to restart match:', e);
    }
  };

  const returnToGame = () => {
    if (window.desktopControls) {
      window.desktopControls.returnToGame();
      return;
    }
    setActiveView('stream');
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#110F11] flex flex-col items-center justify-center p-4 text-[#F7F2F4]">
        <div className="w-12 h-12 rounded-md bg-[#8F102B] flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold font-display tracking-wide mb-2">QUAL É O FILME?</h1>
        <p className="text-xs text-[#B7A8AE] flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E5254D]" />
          Conectando ao servidor do jogo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110F11] text-[#F7F2F4] font-['Inter',sans-serif] select-none">
      {activeView === 'stream' ? (
        <LiveTransmissionView
          gameState={gameState}
          layout={layout}
          onRestartMatch={handleRestartMatch}
          recentNotification={recentNotification}
          recentGiftPush={recentGiftPush}
        />
      ) : (
        <AdminPanel
          gameState={gameState}
          onReturnToStream={returnToGame}
        />
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState.ts';
import { LiveTransmissionView } from './components/game/LiveTransmissionView.tsx';
import { StandbyScreen } from './components/game/StandbyScreen.tsx';
import { AdminPanel } from './components/admin/AdminPanel.tsx';

export default function App() {
  const { gameState, isConnected, notifications, tiktokLogs } = useGameState();
  const [activeView, setActiveView] = useState<'stream' | 'admin'>(() =>
    new URLSearchParams(window.location.search).get('view') === 'admin' ? 'admin' : 'stream'
  );
  const layout = new URLSearchParams(window.location.search).get('layout') === 'landscape'
    ? 'landscape'
    : 'portrait';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
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
      <div className="stage" data-layout={activeView === 'admin' ? 'portrait' : layout} data-status="connecting">
        <div className="stage__canvas">
          <StandbyScreen kind="connecting" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {activeView === 'stream' ? (
        <LiveTransmissionView
          gameState={gameState}
          layout={layout}
          isConnected={isConnected}
          onRestartMatch={handleRestartMatch}
          notifications={notifications}
        />
      ) : (
        <AdminPanel gameState={gameState} onReturnToStream={returnToGame} tiktokLogs={tiktokLogs} />
      )}
    </div>
  );
}

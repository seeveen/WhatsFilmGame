import React, { useEffect, useRef, useState } from 'react';
import { GameStateDTO, TikTokLogLine } from '../../../shared/types.ts';
import { FeedbackProvider } from '../ui/index.ts';
import { AdminSidebar, AdminTab } from './AdminSidebar.tsx';
import { AdminStatusBar } from './AdminStatusBar.tsx';
import { OverviewTab } from './tabs/OverviewTab.tsx';
import { LibraryTab } from './tabs/LibraryTab.tsx';
import { MechanicsTab } from './tabs/MechanicsTab.tsx';
import { GiftsTab } from './tabs/GiftsTab.tsx';
import { TikTokTab } from './tabs/TikTokTab.tsx';
import { HistoryTab } from './tabs/HistoryTab.tsx';

interface AdminPanelProps {
  gameState: GameStateDTO;
  onReturnToStream: () => void;
  tiktokLogs: TikTokLogLine[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ gameState, onReturnToStream, tiktokLogs }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const mainRef = useRef<HTMLElement>(null);

  // Cada seção abre no topo, como uma página nova.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <FeedbackProvider>
      <div className="admin">
        <AdminSidebar currentTab={activeTab} onSelectTab={setActiveTab} onReturnToStream={onReturnToStream} />

        <div className="admin-body">
          <AdminStatusBar gameState={gameState} />
          <main className="admin-main" ref={mainRef}>
            <div className="admin-content">
              {activeTab === 'overview' && <OverviewTab gameState={gameState} />}
              {activeTab === 'library' && <LibraryTab />}
              {activeTab === 'mechanics' && <MechanicsTab />}
              {activeTab === 'gifts' && <GiftsTab />}
              {activeTab === 'tiktok' && <TikTokTab gameState={gameState} logs={tiktokLogs} />}
              {activeTab === 'history' && <HistoryTab />}
            </div>
          </main>
        </div>
      </div>
    </FeedbackProvider>
  );
};

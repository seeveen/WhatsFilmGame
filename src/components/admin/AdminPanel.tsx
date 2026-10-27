import React, { useState } from 'react';
import { GameStateDTO } from '../../../shared/types.ts';
import { AdminSidebar, AdminTab } from './AdminSidebar.tsx';
import { OverviewTab } from './tabs/OverviewTab.tsx';
import { LibraryTab } from './tabs/LibraryTab.tsx';
import { MechanicsTab } from './tabs/MechanicsTab.tsx';
import { GiftsTab } from './tabs/GiftsTab.tsx';
import { TikTokTab } from './tabs/TikTokTab.tsx';
import { HistoryTab } from './tabs/HistoryTab.tsx';

interface AdminPanelProps {
  gameState: GameStateDTO;
  onReturnToStream: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  gameState,
  onReturnToStream,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <div className="w-full min-h-screen bg-[#110F11] flex flex-col lg:flex-row text-[#F7F2F4] font-body">
      {/* Sidebar navigation */}
      <AdminSidebar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onReturnToStream={onReturnToStream}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-0 lg:h-screen overflow-y-auto p-4 sm:p-6 lg:p-10 bg-[#110F11]">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewTab gameState={gameState} />}
          {activeTab === 'library' && <LibraryTab />}
          {activeTab === 'mechanics' && <MechanicsTab />}
          {activeTab === 'gifts' && <GiftsTab />}
          {activeTab === 'tiktok' && <TikTokTab gameState={gameState} />}
          {activeTab === 'history' && <HistoryTab />}
        </div>
      </main>
    </div>
  );
};

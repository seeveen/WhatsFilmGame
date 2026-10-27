import React from 'react';
import {
  LayoutDashboard,
  Film,
  Sliders,
  Gift,
  Radio,
  History,
  Tv,
} from 'lucide-react';

export type AdminTab = 'overview' | 'library' | 'mechanics' | 'gifts' | 'tiktok' | 'history';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onReturnToStream: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onReturnToStream,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'library', label: 'Biblioteca', icon: <Film className="w-4 h-4" /> },
    { id: 'mechanics', label: 'Mecânicas', icon: <Sliders className="w-4 h-4" /> },
    { id: 'gifts', label: 'Presentes & Imagens', icon: <Gift className="w-4 h-4" /> },
    { id: 'tiktok', label: 'Integração TikTok', icon: <Radio className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-60 lg:min-h-screen bg-[#151214] border-b lg:border-b-0 lg:border-r border-[#39272E] flex flex-col justify-between p-3 sm:p-4 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="px-1.5 py-2.5 mb-3 lg:mb-6 flex items-center gap-3 border-b border-[#39272E]">
          <div className="w-10 h-10 rounded-md bg-[#8F102B] flex items-center justify-center shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M3 8l2.5-4.5 14 -1" />
              <path d="M10 12.5v4l3.5-2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm font-display text-white tracking-tight block leading-tight whitespace-nowrap">
              Qual é o <span className="text-[#C5163D]">filme?</span>
            </span>
            <span className="text-[10px] text-[#897A81] uppercase font-semibold tracking-[0.16em] block mt-1">
              Royal Red Cinema
            </span>
          </div>
          <button
            onClick={onReturnToStream}
            className="ml-auto lg:hidden inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#39272E] bg-[#21171B] px-2.5 py-2 text-[10px] font-semibold text-white"
            aria-label="Voltar à tela de transmissão"
          >
            <Tv className="h-3.5 w-3.5 text-[#E5254D]" />
            LIVE
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 lg:shrink ${
                  isActive
                    ? 'bg-[#8F102B]/30 text-white border border-[#C5163D]/30'
                    : 'text-[#B7A8AE] border border-transparent hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className={isActive ? 'text-[#E5254D]' : 'text-[#897A81]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Return to stream view button */}
      <div className="hidden lg:block pt-4 border-t border-[#39272E]">
        <button
          onClick={onReturnToStream}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-md bg-[#21171B] hover:bg-[#2A1C21] border border-[#39272E] text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <Tv className="w-4 h-4 text-[#E5254D]" />
          <span>Tela de Transmissão</span>
        </button>
      </div>
    </aside>
  );
};

import React from 'react';
import { LayoutDashboard, Film, SlidersHorizontal, Gift, Radio, History, Tv } from 'lucide-react';
import { BrandLockup } from '../brand/BrandMark.tsx';
import { Button } from '../ui/index.ts';

export type AdminTab = 'overview' | 'library' | 'mechanics' | 'gifts' | 'tiktok' | 'history';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onReturnToStream: () => void;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Partida',
    items: [
      { id: 'overview', label: 'Visão geral', icon: <LayoutDashboard /> },
      { id: 'mechanics', label: 'Mecânicas', icon: <SlidersHorizontal /> },
    ],
  },
  {
    label: 'Conteúdo',
    items: [{ id: 'library', label: 'Biblioteca', icon: <Film /> }],
  },
  {
    label: 'Transmissão',
    items: [
      { id: 'gifts', label: 'Presentes', icon: <Gift /> },
      { id: 'tiktok', label: 'TikTok LIVE', icon: <Radio /> },
    ],
  },
  {
    label: 'Registro',
    items: [{ id: 'history', label: 'Histórico', icon: <History /> }],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, onSelectTab, onReturnToStream }) => {
  // The Esc / F9 shortcuts are handled by the desktop shell, so only advertise them there.
  const isDesktop = typeof window !== 'undefined' && !!window.desktopControls;

  return (
    <aside className="admin-side">
      <div className="admin-side__brand">
        <BrandLockup size={17} sub="Painel" />
      </div>

      <nav className="admin-nav" aria-label="Seções do painel">
        {NAV_GROUPS.map((group) => (
          <div className="admin-nav__group" role="group" aria-label={group.label} key={group.label}>
            <span className="admin-nav__label" aria-hidden>
              {group.label}
            </span>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="admin-nav__item"
                // No modo compacto (≤820px) o texto some; o nome acessível e a dica continuam.
                aria-label={item.label}
                title={item.label}
                aria-current={currentTab === item.id ? 'page' : undefined}
                onClick={() => onSelectTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-foot">
        <Button variant="secondary" block icon={<Tv />} onClick={onReturnToStream} aria-label="Voltar ao jogo" title="Voltar ao jogo">
          Voltar ao jogo
        </Button>
        {isDesktop && (
          <ul className="admin-hints">
            <li>
              <kbd className="kbd">Esc</kbd> volta ao jogo
            </li>
            <li>
              <kbd className="kbd">F9</kbd> retrato / paisagem
            </li>
          </ul>
        )}
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Smile,
  X,
  Play,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GameSettings, GiftConfig } from '../../../../shared/types.ts';
import { DEFAULT_SETTINGS, DEFAULT_GIFTS } from '../../../game/scoring.ts';

export const GiftsTab: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [giftsList, setGiftsList] = useState<GiftConfig[]>(DEFAULT_GIFTS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [simFeedback, setSimFeedback] = useState('');

  // Modal create/edit gift
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGiftIndex, setEditingGiftIndex] = useState<number | null>(null);

  // Form states
  const [giftId, setGiftId] = useState('');
  const [giftName, setGiftName] = useState('');
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconValue, setIconValue] = useState('🎁');
  const [action, setAction] = useState<GiftConfig['action']>('add_time');
  const [value, setValue] = useState(5);
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: GameSettings) => {
        setSettings(data);
        if (data.giftsConfig && data.giftsConfig.length > 0) {
          setGiftsList(data.giftsConfig);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const openNewGiftModal = () => {
    setEditingGiftIndex(null);
    setGiftId(`gift_${Date.now().toString(36)}`);
    setGiftName('');
    setIconType('emoji');
    setIconValue('🎁');
    setAction('add_time');
    setValue(5);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditGiftModal = (gift: GiftConfig, index: number) => {
    setEditingGiftIndex(index);
    setGiftId(gift.id);
    setGiftName(gift.name);
    setIconType(gift.iconType || 'emoji');
    setIconValue(gift.iconValue || '🎁');
    setAction(gift.action);
    setValue(gift.value || 5);
    setActive(gift.active !== false);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setIconType('image');
      setIconValue(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModalGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftId.trim() || !giftName.trim()) {
      alert('Preencha o ID e o Nome do presente.');
      return;
    }

    const updatedGift: GiftConfig = {
      id: giftId.trim(),
      name: giftName.trim(),
      iconType,
      iconValue,
      action,
      value: Number(value) || 1,
      active,
    };

    let updatedList = [...giftsList];
    if (editingGiftIndex !== null) {
      updatedList[editingGiftIndex] = updatedGift;
    } else {
      updatedList.push(updatedGift);
    }

    setGiftsList(updatedList);
    setIsModalOpen(false);
    saveSettingsDirectly(updatedList);
  };

  const handleDeleteGift = (index: number) => {
    if (!confirm(`Deseja realmente remover o presente "${giftsList[index].name}"?`)) return;
    const updated = giftsList.filter((_, i) => i !== index);
    setGiftsList(updated);
    saveSettingsDirectly(updated);
  };

  const handleToggleActive = (index: number) => {
    const updated = [...giftsList];
    updated[index].active = !updated[index].active;
    setGiftsList(updated);
    saveSettingsDirectly(updated);
  };

  const saveSettingsDirectly = async (newList: GiftConfig[]) => {
    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, giftsConfig: newList };
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        setSettings(updatedSettings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e: any) {
      alert(`Falha ao salvar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerSimGift = async (gift: GiftConfig) => {
    try {
      const res = await fetch('/api/tiktok/simulate-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'apoiador_vip',
          giftName: gift.name,
          repeatCount: 1,
        }),
      });
      if (res.ok) {
        setSimFeedback(`Presente "${gift.name}" acionado com sucesso na transmissão!`);
        setTimeout(() => setSimFeedback(''), 3500);
      }
    } catch (e: any) {
      setSimFeedback(`Erro: ${e.message}`);
    }
  };

  const getActionBadge = (act: GiftConfig['action'], val: number) => {
    if (act === 'add_time') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
          <Clock className="w-3 h-3" />
          +{val}s de tempo
        </span>
      );
    }
    if (act === 'reveal_letter') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3 h-3" />
          Revela {val} Letra{val > 1 ? 's' : ''}
        </span>
      );
    }
    if (act === 'multiplier_2x') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#C5163D]/20 border border-[#C5163D]/40 text-[#E5254D] font-bold flex items-center gap-1 text-[11px]">
          <Zap className="w-3 h-3" />
          Pontos ×{val}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-[11px]">
        Personalizado
      </span>
    );
  };

  return (
    <div className="space-y-6 text-[#F7F2F4]">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl">
        <div>
          <h2 className="text-lg font-extrabold text-white font-display flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#C5163D]" />
            Gerenciador de Presentes TikTok LIVE
          </h2>
          <p className="text-xs text-[#B7A8AE] mt-1">
            Personalize IDs de presentes, adicione imagens PNG ou emojis, mude nomes e configure efeitos em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Salvo no Servidor!
            </span>
          )}

          <button
            onClick={openNewGiftModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold shadow-lg shadow-[#C5163D]/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Novo Presente
          </button>
        </div>
      </div>

      {simFeedback && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 animate-in fade-in">
          {simFeedback}
        </div>
      )}

      {/* Gifts List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {giftsList.map((gift, idx) => (
          <div
            key={gift.id || idx}
            className={`p-5 rounded-lg border transition-all ${
              gift.active
                ? 'bg-[#1C171A] border-[#39272E] shadow-lg'
                : 'bg-[#1C171A]/50 border-[#39272E]/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3.5">
                {/* Gift Icon Display (Image or Emoji) */}
                <div className="w-14 h-14 rounded-lg bg-[#110F11] border border-[#39272E] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {gift.iconType === 'image' && gift.iconValue ? (
                    <img
                      src={gift.iconValue}
                      alt={gift.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <span className="text-3xl select-none">{gift.iconValue || '🎁'}</span>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                    {gift.name}
                    {!gift.active && (
                      <span className="text-[10px] uppercase font-bold text-zinc-500">
                        (Inativo)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#B7A8AE] mt-0.5">
                    <span className="font-mono-num font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
                      ID: {gift.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action badge */}
              <div>{getActionBadge(gift.action, gift.value)}</div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#39272E]/60 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerSimGift(gift)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#21171B] hover:bg-white/10 text-white font-semibold border border-[#39272E] transition-all cursor-pointer"
                  title="Disparar este presente no jogo agora para testar visualmente"
                >
                  <Play className="w-3 h-3 fill-current text-[#C5163D]" />
                  Testar na LIVE
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                    gift.active
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {gift.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditGiftModal(gift, idx)}
                  className="p-2 rounded-md bg-[#21171B] hover:bg-white/10 text-zinc-300 hover:text-white border border-[#39272E] transition-colors cursor-pointer"
                  title="Editar presente"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteGift(idx)}
                  className="p-2 rounded-md bg-[#21171B] hover:bg-[#C5163D]/20 text-zinc-400 hover:text-[#E5254D] border border-[#39272E] transition-colors cursor-pointer"
                  title="Remover presente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Cap and Settings Card */}
      <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] text-xs space-y-3">
        <label className="block text-[#B7A8AE] font-semibold text-sm">
          Limite Máximo de Tempo Extra Acumulado por Round (Segundos)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={10}
            max={300}
            value={settings.maxAddedTimePerRound}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 60;
              const updated = { ...settings, maxAddedTimePerRound: val };
              setSettings(updated);
              fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });
            }}
            className="w-44 px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-display font-bold text-base focus:outline-none focus:border-[#C5163D]"
          />
          <span className="text-zinc-500">
            Protege contra spam excessivo de presentes que poderiam tornar o round infinito.
          </span>
        </div>
      </div>

      {/* Modal: Adicionar ou Editar Presente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg rounded-lg bg-[#1C171A] border border-[#39272E] p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#39272E]">
              <h3 className="font-display font-extrabold text-lg text-white">
                {editingGiftIndex !== null ? 'Editar Presente' : 'Adicionar Novo Presente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalGift} className="space-y-4 text-xs">
              {/* ID and Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">
                    ID do Presente (TikTok ID / Slug) *
                  </label>
                  <input
                    type="text"
                    value={giftId}
                    onChange={(e) => setGiftId(e.target.value)}
                    placeholder="ex: gift_rose ou 5655"
                    required
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs font-mono-num focus:outline-none focus:border-[#C5163D]"
                  />
                </div>

                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">
                    Nome do Presente *
                  </label>
                  <input
                    type="text"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                    placeholder="ex: Rosa, Capivara, Leão"
                    required
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs font-display font-bold focus:outline-none focus:border-[#C5163D]"
                  />
                </div>
              </div>

              {/* Icon Type Selection: PNG Image vs Emoji */}
              <div>
                <label className="block text-[#B7A8AE] font-semibold mb-1.5">
                  Tipo de Ícone do Presente
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setIconType('emoji')}
                    className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      iconType === 'emoji'
                        ? 'bg-[#C5163D]/20 border-[#C5163D] text-white'
                        : 'bg-[#21171B] border-[#39272E] text-[#B7A8AE]'
                    }`}
                  >
                    <Smile className="w-4 h-4 text-amber-400" />
                    Emoji Unicode
                  </button>

                  <button
                    type="button"
                    onClick={() => setIconType('image')}
                    className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      iconType === 'image'
                        ? 'bg-[#C5163D]/20 border-[#C5163D] text-white'
                        : 'bg-[#21171B] border-[#39272E] text-[#B7A8AE]'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-[#E5254D]" />
                    Imagem PNG / Ícone
                  </button>
                </div>

                {iconType === 'emoji' ? (
                  <div>
                    <label className="block text-zinc-400 mb-1">Escolha ou digite o Emoji:</label>
                    <input
                      type="text"
                      value={iconValue}
                      onChange={(e) => setIconValue(e.target.value)}
                      placeholder="ex: 🫰, 🌹, 🦁, 👑"
                      className="w-full px-3.5 py-2 rounded-md bg-[#110F11] border border-[#39272E] text-white text-lg focus:outline-none focus:border-[#C5163D]"
                    />
                    {/* Quick Preset Buttons */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-zinc-500 mr-1">Atalhos rápidos:</span>
                      {[
                        { emoji: '🫰', name: 'Finger Heart', id: 'finger_heart', action: 'reveal_letter', val: 1 },
                        { emoji: '🌹', name: 'Rosa', id: 'rose', action: 'add_time', val: 5 },
                        { emoji: '🤍', name: 'Rosa Branca', id: 'white_rose', action: 'add_time', val: 5 },
                        { emoji: '🦫', name: 'Capivara', id: 'capivara', action: 'multiplier_2x', val: 2 },
                        { emoji: '💎', name: 'Diamante', id: 'gift_diamond', action: 'reveal_letter', val: 2 },
                        { emoji: '🦁', name: 'Leão', id: 'gift_lion', action: 'multiplier_2x', val: 3 },
                        { emoji: '🚀', name: 'Foguete', id: 'gift_rocket', action: 'skip_round', val: 1 },
                      ].map((p) => (
                        <button
                          key={p.emoji}
                          type="button"
                          onClick={() => {
                            setIconValue(p.emoji);
                            setGiftName(p.name);
                            setGiftId(p.id);
                            setAction(p.action as any);
                            setValue(p.val);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#110F11] border border-[#39272E] hover:border-[#C5163D] text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Aplicar ${p.name}`}
                        >
                          <span className="text-sm">{p.emoji}</span>
                          <span className="text-[10px] text-zinc-300 font-semibold">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-zinc-400">
                      Upload de Imagem PNG ou Cole a URL:
                    </label>

                    <div className="flex items-center gap-3">
                      {iconValue && iconValue.startsWith('data:image') && (
                        <div className="w-12 h-12 rounded-md bg-[#110F11] border border-[#39272E] p-1 flex items-center justify-center shrink-0">
                          <img src={iconValue} alt="Preview" className="w-10 h-10 object-contain" />
                        </div>
                      )}

                      <label className="flex-1 py-2 px-3 rounded-md bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-white cursor-pointer font-semibold flex items-center justify-center gap-2 transition-all">
                        <Upload className="w-4 h-4 text-[#E5254D]" />
                        Upload de arquivo PNG
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={iconValue.startsWith('data:image') ? '' : iconValue}
                      onChange={(e) => setIconValue(e.target.value)}
                      placeholder="Ou cole a URL direta da imagem (https://...)"
                      className="w-full px-3 py-2 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs focus:outline-none focus:border-[#C5163D]"
                    />
                  </div>
                )}
              </div>

              {/* Action and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">
                    Efeito no Jogo *
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs focus:outline-none focus:border-[#C5163D]"
                  >
                    <option value="add_time">Adicionar Tempo (+segundos)</option>
                    <option value="reveal_letter">Revelar Letra da Resposta</option>
                    <option value="multiplier_2x">Multiplicar Pontos (×2, ×3...)</option>
                    <option value="custom">Personalizado (Sem Efeito)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">
                    {action === 'add_time'
                      ? 'Segundos Adicionados'
                      : action === 'multiplier_2x'
                      ? 'Multiplicador (ex: 2 para ×2)'
                      : 'Quantidade de Letras'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs font-mono-num focus:outline-none focus:border-[#C5163D]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-[#C5163D] focus:ring-[#C5163D]"
                  />
                  <span className="font-semibold text-white">Presente Ativo na LIVE</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-[#39272E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#21171B] border border-[#39272E] text-[#B7A8AE] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#C5163D] hover:bg-[#E5254D] text-white font-bold cursor-pointer shadow-lg shadow-[#C5163D]/20"
                >
                  Salvar Presente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

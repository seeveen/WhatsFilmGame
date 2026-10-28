import React, { useEffect, useState } from 'react';
import { Clock, Image as ImageIcon, Pencil, Play, Plus, Smile, Sparkles, Trash2, Upload, Zap, Gift } from 'lucide-react';
import { GameSettings, GiftConfig } from '../../../../shared/types.ts';
import { DEFAULT_SETTINGS, DEFAULT_GIFTS } from '../../../game/scoring.ts';
import {
  Button,
  Chip,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  NumberInput,
  PageHeader,
  Section,
  Segmented,
  Select,
  SettingList,
  SettingRow,
  Switch,
  TextInput,
  useFeedback,
} from '../../ui/index.ts';
import { GiftIcon, getCleanGiftName } from '../../game/GiftIcon.tsx';

type GiftAction = GiftConfig['action'];

/** Valor que o <img> consegue carregar (upload em base64, URL ou caminho do servidor). */
const isImageRef = (v: string) => /^(data:image|https?:\/\/|\/)/.test(v);

/** Atalhos de presentes populares (conteúdo da LIVE — os emojis aqui são dado, não ícone de interface). */
const PRESETS: { emoji: string; name: string; id: string; action: GiftAction; val: number }[] = [
  { emoji: '🫰', name: 'Finger Heart', id: 'finger_heart', action: 'reveal_letter', val: 1 },
  { emoji: '🌹', name: 'Rosa', id: 'rose', action: 'add_time', val: 5 },
  { emoji: '🤍', name: 'Rosa Branca', id: 'white_rose', action: 'add_time', val: 5 },
  { emoji: '🦫', name: 'Capivara', id: 'capivara', action: 'multiplier_2x', val: 2 },
  { emoji: '💎', name: 'Diamante', id: 'gift_diamond', action: 'reveal_letter', val: 2 },
  { emoji: '🦁', name: 'Leão', id: 'gift_lion', action: 'multiplier_2x', val: 3 },
  // O original gravava a ação "skip_round", que o tipo e o motor não reconhecem (efeito nulo); aqui vira "custom" (sem efeito), igual na prática.
  { emoji: '🚀', name: 'Foguete', id: 'gift_rocket', action: 'custom', val: 1 },
];

const EffectChip: React.FC<{ action: GiftAction; value: number }> = ({ action, value }) => {
  if (action === 'add_time')
    return (
      <Chip tone="success" icon={<Clock />}>
        +{value}s de tempo
      </Chip>
    );
  if (action === 'reveal_letter')
    return (
      <Chip icon={<Sparkles />}>
        Revela {value} {value > 1 ? 'letras' : 'letra'}
      </Chip>
    );
  if (action === 'multiplier_2x')
    return (
      <Chip tone="brand" icon={<Zap />}>
        Pontos ×{value}
      </Chip>
    );
  return <Chip>Sem efeito</Chip>;
};

export const GiftsTab: React.FC = () => {
  const { toast, confirm } = useFeedback();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [maxTimeDraft, setMaxTimeDraft] = useState(String(DEFAULT_SETTINGS.maxAddedTimePerRound));
  const [giftsList, setGiftsList] = useState<GiftConfig[]>(DEFAULT_GIFTS);
  const [isSaving, setIsSaving] = useState(false);

  // Diálogo criar/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGiftIndex, setEditingGiftIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState(false);

  const [giftId, setGiftId] = useState('');
  const [giftName, setGiftName] = useState('');
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconValue, setIconValue] = useState('🎁');
  const [action, setAction] = useState<GiftAction>('add_time');
  const [value, setValue] = useState(5);
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: GameSettings) => {
        setSettings(data);
        setMaxTimeDraft(String(data.maxAddedTimePerRound ?? DEFAULT_SETTINGS.maxAddedTimePerRound));
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
    setFormError(false);
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
    setFormError(false);
    setIsModalOpen(true);
  };

  // Ao trocar o tipo, o valor antigo não serve para o novo formato (emoji ≠ URL de imagem) — evita salvar uma imagem inválida.
  const changeIconType = (next: 'emoji' | 'image') => {
    setIconType(next);
    if (next === 'image' && !isImageRef(iconValue)) setIconValue('');
    if (next === 'emoji' && (isImageRef(iconValue) || !iconValue)) setIconValue('🎁');
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

  const saveSettingsDirectly = async (newList: GiftConfig[], okMessage = 'Presentes salvos no servidor.') => {
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
        toast('success', okMessage);
      } else {
        toast('error', 'O servidor recusou as alterações.', 'Não foi possível salvar');
      }
    } catch (e: any) {
      toast('error', e.message, 'Falha ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModalGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftId.trim() || !giftName.trim()) {
      setFormError(true);
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

    const updatedList = [...giftsList];
    if (editingGiftIndex !== null) {
      updatedList[editingGiftIndex] = updatedGift;
    } else {
      updatedList.push(updatedGift);
    }

    setGiftsList(updatedList);
    setIsModalOpen(false);
    saveSettingsDirectly(updatedList, editingGiftIndex !== null ? 'Presente atualizado.' : 'Presente adicionado.');
  };

  const handleDeleteGift = async (index: number) => {
    const target = giftsList[index];
    const ok = await confirm({
      title: `Remover “${target.name}”?`,
      message: 'O presente deixa de ser reconhecido na LIVE. Você pode cadastrá-lo de novo depois.',
      confirmLabel: 'Remover presente',
    });
    if (!ok) return;
    const updated = giftsList.filter((_, i) => i !== index);
    setGiftsList(updated);
    saveSettingsDirectly(updated, 'Presente removido.');
  };

  const handleToggleActive = (index: number) => {
    const updated = giftsList.map((g, i) => (i === index ? { ...g, active: !g.active } : g));
    setGiftsList(updated);
    saveSettingsDirectly(updated, updated[index].active ? 'Presente ativado.' : 'Presente desativado.');
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
        toast('success', `“${gift.name}” acionado na transmissão.`);
      } else {
        toast('error', 'O servidor não aceitou o teste.');
      }
    } catch (e: any) {
      toast('error', e.message, 'Erro');
    }
  };

  const handleMaxTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxTimeDraft(e.currentTarget.value);
  };

  const handleMaxTimeBlur = async () => {
    const parsed = Number.parseInt(maxTimeDraft, 10);
    if (!maxTimeDraft.trim() || Number.isNaN(parsed)) {
      setMaxTimeDraft(String(settings.maxAddedTimePerRound));
      return;
    }

    const value = Math.min(300, Math.max(10, parsed));
    const updated = { ...settings, maxAddedTimePerRound: value };
    setSettings(updated);
    setMaxTimeDraft(String(value));
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!response.ok) throw new Error('O servidor recusou o limite de tempo.');
    } catch (error: any) {
      setSettings(settings);
      setMaxTimeDraft(String(settings.maxAddedTimePerRound));
      toast('error', error.message, 'Falha ao salvar');
    }
  };

  const valueLabel =
    action === 'add_time' ? 'Segundos adicionados' : action === 'multiplier_2x' ? 'Multiplicador (2 = ×2)' : 'Quantidade de letras';
  const valueRelevant = action !== 'custom';
  const activeCount = giftsList.filter((g) => g.active).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Transmissão"
        title="Presentes"
        description="Cadastre os presentes da LIVE e defina o efeito de cada um no jogo. As alterações valem imediatamente."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={openNewGiftModal}>
            Adicionar presente
          </Button>
        }
      />

      <Section
        title="Presentes cadastrados"
        description={`${giftsList.length} ${giftsList.length === 1 ? 'cadastrado' : 'cadastrados'} · ${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`}
      >
        {giftsList.length === 0 ? (
          <EmptyState
            icon={<Gift />}
            title="Nenhum presente cadastrado"
            description="Adicione o primeiro presente para que a LIVE possa dar tempo, letras ou pontos em dobro."
            action={
              <Button variant="primary" icon={<Plus />} onClick={openNewGiftModal}>
                Adicionar presente
              </Button>
            }
          />
        ) : (
          <div className="rowlist">
            {giftsList.map((gift, idx) => (
              <div key={gift.id || idx} className={`rowlist__item gifts-row ${gift.active ? '' : 'is-muted'}`}>
                <div className="rowlist__lead">
                  <GiftIcon gift={gift} fallbackEmoji="🎁" />
                </div>
                <div className="rowlist__main">
                  <div className="rowlist__title">
                    <span className="gifts-row__name">{getCleanGiftName(gift.name, gift.iconType === 'image')}</span>
                    {!gift.active && <Chip>Inativo</Chip>}
                  </div>
                  <div className="gifts-row__meta">
                    <EffectChip action={gift.action} value={gift.value} />
                    <span className="gifts-row__id" title="ID do presente (TikTok ID ou apelido)">
                      ID {gift.id}
                    </span>
                  </div>
                </div>
                <div className="rowlist__end">
                  <Button
                    size="sm"
                    icon={<Play />}
                    onClick={() => handleTriggerSimGift(gift)}
                    title="Dispara este presente no jogo agora, como teste"
                  >
                    Testar
                  </Button>
                  <Switch
                    checked={!!gift.active}
                    onChange={() => handleToggleActive(idx)}
                    disabled={isSaving}
                    className="gifts-row__switch"
                    label={<span className="sr-only">{gift.active ? `Desativar ${gift.name}` : `Ativar ${gift.name}`}</span>}
                  />
                  <IconButton label={`Editar ${gift.name}`} size="sm" onClick={() => openEditGiftModal(gift, idx)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label={`Remover ${gift.name}`} size="sm" onClick={() => handleDeleteGift(idx)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Proteção contra spam">
        <SettingList>
          <SettingRow
            label="Limite de tempo extra por rodada"
            hint="Máximo de segundos que presentes podem acrescentar em uma mesma rodada. Salvo ao sair do campo."
            htmlFor="gifts-max-time"
          >
            <NumberInput
              id="gifts-max-time"
              min={10}
              max={300}
              unit="s"
              value={maxTimeDraft}
              onChange={handleMaxTimeChange}
              onBlur={handleMaxTimeBlur}
            />
          </SettingRow>
        </SettingList>
      </Section>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGiftIndex !== null ? 'Editar presente' : 'Adicionar presente'}
        description="Defina como o presente aparece e o que ele faz quando chega na LIVE."
        footer={
          <>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" form="gift-form">
              Salvar presente
            </Button>
          </>
        }
      >
        <form id="gift-form" className="gift-form" onSubmit={handleSaveModalGift} noValidate>
          <div className="form-grid form-grid--2">
            <Field
              label="ID do presente"
              required
              htmlFor="gift-id"
              hint="ID do TikTok ou apelido. Ex.: gift_rose, 5655"
              error={formError && !giftId.trim() ? 'Informe o ID.' : undefined}
            >
              <TextInput id="gift-id" mono value={giftId} onChange={(e) => setGiftId(e.target.value)} placeholder="gift_rose ou 5655" autoComplete="off" />
            </Field>
            <Field label="Nome do presente" required htmlFor="gift-name" error={formError && !giftName.trim() ? 'Informe o nome.' : undefined}>
              <TextInput id="gift-name" value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="Rosa, Capivara, Leão…" autoComplete="off" />
            </Field>
          </div>

          <div className="gift-form__icon">
            <span className="field__label">Ícone</span>
            <Segmented
              label="Tipo de ícone"
              value={iconType}
              onChange={changeIconType}
              options={[
                { value: 'emoji', label: 'Emoji', icon: <Smile /> },
                { value: 'image', label: 'Imagem', icon: <ImageIcon /> },
              ]}
            />

            <div className="gift-form__iconbody">
              <div className="gift-form__preview" aria-hidden="true">
                {iconType === 'image' && !iconValue ? <ImageIcon className="gift-form__placeholder" /> : <GiftIcon gift={{ iconType, iconValue }} fallbackEmoji="🎁" />}
              </div>

              {iconType === 'emoji' ? (
                <div className="gift-form__iconfields">
                  <Field label="Emoji do presente" htmlFor="gift-emoji">
                    <TextInput id="gift-emoji" emoji value={iconValue} onChange={(e) => setIconValue(e.target.value)} placeholder="🫰 🌹 🦁 👑" />
                  </Field>
                  <div className="gift-form__presets">
                    <span className="field__hint">Atalhos: preenchem nome, ID e efeito.</span>
                    <div className="gift-form__chips">
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="gift-preset"
                          title={`Aplicar ${p.name}`}
                          onClick={() => {
                            setIconValue(p.emoji);
                            setGiftName(p.name);
                            setGiftId(p.id);
                            setAction(p.action);
                            setValue(p.val);
                          }}
                        >
                          <span className="gift-preset__emoji">{p.emoji}</span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="gift-form__iconfields">
                  <label className="btn btn--secondary gift-form__upload">
                    <Upload />
                    Enviar arquivo (PNG, JPG ou WebP)
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="sr-only" />
                  </label>
                  <Field label="Ou use a URL da imagem" htmlFor="gift-url">
                    <TextInput
                      id="gift-url"
                      value={iconValue.startsWith('data:image') ? '' : iconValue}
                      onChange={(e) => setIconValue(e.target.value)}
                      placeholder="https://…"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div className="form-grid form-grid--2">
            <Field label="Efeito no jogo" required htmlFor="gift-action">
              <Select id="gift-action" value={action} onChange={(e) => setAction(e.target.value as GiftAction)}>
                <option value="add_time">Adicionar tempo</option>
                <option value="reveal_letter">Revelar letras da resposta</option>
                <option value="multiplier_2x">Multiplicar pontos</option>
                <option value="custom">Personalizado (sem efeito)</option>
              </Select>
            </Field>
            <Field label={valueRelevant ? valueLabel : 'Valor'} htmlFor="gift-value" hint={valueRelevant ? undefined : 'Sem efeito: o valor é ignorado.'}>
              <NumberInput
                id="gift-value"
                min={1}
                max={60}
                value={value}
                disabled={!valueRelevant}
                onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
              />
            </Field>
          </div>

          <Switch checked={active} onChange={setActive} label="Presente ativo na LIVE" />
        </form>
      </Dialog>
    </div>
  );
};

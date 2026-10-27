import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle, RotateCcw } from 'lucide-react';
import { GameSettings } from '../../../../shared/types.ts';
import { DEFAULT_SETTINGS } from '../../../game/scoring.ts';

export const MechanicsTab: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: GameSettings) => {
        setSettings(data);
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleChange = (key: keyof GameSettings, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e: any) {
      alert(`Falha ao salvar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Restaurar todas as mecânicas para o padrão oficial?')) {
      setSettings(DEFAULT_SETTINGS);
      setSaveSuccess(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-[#F7F2F4]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white font-display flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-[#C5163D]" />
            Mecânicas da Partida e Rodadas
          </h2>
          <p className="text-xs text-[#B7A8AE] mt-1">
            Configure as regras de tempo, número de rodadas, pontuação e loop contínuo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#21171B] border border-[#39272E] text-xs font-semibold text-[#B7A8AE] hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all shadow-lg shadow-[#C5163D]/25 cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Mecânicas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Rounds e Duração */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white font-display border-b border-[#39272E] pb-3">
            Rounds & Tempo
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                Rounds por Partida (Padrão: 10)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.roundsPerMatch}
                onChange={(e) => handleChange('roundsPerMatch', parseInt(e.target.value, 10) || 10)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                Duração de cada Round (segundos)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={settings.roundDurationSeconds}
                onChange={(e) => handleChange('roundDurationSeconds', parseInt(e.target.value, 10) || 30)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                Intervalo entre Rounds (Padrão: 5 segundos)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={settings.intermissionSeconds}
                onChange={(e) => handleChange('intermissionSeconds', parseInt(e.target.value, 10) || 5)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoLoopMatches}
                  onChange={(e) => handleChange('autoLoopMatches', e.target.checked)}
                  className="rounded text-[#C5163D] focus:ring-[#C5163D]"
                />
                <span className="font-semibold text-white">
                  Loop Contínuo de Partidas
                </span>
              </label>
              <p className="text-[11px] text-zinc-500 ml-6 mt-1">
                Inicia uma nova partida automaticamente 10 segundos após a exibição do pódio final
              </p>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preventRepeatInMatch}
                  onChange={(e) => handleChange('preventRepeatInMatch', e.target.checked)}
                  className="rounded text-[#C5163D] focus:ring-[#C5163D]"
                />
                <span className="font-semibold text-white">
                  Não Repetir Desafio na Mesma Partida
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Pontuação por Posição */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white font-display border-b border-[#39272E] pb-3">
            Pontuação por Acerto
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                1º Lugar no Round (Pontos)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={settings.points1st}
                onChange={(e) => handleChange('points1st', parseInt(e.target.value, 10) || 100)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                2º Lugar no Round (Pontos)
              </label>
              <input
                type="number"
                min={5}
                max={500}
                value={settings.points2nd}
                onChange={(e) => handleChange('points2nd', parseInt(e.target.value, 10) || 75)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                3º Lugar no Round (Pontos)
              </label>
              <input
                type="number"
                min={5}
                max={500}
                value={settings.points3rd}
                onChange={(e) => handleChange('points3rd', parseInt(e.target.value, 10) || 50)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>

            <div>
              <label className="block text-[#B7A8AE] font-semibold mb-1">
                Demais Acertos Válidos (Pontos)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={settings.pointsOthers}
                onChange={(e) => handleChange('pointsOthers', parseInt(e.target.value, 10) || 25)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#C5163D]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

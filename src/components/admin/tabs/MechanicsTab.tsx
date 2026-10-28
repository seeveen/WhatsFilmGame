import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { GameSettings } from '../../../../shared/types.ts';
import { DEFAULT_SETTINGS } from '../../../game/scoring.ts';
import {
  Button,
  Chip,
  Notice,
  NumberInput,
  PageHeader,
  Section,
  SettingList,
  SettingRow,
  Spinner,
  Switch,
  useFeedback,
} from '../../ui/index.ts';

type NumericKey = 'roundsPerMatch' | 'roundDurationSeconds' | 'intermissionSeconds' | 'points1st' | 'points2nd' | 'points3rd' | 'pointsOthers';

interface NumericField {
  key: NumericKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  /** Valor usado quando o campo fica vazio/inválido — igual ao comportamento original. */
  fallback: number;
  unit: string;
}

const TIMING_FIELDS: NumericField[] = [
  { key: 'roundsPerMatch', label: 'Rodadas por partida', hint: 'Quantos desafios compõem uma partida. Padrão: 10.', min: 1, max: 50, fallback: 10, unit: 'rod.' },
  { key: 'roundDurationSeconds', label: 'Duração de cada rodada', hint: 'Tempo para adivinhar, antes de presentes acrescentarem segundos.', min: 10, max: 120, fallback: 30, unit: 's' },
  { key: 'intermissionSeconds', label: 'Intervalo entre rodadas', hint: 'Tempo da tela de resultado antes da próxima rodada. Padrão: 5 segundos.', min: 3, max: 30, fallback: 5, unit: 's' },
];

const SCORING_FIELDS: NumericField[] = [
  { key: 'points1st', label: '1º a acertar', hint: 'Pontos para quem acerta primeiro na rodada.', min: 10, max: 1000, fallback: 100, unit: 'pts' },
  { key: 'points2nd', label: '2º a acertar', hint: 'Pontos para o segundo acerto.', min: 5, max: 500, fallback: 75, unit: 'pts' },
  { key: 'points3rd', label: '3º a acertar', hint: 'Pontos para o terceiro acerto.', min: 5, max: 500, fallback: 50, unit: 'pts' },
  { key: 'pointsOthers', label: 'Demais acertos válidos', hint: 'Pontos para os acertos seguintes, enquanto a rodada durar.', min: 0, max: 200, fallback: 25, unit: 'pts' },
];

export const MechanicsTab: React.FC = () => {
  const { toast, confirm } = useFeedback();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: GameSettings) => {
        setSettings(data);
        setSaved(data);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setLoadError(true);
      })
      .finally(() => setLoaded(true));
  }, []);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(saved), [settings, saved]);

  const handleChange = (key: keyof GameSettings, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
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
        setSaved(settings);
        setLoadError(false);
        toast('success', 'As novas regras valem a partir da próxima partida ou rodada.', 'Mecânicas salvas');
      } else {
        toast('error', 'O servidor recusou as configurações. Confira os valores e tente de novo.', 'Não foi possível salvar');
      }
    } catch (err: any) {
      toast('error', err.message, 'Falha ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: 'Restaurar o padrão oficial?',
      message: 'Todas as mecânicas voltam aos valores padrão. Nada é gravado até você clicar em “Salvar mecânicas”.',
      confirmLabel: 'Restaurar padrões',
      tone: 'primary',
    });
    if (ok) setSettings(DEFAULT_SETTINGS);
  };

  const renderNumber = (field: NumericField) => (
    <SettingRow key={field.key} label={field.label} hint={field.hint} htmlFor={`mech-${field.key}`}>
      <NumberInput
        id={`mech-${field.key}`}
        min={field.min}
        max={field.max}
        unit={field.unit}
        value={settings[field.key]}
        onChange={(e) => {
          const value = Number.parseInt(e.currentTarget.value, 10);
          handleChange(field.key, Number.isNaN(value) ? field.fallback : value);
        }}
      />
    </SettingRow>
  );

  return (
    <form className="page" onSubmit={handleSave} noValidate>
      <PageHeader
        eyebrow="Partida"
        title="Mecânicas"
        description="Regras de tempo, número de rodadas, pontuação e repetição das partidas."
        actions={
          <>
            {dirty && (
              <Chip tone="warn" dot="warn">
                Alterações não salvas
              </Chip>
            )}
            <Button type="button" icon={<RotateCcw />} onClick={handleResetDefaults}>
              Restaurar padrões
            </Button>
            <Button type="submit" variant="primary" icon={<Save />} loading={isSaving} disabled={!loaded}>
              Salvar mecânicas
            </Button>
          </>
        }
      />

      {loadError && (
        <Notice tone="warn" onDismiss={() => setLoadError(false)}>
          Não foi possível carregar as configurações atuais do servidor. Os valores abaixo são os padrões; salvar substitui o que
          estiver gravado.
        </Notice>
      )}

      {!loaded ? (
        <div className="mech-loading">
          <Spinner />
        </div>
      ) : (
        <>
          <Section title="Rodadas e tempo" description="Ritmo da partida: quantas rodadas, quanto dura cada uma e a pausa entre elas.">
            <SettingList>{TIMING_FIELDS.map(renderNumber)}</SettingList>
          </Section>

          <Section title="Pontuação por acerto" description="Quem acerta primeiro leva mais. Presentes de multiplicador dobram os pontos do próximo acerto.">
            <SettingList>{SCORING_FIELDS.map(renderNumber)}</SettingList>
            <div className="mech-ladder" aria-hidden="true">
              {SCORING_FIELDS.map((field, index) => (
                <div key={field.key} className="mech-ladder__step">
                  <span className="mech-ladder__bar" style={{ height: `${Math.max(6, (Number(settings[field.key]) / Math.max(1, Number(settings.points1st))) * 100)}%` }} />
                  <span className="num mech-ladder__pts">{settings[field.key]}</span>
                  <span className="mech-ladder__lbl">{['1º', '2º', '3º', 'Demais'][index]}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Partidas" description="O que acontece quando a partida termina e como os desafios são sorteados.">
            <SettingList>
              <SettingRow
                label="Loop contínuo de partidas"
                hint="Inicia uma nova partida automaticamente 10 segundos após o pódio final."
                htmlFor="mech-autoLoop"
              >
                <Switch
                  id="mech-autoLoop"
                  checked={settings.autoLoopMatches}
                  onChange={(next) => handleChange('autoLoopMatches', next)}
                  label={settings.autoLoopMatches ? 'Ligado' : 'Desligado'}
                />
              </SettingRow>
              <SettingRow
                label="Não repetir desafio na mesma partida"
                hint="Cada filme aparece no máximo uma vez por partida."
                htmlFor="mech-noRepeat"
              >
                <Switch
                  id="mech-noRepeat"
                  checked={settings.preventRepeatInMatch}
                  onChange={(next) => handleChange('preventRepeatInMatch', next)}
                  label={settings.preventRepeatInMatch ? 'Ligado' : 'Desligado'}
                />
              </SettingRow>
            </SettingList>
          </Section>
        </>
      )}
    </form>
  );
};

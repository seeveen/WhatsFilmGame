import React, { useCallback, useEffect, useState } from 'react';
import { Gift, RefreshCw, Trophy } from 'lucide-react';
import { Button, EmptyState, Notice, PageHeader, Section, Spinner } from '../../ui/index.ts';

interface MatchRecord {
  id: string;
  matchNumber: number;
  totalRounds: number;
  completedAt: number;
  winners?: { username: string; matchScore: number }[];
}

interface GiftRecord {
  id: string;
  username: string;
  giftName: string;
  amount: number;
  effectLabel: string;
  timestamp: number;
}

const GIFTS_PREVIEW = 12;

export const HistoryTab: React.FC = () => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [recentGifts, setRecentGifts] = useState<GiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [showAllGifts, setShowAllGifts] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setMatches(data.matches || []);
      setRecentGifts(data.recentGifts || []);
      setError('');
    } catch (e: any) {
      console.error('Failed to load history:', e);
      setError('Não foi possível carregar o histórico. Verifique se o servidor do jogo está em execução.');
    } finally {
      setIsLoading(false);
      setLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const visibleGifts = showAllGifts ? recentGifts : recentGifts.slice(0, GIFTS_PREVIEW);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Registro"
        title="Histórico"
        description="Partidas concluídas e presentes processados, salvos localmente no banco SQLite."
        actions={
          <Button icon={<RefreshCw />} loading={isLoading} onClick={fetchHistory}>
            Atualizar
          </Button>
        }
      />

      {error && (
        <Notice tone="error" onDismiss={() => setError('')}>
          {error}
        </Notice>
      )}

      {!loadedOnce && !error ? (
        <div className="hist-loading">
          <Spinner />
        </div>
      ) : (
        <>
          <Section title="Partidas anteriores" description="As partidas mais recentes primeiro, com o pódio final de cada uma.">
            {matches.length === 0 ? (
              <EmptyState
                icon={<Trophy />}
                title="Nenhuma partida finalizada ainda"
                description="Quando uma partida terminar, o pódio aparece aqui."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Partida</th>
                      <th scope="col">Rodadas</th>
                      <th scope="col">Concluída em</th>
                      <th scope="col">Pódio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td className="num hist-match">#{String(match.matchNumber).padStart(2, '0')}</td>
                        <td className="num">{match.totalRounds}</td>
                        <td className="num hist-date">{new Date(match.completedAt).toLocaleString('pt-BR')}</td>
                        <td>
                          {match.winners && match.winners.length > 0 ? (
                            <ol className="hist-podium">
                              {match.winners.slice(0, 3).map((winner, index) => (
                                <li key={`${winner.username}-${index}`}>
                                  <span className="hist-rank" data-rank={index + 1}>
                                    {index + 1}
                                  </span>
                                  <span className="hist-user">@{winner.username}</span>
                                  <span className="num hist-pts">{winner.matchScore} pts</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <span className="hist-none">Sem pontuação</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Últimos presentes processados" description="Presentes que acionaram um efeito na partida, do mais recente para o mais antigo.">
            {recentGifts.length === 0 ? (
              <EmptyState
                icon={<Gift />}
                title="Nenhum presente registrado"
                description="Presentes recebidos na LIVE (ou disparados no simulador) aparecem aqui."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Horário</th>
                      <th scope="col">Usuário</th>
                      <th scope="col">Presente</th>
                      <th scope="col">Efeito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGifts.map((gift) => (
                      <tr key={gift.id}>
                        <td className="num hist-date">{new Date(gift.timestamp).toLocaleTimeString('pt-BR')}</td>
                        <td className="hist-user">@{gift.username}</td>
                        <td>
                          {gift.giftName}
                          {gift.amount > 1 && <span className="num hist-qty"> ×{gift.amount}</span>}
                        </td>
                        <td>
                          <span className="hist-effect">{gift.effectLabel}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentGifts.length > GIFTS_PREVIEW && (
                  <div className="table-foot">
                    <span className="num">
                      {visibleGifts.length} de {recentGifts.length}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAllGifts((v) => !v)}>
                      {showAllGifts ? 'Mostrar menos' : 'Mostrar todos'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
};

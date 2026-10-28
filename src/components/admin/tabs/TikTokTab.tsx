import React, { useState } from 'react';
import { Radio, Terminal, Unplug } from 'lucide-react';
import { GameStateDTO, TikTokLogLine } from '../../../../shared/types.ts';
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  PrefixInput,
  Section,
  useFeedback,
} from '../../ui/index.ts';

interface TikTokTabProps {
  gameState: GameStateDTO;
  logs: TikTokLogLine[];
}

const SETUP_STEPS = [
  'Inicie sua transmissão ao vivo no aplicativo do TikTok ou no TikTok LIVE Studio.',
  'Digite seu @usuário no campo acima e clique em “Conectar à LIVE”.',
  'O backend se conecta via Webcast Socket e escuta comentários e presentes em tempo real.',
  'No OBS Studio, adicione uma fonte de navegador (Browser Source) apontando para a tela do jogo, em 1080×1920.',
];

export const TikTokTab: React.FC<TikTokTabProps> = ({ gameState, logs }) => {
  const { toast } = useFeedback();
  const [username, setUsername] = useState(gameState.tiktokConnection.username || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState('');
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast('warn', 'Digite o nome de usuário do TikTok.');
      return;
    }
    setIsConnecting(true);
    setConnectMsg('');
    try {
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      setConnectMsg(data.message);
    } catch (err: any) {
      setConnectMsg(`Erro: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
      setConnectMsg('Desconectado com sucesso.');
    } catch (err: any) {
      toast('error', `Erro: ${err.message}`);
    }
  };

  const connection = gameState.tiktokConnection;
  const connected = connection.status === 'connected';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Transmissão"
        title="TikTok LIVE"
        description="Conecte sua transmissão ao vivo sem chaves de API secretas."
        actions={
          connected && typeof connection.viewerCount === 'number' ? <Chip mono>{connection.viewerCount} espectadores</Chip> : undefined
        }
      />

      {connection.status === 'error' && connection.errorMsg && <Notice tone="error">{connection.errorMsg}</Notice>}
      {connectMsg && (
        <Notice tone={connectMsg.startsWith('Erro') ? 'error' : 'info'} onDismiss={() => setConnectMsg('')}>
          {connectMsg}
        </Notice>
      )}

      <Section
        title="Canal"
        description={
          <>
            Informe o @usuário do canal. Ele precisa estar <strong>ao vivo</strong> agora para a conexão Webcast ser
            estabelecida.
          </>
        }
      >
        <form className="tt-form" onSubmit={handleConnect}>
          <Field label="Usuário do TikTok" htmlFor="tt-username" className="tt-form__field">
            <PrefixInput
              id="tt-username"
              prefix="@"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
              placeholder="seu_usuario_tiktok"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <div className="tt-form__actions">
            <Button type="submit" variant="primary" icon={<Radio />} loading={isConnecting}>
              Conectar à LIVE
            </Button>
            {connected && (
              <Button type="button" variant="danger" icon={<Unplug />} onClick={handleDisconnect}>
                Desconectar
              </Button>
            )}
          </div>
        </form>
      </Section>

      <div className="tt-columns">
        <Section title="Como conectar">
          <ol className="tt-steps">
            {SETUP_STEPS.map((step, index) => (
              <li key={step}>
                <span className="tt-steps__n num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Eventos desta sessão" description="Conexões e desconexões feitas por este painel.">
          {logs.length === 0 ? (
            <EmptyState icon={<Terminal />} title="Nenhum evento ainda" description="As tentativas de conexão aparecem aqui." />
          ) : (
            <ul className="tt-log" aria-label="Eventos de conexão">
              {logs.map((log, index) => (
                <li key={`${log.timestamp}-${index}`}>
                  <time className="num" dateTime={new Date(log.timestamp).toISOString()}>
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                  </time>
                  <span>{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
};

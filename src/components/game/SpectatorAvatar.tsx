import React, { useEffect, useState } from 'react';

interface SpectatorAvatarProps {
  username?: string;
  avatarUrl?: string;
  /** Tamanho em unidades do palco (u) — acompanha a escala da janela. */
  size?: number;
  /** Compatibilidade com componentes anteriores que definem o tamanho por classe CSS. */
  sizeClassName?: string;
  className?: string;
}

/* Tons de vinho/grafite para o fallback: nenhum azul, contraste sempre alto com o texto. */
const FALLBACK_TONES = ['#5a1424', '#6b1a2d', '#7a2336', '#4b2531', '#3e2a31', '#58202c'];

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_TONES[hash % FALLBACK_TONES.length];
}

/**
 * Avatar do espectador. Usa a foto real do TikTok quando existe e carrega; caso contrário, desenha as
 * iniciais localmente (a antiga solução dependia de um serviço externo, que não funciona offline).
 */
export const SpectatorAvatar: React.FC<SpectatorAvatarProps> = ({
  username = 'espectador',
  avatarUrl,
  size = 20,
  sizeClassName = '',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [avatarUrl]);

  const clean = username.replace(/^@/, '');
  const initial = (Array.from(clean)[0] || '?').toUpperCase();
  const showImage = Boolean(avatarUrl) && !failed;

  return (
    <span
      className={`avatar ${sizeClassName} ${className}`}
      style={{ ['--s' as string]: size, background: showImage && loaded ? undefined : toneFor(clean) } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* As iniciais ficam visíveis enquanto a foto carrega (ou se ela nunca carregar). */}
      {!(showImage && loaded) && <span className="avatar__initial">{initial}</span>}
      {showImage && (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          draggable={false}
          style={loaded ? undefined : { display: 'none' }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
};

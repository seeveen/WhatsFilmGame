# Royal Red Cinema — guia de design

Identidade visual do **Qual é o Filme?**: vermelho royal, vinho escuro e preto carvão, com neutros quentes. Cinematográfica sem ser carregada — o vermelho marca ação e estado, não decora.

Fonte única dos valores: `src/styles/tokens.css`. Telas e componentes só compõem a partir dele.

## Cores

| Token | Valor | Uso |
|---|---|---|
| `--royal` | `#8F102B` | assinatura, estados pressionados, progresso concluído |
| `--brand` | `#C5163D` | ação principal, item ativo, seleção (fundos e bordas) |
| `--accent` | `#E5254D` | só urgência/evento importante; texto apenas grande (≥ 3:1) |
| `--red-text` | `#F0506F` | vermelho para **texto pequeno** (≥ 5:1 no escuro) |
| `--bg` / `--bg-2` | `#110F11` / `#151214` | fundos |
| `--surface` (+`-2`, `-3`) | `#1C171A` / `#21171B` / `#2A1D23` | superfícies e hover |
| `--well` | `#0B090A` | poço da pista de emojis, campos |
| `--line` / `--line-soft` | `#39272E` / `#2B2025` | bordas e divisores |
| `--fg` / `--fg-2` / `--fg-3` | `#F7F2F4` / `#B7A8AE` / `#94858B` | texto (`--fg-3` ajustado de `#897A81` para ≥ 5:1) |
| `--ok` / `--warn` | `#4CAF86` / `#D8A24A` | verde discreto (positivo) / âmbar suave (atenção) |

**Nunca azul-marinho** (nem outro azul) como fundo, cor principal, destaque ou identidade.

Contraste medido (WCAG): `--fg` 15,9:1 · `--fg-2` 7,8:1 · `--fg-3` 5,0:1 · `--red-text` 5,1:1 · branco sobre `--brand` 5,9:1.

## Tipografia

- **Sora** — títulos, marca, nomes (display).
- **Inter** — interface.
- **JetBrains Mono** — tempo, placar, contadores (`font-variant-numeric: tabular-nums`).

As três são variáveis, subconjunto latino, em `public/fonts/` (licença OFL, textos em `OFL-*.txt`) e declaradas em `src/styles/fonts.css`. **Sem CDN**: funciona offline no OBS / TikTok LIVE Studio.

## Regras

- Um único botão primário (vermelho cheio) por contexto; o resto é secundário/ghost.
- Bordas antes de sombras; sombra só em camadas flutuantes (diálogos, avisos).
- Sem glow/neon, sem gradientes vermelhos genéricos, sem contornos vermelhos em tudo.
- Raios contidos: `--r-1..4` (4–14 px) no painel; o palco deriva os seus da unidade `--u`.
- Emojis **só como conteúdo** (pista do desafio, ícone de presente) — nunca como ícone de interface (use `lucide-react`).
- Nenhum indicador falso: conexão, "AO VIVO", espectadores etc. refletem dados reais ou não aparecem.
- Animação só quando comunica estado; `prefers-reduced-motion` desliga o movimento (o estado continua mudando).
- Alerta de tempo (vermelho de urgência no relógio) apenas quando o tempo está realmente acabando — a duração e a lógica do timer não foram tocadas.

## Motivos "cinema" (usados com parcimônia)

`.frame` (cantos de visor na pista), `.sprockets` (perfuração de filme), `.playmark` (marcador ▶ nos rótulos), `.eyebrow`, `.leader` (contagem regressiva). Ver `src/styles/cinema.css`.

## Estrutura

```
src/styles/        tokens · fonts · base · brand · cinema · ui · game · game-results · admin/*
src/components/ui/ Button, Field, Switch, Segmented, Chip, Dialog, EmptyState, FeedbackProvider (toast/confirm)…
src/components/game/   tela de transmissão (cabeçalho, pista, lacunas, timer, placar, presentes, resultados)
src/components/admin/  shell (sidebar + barra de status) e abas: Visão geral, Mecânicas, Biblioteca, Presentes, TikTok LIVE, Histórico
src/game/{fit,slots}.ts   ajuste do palco e modelo de lacunas (testado em layout.test.ts)
```

### Palco de jogo

A tela de transmissão usa a unidade `--u` (`min(100vw/360, 100vh/640)` em retrato; `min(100vw/640, 100vh/360)` em paisagem), espelhada em JS por `stageUnit()`. Tudo escala junto; a sequência de emojis se adapta à quantidade (nunca é cortada) e a grade é recalculada via `ResizeObserver`.

## Como validar

- `npm test` — regras do jogo (`rules.test.ts`) e layout/lacunas (`layout.test.ts`).
- `npm run dev` e conferir: retrato 9:16 e paisagem 16:9 (`?layout=landscape`), painel (`?view=admin`), incluindo 270×480 e 640×360 (mínimos da janela).

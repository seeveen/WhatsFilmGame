# Qual é o Filme LIVE

Jogo de adivinhação de filmes para TikTok LIVE, com placar em tempo real, efeitos de presentes e painel de controle em uma janela separada.

## Executar em desenvolvimento

Requer Node.js 24 ou mais recente.

```powershell
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador. O servidor local conecta o painel e a tela do jogo ao mesmo estado.

## Criar o aplicativo para Windows

```powershell
npm install
npm run dist:win
```

Os executáveis são gerados na pasta `release`: um instalador e uma versão portátil. O aplicativo mantém os dados em `%APPDATA%\Qual é o Filme LIVE`.

## Atalhos

- `Tab`: abrir o painel de controle a partir da janela do jogo.
- `Esc`: voltar ao jogo a partir do painel.
- `F9`: alternar entre retrato 9:16 e paisagem 16:9.
- `F11`: alternar tela cheia; `Esc` sai da tela cheia no jogo.

## Scripts

- `npm run dev`: inicia o servidor e a interface de desenvolvimento.
- `npm test`: executa os testes das regras do jogo.
- `npm run lint`: verifica os tipos TypeScript.
- `npm run build`: compila a interface e o servidor empacotado.
- `npm run desktop:dev`: compila e abre o aplicativo local.
- `npm run dist:win`: gera o instalador e o executável portátil para Windows.

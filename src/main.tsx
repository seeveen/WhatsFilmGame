import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Verificação de inicialização: avisa no console se alguma fonte local não carregou,
// em vez de cair silenciosamente na fonte do sistema.
const FONT_CHECKS = ['700 16px "Sora"', '400 16px "Inter"', '500 16px "JetBrains Mono"'];
Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font)))
  .then((results) => {
    results.forEach((faces, index) => {
      if (faces.length === 0) {
        console.warn(`[fontes] Nenhum arquivo carregado para ${FONT_CHECKS[index]} (verifique public/fonts).`);
      }
    });
  })
  .catch(() => {});

createRoot(document.getElementById('root')!).render(<App />);

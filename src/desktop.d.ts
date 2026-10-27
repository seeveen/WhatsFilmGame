export {};

declare global {
  interface Window {
    desktopControls?: {
      openAdmin: () => void;
      returnToGame: () => void;
    };
  }
}

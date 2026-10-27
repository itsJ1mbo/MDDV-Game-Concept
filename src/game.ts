import { createGame } from './bootstrap/GameApp';

function initialize(): void {
  const container = document.getElementById('juego');
  if (container) {
    createGame('juego');
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      createGame('juego');
    });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

import { soundReaction } from './sounds';

export function spawnFloating(emoji, x, y) {
  const el = document.createElement('div');
  el.className = 'floating-reaction';
  el.textContent = emoji;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  soundReaction();
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 2000);
}

import { COLORS } from './constants';

export function genCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function avatarColor(name) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[h % COLORS.length];
}

export function speakText(text, isHost) {
  if (isHost) return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  window.speechSynthesis.speak(u);
}

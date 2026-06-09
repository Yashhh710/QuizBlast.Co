let audioCtx = null;

function getAudio() {
  if (!audioCtx) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    } catch (e) {}
  }
  return audioCtx;
}

export function playTone(freq, type = 'sine', dur = 0.15, vol = 0.3, delay = 0) {
  const ctx = getAudio();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
  o.start(ctx.currentTime + delay);
  o.stop(ctx.currentTime + delay + dur + 0.05);
}

export function soundCorrect() {
  playTone(523,'sine',.12,.25);
  playTone(659,'sine',.12,.25,.12);
  playTone(784,'sine',.2,.25,.24);
}

export function soundWrong() {
  playTone(200,'sawtooth',.15,.25);
  playTone(150,'sawtooth',.2,.25,.15);
}

export function soundTick() { playTone(440,'square',.08,.15); }
export function soundCountdown() { playTone(330,'sine',.1,.2); }

export function soundWinner() {
  [523,659,784,1047].forEach((f,i) => playTone(f,'sine',.2,.3,i*.15));
}

export function soundPop() { playTone(600,'sine',.05,.2); }
export function soundReaction() {
  playTone(800,'sine',.1,.15);
  playTone(1200,'sine',.1,.15,.1);
}
export function soundKick() {
  playTone(150,'sawtooth',.3,.3);
  playTone(100,'sawtooth',.4,.3,.3);
}
export function soundClick() { playTone(400,'sine',.05,.1); }

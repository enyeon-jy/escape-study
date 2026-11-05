// 효과음은 소리 파일 없이 Web Audio로 만든다. (사용자가 화면을 눌러야 소리가 나는 브라우저 규칙을 따른다)
type Ctx = AudioContext;

let ctx: Ctx | null = null;
let muted = false;

try {
  if (typeof window !== "undefined") muted = localStorage.getItem("escape-study-muted") === "1";
} catch {
  // 무시
}

function ac(): Ctx | null {
  if (muted || typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const C = W.AudioContext ?? W.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, endFreq?: number) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol: number, delay = 0) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, t0);
  src.connect(gain).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  tick: () => tone(1400, 0.04, "square", 0.04), // 바퀴 딸깍
  beep: () => tone(1800, 0.08, "square", 0.05), // 키패드 삑
  error: () => {
    // 덜컥
    tone(110, 0.22, "sawtooth", 0.09, 0, 70);
    noise(0.08, 0.06);
  },
  unlock: () => {
    // 철컥! 고리가 튕겨 열리는 소리
    noise(0.05, 0.1);
    tone(520, 0.1, "square", 0.06, 0.04);
    tone(780, 0.16, "triangle", 0.07, 0.12);
  },
  success: () => {
    tone(880, 0.12, "sine", 0.06);
    tone(1320, 0.2, "sine", 0.06, 0.12);
  },
  pickup: () => tone(660, 0.12, "sine", 0.06, 0, 990),
  door: () => {
    // 삐그덕 문 열리는 소리
    tone(180, 0.9, "sawtooth", 0.04, 0, 120);
    noise(0.5, 0.025, 0.1);
  },
};

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("escape-study-muted", m ? "1" : "0");
  } catch {
    // 무시
  }
}

// 효과음과 배경 소리는 소리 파일 없이 Web Audio로 만든다. (사용자가 화면을 눌러야 소리가 나는 브라우저 규칙을 따른다)
// 테마마다 소리의 성격이 다르다: 공포=낮고 둔탁한 철 소리, 추리=나무·금속 딸깍, 이세계=맑은 종소리.
import type { ThemeId } from "./types";

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let muted = false;
let theme: ThemeId = "horror";

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

interface Filt {
  type: BiquadFilterType;
  freq: number;
}

function noiseBuffer(c: Ctx, dur: number, fade: boolean) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (fade ? 1 - i / len : 1);
  return buf;
}

function noise(dur: number, vol: number, delay = 0, filt?: Filt) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = noiseBuffer(c, dur, true);
  gain.gain.setValueAtTime(vol, t0);
  if (filt) {
    const f = c.createBiquadFilter();
    f.type = filt.type;
    f.frequency.value = filt.freq;
    src.connect(f).connect(gain).connect(c.destination);
  } else {
    src.connect(gain).connect(c.destination);
  }
  src.start(t0);
}

const pick = <T,>(m: Record<ThemeId, T>): T => m[theme];

export const sfx = {
  // 바퀴 딸깍
  tick: () =>
    pick({
      horror: () => (tone(820, 0.05, "square", 0.04), noise(0.02, 0.03, 0, { type: "lowpass", freq: 900 })),
      detective: () => (noise(0.03, 0.07, 0, { type: "bandpass", freq: 2200 }), tone(640, 0.05, "triangle", 0.04)),
      isekai: () => (tone(1760, 0.18, "sine", 0.035), tone(2637, 0.12, "sine", 0.015, 0.02)),
    })(),
  // 키패드 삑
  beep: () =>
    pick({
      horror: () => tone(1500, 0.1, "square", 0.04),
      detective: () => tone(1100, 0.08, "sine", 0.06),
      isekai: () => (tone(1320, 0.22, "sine", 0.05), tone(1980, 0.18, "sine", 0.02, 0.03)),
    })(),
  // 틀렸을 때
  error: () =>
    pick({
      horror: () => (tone(110, 0.25, "sawtooth", 0.09, 0, 62), noise(0.1, 0.06, 0, { type: "lowpass", freq: 700 })),
      detective: () => (tone(150, 0.16, "triangle", 0.12, 0, 90), noise(0.05, 0.08, 0, { type: "lowpass", freq: 600 })),
      isekai: () => (tone(300, 0.5, "sine", 0.07, 0, 190), tone(311, 0.5, "sine", 0.05, 0, 180)),
    })(),
  // 열렸을 때
  unlock: () =>
    pick({
      horror: () => (noise(0.07, 0.12, 0, { type: "lowpass", freq: 1200 }), tone(90, 0.3, "square", 0.07, 0.03, 60), tone(520, 0.08, "square", 0.04, 0.12)),
      detective: () => (
        noise(0.03, 0.1, 0, { type: "bandpass", freq: 1800 }),
        noise(0.03, 0.1, 0.12, { type: "bandpass", freq: 1500 }),
        tone(110, 0.25, "triangle", 0.1, 0.18, 70),
        tone(880, 0.14, "sine", 0.04, 0.3)
      ),
      isekai: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.7, "sine", 0.05, i * 0.1)),
    })(),
  success: () => {
    tone(880, 0.12, "sine", 0.06);
    tone(1320, 0.2, "sine", 0.06, 0.12);
  },
  // 물건·열쇠를 주웠을 때
  pickup: () =>
    pick({
      horror: () => tone(520, 0.14, "sine", 0.05, 0, 700),
      detective: () => noise(0.18, 0.06, 0, { type: "highpass", freq: 2500 }),
      isekai: () => (tone(880, 0.5, "triangle", 0.05), tone(1318, 0.45, "triangle", 0.035, 0.07)),
    })(),
  // 문이 열릴 때
  door: () =>
    pick({
      horror: () => {
        // 삐그덕
        tone(180, 0.9, "sawtooth", 0.04, 0, 120);
        tone(240, 0.8, "sawtooth", 0.02, 0.1, 150);
        noise(0.5, 0.025, 0.1);
      },
      detective: () => {
        // 나무 문 + 문에 달린 종
        tone(130, 0.6, "triangle", 0.05, 0, 95);
        noise(0.3, 0.03, 0.05, { type: "lowpass", freq: 500 });
        tone(2093, 0.9, "sine", 0.03, 0.35);
        tone(2637, 0.8, "sine", 0.02, 0.4);
      },
      isekai: () => {
        // 포털이 열리는 울림
        noise(1.2, 0.04, 0, { type: "bandpass", freq: 900 });
        [262, 392, 523, 784].forEach((f, i) => tone(f, 1.6, "sine", 0.04, i * 0.15));
      },
    })(),
};

// ── 배경 소리 (방에 있는 동안 아주 작게 계속 흐른다) ─────────────────────
let ambNodes: { stop: () => void }[] = [];
let ambMaster: GainNode | null = null;
let ambWanted = false;

function stopAmbienceNodes() {
  const c = ctx;
  const m = ambMaster;
  const nodes = ambNodes;
  ambNodes = [];
  ambMaster = null;
  if (!c || !m) return;
  try {
    m.gain.cancelScheduledValues(c.currentTime);
    m.gain.setValueAtTime(m.gain.value, c.currentTime);
    m.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
  } catch {
    // 무시
  }
  setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* 이미 멈춤 */ } }), 700);
}

function osc(c: Ctx, type: OscillatorType, freq: number, vol: number, out: AudioNode) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(out);
  o.start();
  ambNodes.push(o);
  return { o, g };
}

// 느리게 흔들리는 소리 크기(LFO)
function wobble(c: Ctx, target: AudioParam, rate: number, depth: number) {
  const l = c.createOscillator();
  const g = c.createGain();
  l.frequency.value = rate;
  g.gain.value = depth;
  l.connect(g).connect(target);
  l.start();
  ambNodes.push(l);
}

function startAmbienceNodes() {
  const c = ac();
  if (!c || ambMaster) return;
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  ambMaster = master;
  ambNodes = [];

  if (theme === "horror") {
    // 낮은 웅웅 소리: 형광등 안정기 같은 낮은 울림
    const a = osc(c, "sine", 55, 0.5, master);
    osc(c, "sine", 110.4, 0.22, master);
    osc(c, "sawtooth", 60, 0.04, master);
    wobble(c, a.g.gain, 0.12, 0.15);
    master.gain.linearRampToValueAtTime(0.1, c.currentTime + 2);
  } else if (theme === "detective") {
    // 조용한 빗소리: 걸러낸 잡음 두 겹
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 4, false);
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    const g = c.createGain();
    g.gain.value = 0.6;
    src.connect(hp).connect(lp).connect(g).connect(master);
    src.start();
    ambNodes.push(src);
    wobble(c, g.gain, 0.07, 0.15);
    // 아주 멀리서 울리는 낮은 소리
    osc(c, "sine", 48, 0.15, master);
    master.gain.linearRampToValueAtTime(0.07, c.currentTime + 2);
  } else {
    // 이세계: 은은한 화음이 천천히 숨 쉬듯 커졌다 작아진다
    [220, 329.6, 440, 554.4].forEach((f, i) => {
      const n = osc(c, "sine", f, 0.28 - i * 0.04, master);
      wobble(c, n.g.gain, 0.05 + i * 0.017, 0.12);
    });
    osc(c, "sine", 110, 0.3, master);
    master.gain.linearRampToValueAtTime(0.06, c.currentTime + 3);
  }
}

export const ambience = {
  start(t: ThemeId) {
    theme = t;
    ambWanted = true;
    stopAmbienceNodes();
    startAmbienceNodes();
  },
  stop() {
    ambWanted = false;
    stopAmbienceNodes();
  },
};

export function setSoundTheme(t: ThemeId) {
  theme = t;
}

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
  if (m) stopAmbienceNodes();
  else if (ambWanted) startAmbienceNodes();
}

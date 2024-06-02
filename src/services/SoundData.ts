
const soundMap: { [key: string]: AudioBuffer } = {};

let audioContext: AudioContext;
let bgmGain: GainNode;
let effectGain: GainNode;

let bgmVolumeLevel = 0;
let effectVolumeLevel = 0;

function checkContext(): void {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkigAudioContext)();
        bgmGain = audioContext.createGain();
        effectGain = audioContext.createGain();
        bgmGain.gain.value = bgmVolumeLevel;
        effectGain.gain.value = effectVolumeLevel;
        bgmGain.connect(audioContext.destination);
        effectGain.connect(audioContext.destination);
    }
}

export function setBgmVolumeLevel(level: number): void {
    checkContext();
    bgmVolumeLevel = level;
    bgmGain.gain.value = level;
}
export function setEffectVolumeLevel(level: number): void {
    checkContext();
    effectVolumeLevel = level;
    effectGain.gain.value = level;
}

async function getSoundBuffer(name: string): Promise<AudioBuffer> {
    if (name in soundMap) {
        return soundMap[name];
    }
    const res = await fetch(`sound/${name}`);
    const buf = await res.arrayBuffer();
    soundMap[name] = await audioContext.decodeAudioData(buf);
    return soundMap[name];
}

let bgmSource: AudioBufferSourceNode;

export async function playBgm(name: string, start = 0, loopEnd = -1): Promise<void> {
    if (!bgmGain) {
        return;
    }
    const buf = await getSoundBuffer(`${name}.mp3`);
    if (bgmSource) {
        bgmSource.stop();
        bgmSource.disconnect();
    }
    bgmSource = audioContext.createBufferSource();
    bgmSource.buffer = buf;
    if (loopEnd > 0) {
        bgmSource.loopStart = start;
        bgmSource.loopEnd = Math.min(loopEnd, buf.duration);
        bgmSource.loop = true;
    }
    bgmSource.connect(bgmGain);
    bgmSource.start(0, start);
}

export async function playEffect(name: string): Promise<void> {
    if (!effectGain) {
        return;
    }
    const src = audioContext.createBufferSource();
    src.buffer = await getSoundBuffer(`${name}.wav`);
    src.connect(effectGain);
    src.start();
}

let chimeSource: AudioBufferSourceNode | undefined;

/**
 * チャイムを鳴らすモード
 * @param mode 0: 初期化, 1:鳴らす, 2:止める
 */
export async function setChime(mode: number): Promise<void> {
    if (!effectGain) {
        return;
    }
    if (mode === 1) {
        if (!chimeSource) {
            let source = audioContext.createBufferSource();
            source.buffer = await getSoundBuffer('Chime.wav');
            source.connect(effectGain);
            source.start(0);
            chimeSource = source;
        }
    } else if (mode === 2 || mode == 0) {
        if (chimeSource) {
            chimeSource.stop();
            chimeSource.disconnect();
        }
        chimeSource = undefined;
    }
}

let lastTime = 0.0;

/**
 * ダメージを
 */
export async function playDamage(): Promise<void> {
    if (!effectGain) {
        return;
    }
    if (lastTime + 0.1 > audioContext.currentTime) {
        return;
    }
    lastTime = audioContext.currentTime;
    await playEffect('Damage');
}
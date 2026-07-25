"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 创造频率类（第二批）
 *
 * 对应属性：D41 创造频率自适应 / 协议 4.5 创造频率自适应
 * 对应文档：附录A·T1·FREQUENCY（ALG_T1_F_001 ~ ALG_T1_F_015）
 *
 * 算法清单（15 个）：
 *   001 完整性计算    002 频率态判定      003 频率自适应
 *   004 低频深潜      005 高频激活        006 频率衰减
 *   007 频率振荡      008 频率共振        009 频率谱分析
 *   010 频率相位      011 频率振幅        012 频率调制
 *   013 频率同步      014 频率谐波        015 频率带宽
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeIntegrity = computeIntegrity;
exports.frequencyState = frequencyState;
exports.frequencyAdapt = frequencyAdapt;
exports.lowFrequencyDive = lowFrequencyDive;
exports.highFrequencyActivate = highFrequencyActivate;
exports.frequencyDecay = frequencyDecay;
exports.frequencyOscillation = frequencyOscillation;
exports.frequencyResonance = frequencyResonance;
exports.frequencySpectrum = frequencySpectrum;
exports.frequencyPhase = frequencyPhase;
exports.frequencyAmplitude = frequencyAmplitude;
exports.frequencyModulation = frequencyModulation;
exports.frequencySynchronization = frequencySynchronization;
exports.frequencyHarmonics = frequencyHarmonics;
exports.frequencyBandwidth = frequencyBandwidth;
// ============================================================================
// T1·ALG_T1_F_001 · 完整性计算
// ============================================================================
function computeIntegrity(dimensions) {
    if (dimensions.length === 0) {
        return { integrity: 0, gaps: [], provenance: ['[ALG_T1_F_001] 空维度'] };
    }
    let totalWeight = 0;
    let weightedCloseness = 0;
    const gaps = [];
    for (const d of dimensions) {
        const gap = Math.abs(d.target - d.value);
        const closeness = d.target === 0 ? (d.value === 0 ? 1 : 0) : 1 - Math.min(1, gap / Math.abs(d.target));
        weightedCloseness += closeness * d.weight;
        totalWeight += d.weight;
        gaps.push({ name: d.name, gap });
    }
    const integrity = totalWeight === 0 ? 0 : weightedCloseness / totalWeight;
    return {
        integrity,
        gaps,
        provenance: [`[ALG_T1_F_001] integrity=${integrity.toFixed(4)} dim=${dimensions.length} maxGap=${Math.max(...gaps.map(g => g.gap)).toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_002 · 频率态判定
// ============================================================================
function frequencyState(integrity, threshold = 0.98) {
    let state;
    let reason;
    if (integrity >= threshold) {
        state = 'dormant';
        reason = `integrity=${integrity.toFixed(4)} >= ${threshold} low-freq dive`;
    }
    else if (integrity >= threshold * 0.5) {
        state = 'standby';
        reason = `integrity=${integrity.toFixed(4)} middle standby`;
    }
    else {
        state = 'active';
        reason = `integrity=${integrity.toFixed(4)} < ${threshold * 0.5} high-freq active`;
    }
    return { state, reason, provenance: [`[ALG_T1_F_002] state=${state} integrity=${integrity.toFixed(4)}`] };
}
// ============================================================================
// T1·ALG_T1_F_003 · 频率自适应
// ============================================================================
function frequencyAdapt(history, targetIntegrity = 0.98, adjustmentRate = 0.1) {
    if (history.length === 0) {
        return { newFrequency: 0, state: 'standby', provenance: ['[ALG_T1_F_003] 空历史'] };
    }
    const recent = history.slice(-Math.min(10, history.length));
    const avgIntegrity = recent.reduce((s, h) => s + h.integrity, 0) / recent.length;
    const currentFreq = recent[recent.length - 1].frequency;
    const state = frequencyState(avgIntegrity, targetIntegrity).state;
    let newFrequency = currentFreq;
    if (state === 'dormant') {
        newFrequency = currentFreq * (1 - adjustmentRate);
    }
    else if (state === 'active') {
        newFrequency = currentFreq * (1 + adjustmentRate);
    }
    newFrequency = Math.max(0, Math.min(newFrequency, 1000));
    return {
        newFrequency,
        state,
        provenance: [`[ALG_T1_F_003] freq=${currentFreq.toFixed(4)} to ${newFrequency.toFixed(4)} state=${state}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_004 · 低频深潜
// ============================================================================
function lowFrequencyDive(currentFrequency, depth = 1) {
    if (depth <= 0) {
        return { frequency: currentFrequency, depth: 0, provenance: ['[ALG_T1_F_004] depth<=0'] };
    }
    const frequency = currentFrequency / Math.pow(2, depth);
    return {
        frequency,
        depth,
        provenance: [`[ALG_T1_F_004] freq=${currentFrequency.toFixed(4)} to ${frequency.toFixed(4)} depth=${depth}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_005 · 高频激活
// ============================================================================
function highFrequencyActivate(currentFrequency, boostFactor = 2) {
    if (boostFactor <= 0) {
        return { frequency: currentFrequency, boost: 0, provenance: ['[ALG_T1_F_005] boost<=0'] };
    }
    const frequency = currentFrequency * boostFactor;
    return {
        frequency,
        boost: boostFactor,
        provenance: [`[ALG_T1_F_005] freq=${currentFrequency.toFixed(4)} to ${frequency.toFixed(4)} boost=${boostFactor}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_006 · 频率衰减
// ============================================================================
function frequencyDecay(initialFrequency, elapsed, halfLife = 1000) {
    if (halfLife <= 0) {
        return { frequency: initialFrequency, decayFactor: 1, provenance: ['[ALG_T1_F_006] halfLife<=0'] };
    }
    const decayFactor = Math.pow(0.5, elapsed / halfLife);
    const frequency = initialFrequency * decayFactor;
    return {
        frequency,
        decayFactor,
        provenance: [`[ALG_T1_F_006] freq=${initialFrequency.toFixed(4)} to ${frequency.toFixed(4)} decay=${decayFactor.toFixed(4)} t=${elapsed}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_007 · 频率振荡
// ============================================================================
function frequencyOscillation(baseFrequency, amplitude, time, period = 1000) {
    if (period <= 0) {
        return { frequency: baseFrequency, phase: 0, provenance: ['[ALG_T1_F_007] period<=0'] };
    }
    const phase = (2 * Math.PI * time) / period;
    const frequency = baseFrequency + amplitude * Math.sin(phase);
    return {
        frequency,
        phase,
        provenance: [`[ALG_T1_F_007] freq=${frequency.toFixed(4)} base=${baseFrequency} phase=${phase.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_008 · 频率共振
// ============================================================================
function frequencyResonance(frequencyA, frequencyB, tolerance = 0.05) {
    if (frequencyA <= 0 || frequencyB <= 0) {
        return { resonant: false, ratio: 0, harmonic: 0, provenance: ['[ALG_T1_F_008] 频率非正'] };
    }
    const ratio = frequencyA / frequencyB;
    const nearestInteger = Math.round(ratio);
    const harmonic = Math.abs(ratio - nearestInteger) < tolerance ? nearestInteger : 0;
    const resonant = harmonic !== 0;
    return {
        resonant,
        ratio,
        harmonic,
        provenance: [`[ALG_T1_F_008] resonant=${resonant} ratio=${ratio.toFixed(4)} harmonic=${harmonic}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_009 · 频率谱分析（离散傅里叶变换）
// ============================================================================
function frequencySpectrum(signal) {
    const n = signal.length;
    if (n === 0) {
        return { magnitudes: [], phases: [], dominantFreq: 0, provenance: ['[ALG_T1_F_009] 空信号'] };
    }
    const magnitudes = new Array(n);
    const phases = new Array(n);
    for (let k = 0; k < n; k++) {
        let real = 0, imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = -2 * Math.PI * k * t / n;
            real += signal[t] * Math.cos(angle);
            imag += signal[t] * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(real * real + imag * imag) / n;
        phases[k] = Math.atan2(imag, real);
    }
    let maxMag = 0;
    let dominantFreq = 0;
    for (let k = 1; k < n; k++) {
        if (magnitudes[k] > maxMag) {
            maxMag = magnitudes[k];
            dominantFreq = k;
        }
    }
    return {
        magnitudes,
        phases,
        dominantFreq,
        provenance: [`[ALG_T1_F_009] n=${n} dominantFreq=${dominantFreq} maxMag=${maxMag.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_010 · 频率相位
// ============================================================================
function frequencyPhase(frequency, time, initialPhase = 0) {
    const phase = initialPhase + 2 * Math.PI * frequency * time;
    const normalizedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return {
        phase,
        normalizedPhase,
        provenance: [`[ALG_T1_F_010] phase=${phase.toFixed(4)} norm=${normalizedPhase.toFixed(4)} freq=${frequency}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_011 · 频率振幅
// ============================================================================
function frequencyAmplitude(signal) {
    if (signal.length === 0) {
        return { amplitude: 0, peak: 0, rms: 0, provenance: ['[ALG_T1_F_011] 空信号'] };
    }
    const peak = Math.max(...signal.map(Math.abs));
    const mean = signal.reduce((s, x) => s + x, 0) / signal.length;
    const rms = Math.sqrt(signal.reduce((s, x) => s + (x - mean) ** 2, 0) / signal.length);
    const amplitude = (Math.max(...signal) - Math.min(...signal)) / 2;
    return {
        amplitude,
        peak,
        rms,
        provenance: [`[ALG_T1_F_011] amp=${amplitude.toFixed(4)} peak=${peak.toFixed(4)} rms=${rms.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_012 · 频率调制
// ============================================================================
function frequencyModulation(carrierFreq, modulatingFreq, modulationIndex, time) {
    const modulatedFreq = carrierFreq + modulationIndex * modulatingFreq * Math.cos(2 * Math.PI * modulatingFreq * time);
    return {
        modulatedFreq,
        provenance: [`[ALG_T1_F_012] fc=${carrierFreq} fm=${modulatingFreq} beta=${modulationIndex} t=${time} to ${modulatedFreq.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_013 · 频率同步
// ============================================================================
function frequencySynchronization(localFreq, referenceFreq, couplingStrength = 0.1) {
    if (couplingStrength < 0 || couplingStrength > 1) {
        return { synchronizedFreq: localFreq, lockRange: 0, provenance: ['[ALG_T1_F_013] coupling 越界'] };
    }
    const synchronizedFreq = localFreq + couplingStrength * (referenceFreq - localFreq);
    const lockRange = couplingStrength * referenceFreq;
    return {
        synchronizedFreq,
        lockRange,
        provenance: [`[ALG_T1_F_013] local=${localFreq} ref=${referenceFreq} sync=${synchronizedFreq.toFixed(4)} lock=${lockRange.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_014 · 频率谐波
// ============================================================================
function frequencyHarmonics(fundamentalFreq, maxHarmonics = 5) {
    if (fundamentalFreq <= 0 || maxHarmonics <= 0) {
        return { harmonics: [], totalEnergy: 0, provenance: ['[ALG_T1_F_014] 参数无效'] };
    }
    const harmonics = [];
    let totalEnergy = 0;
    for (let n = 1; n <= maxHarmonics; n++) {
        const freq = fundamentalFreq * n;
        harmonics.push(freq);
        totalEnergy += 1 / n;
    }
    return {
        harmonics,
        totalEnergy,
        provenance: [`[ALG_T1_F_014] fundamental=${fundamentalFreq} count=${harmonics.length} energy=${totalEnergy.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_F_015 · 频率带宽
// ============================================================================
function frequencyBandwidth(frequencies) {
    if (frequencies.length === 0) {
        return { bandwidth: 0, minFreq: 0, maxFreq: 0, centerFreq: 0, provenance: ['[ALG_T1_F_015] 空频率'] };
    }
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);
    const bandwidth = maxFreq - minFreq;
    const centerFreq = (minFreq + maxFreq) / 2;
    return {
        bandwidth,
        minFreq,
        maxFreq,
        centerFreq,
        provenance: [`[ALG_T1_F_015] bw=${bandwidth.toFixed(4)} min=${minFreq.toFixed(4)} max=${maxFreq.toFixed(4)} center=${centerFreq.toFixed(4)}`],
    };
}

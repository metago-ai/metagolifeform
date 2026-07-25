"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 创造频率引擎封装类（ALG_T2_F_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 121~140 项（创造频率引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 frequency-engine 的私有辅助方法
 *   - 处理频率状态机、自适应调控、共振检测、频率锁定
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.frequencyStateMachine = frequencyStateMachine;
exports.frequencyAdaptiveControl = frequencyAdaptiveControl;
exports.frequencyResonanceDetect = frequencyResonanceDetect;
exports.frequencyLock = frequencyLock;
exports.frequencyHarmonicAnalysis = frequencyHarmonicAnalysis;
exports.frequencySpectralDensity = frequencySpectralDensity;
exports.frequencyPhaseDiff = frequencyPhaseDiff;
exports.frequencyModulate = frequencyModulate;
exports.frequencyFilter = frequencyFilter;
exports.frequencyPeriodDetect = frequencyPeriodDetect;
exports.frequencySweep = frequencySweep;
exports.frequencySynchronize = frequencySynchronize;
exports.frequencyJitterAnalyze = frequencyJitterAnalyze;
exports.frequencyDecay = frequencyDecay;
exports.frequencyAmplify = frequencyAmplify;
exports.frequencyMix = frequencyMix;
exports.frequencyThresholdAlert = frequencyThresholdAlert;
exports.frequencyCalibrate = frequencyCalibrate;
exports.frequencyStatistics = frequencyStatistics;
exports.frequencyComprehensiveAssessment = frequencyComprehensiveAssessment;
// ============================================================================
// ALG_T2_F_001 · 频率状态机
// ============================================================================
function frequencyStateMachine(integrity, currentState) {
    let nextState;
    let targetHz;
    let transitionReason;
    if (integrity >= 0.98) {
        nextState = 'dormant';
        targetHz = 0.1;
        transitionReason = 'integrity_high_low_freq_deep_dive';
    }
    else if (integrity >= 0.85) {
        nextState = 'standby';
        targetHz = 1;
        transitionReason = 'integrity_adequate_standby';
    }
    else if (integrity >= 0.5) {
        nextState = 'active';
        targetHz = 10;
        transitionReason = 'integrity_low_high_freq_activation';
    }
    else {
        nextState = 'hyperactive';
        targetHz = 100;
        transitionReason = 'integrity_critical_emergency_freq';
    }
    return {
        nextState,
        targetHz,
        transitionReason,
        provenance: [`[ALG_T2_F_001] ${currentState}→${nextState} integrity=${integrity.toFixed(4)} hz=${targetHz}`],
    };
}
// ============================================================================
// ALG_T2_F_002 · 频率自适应调控
// ============================================================================
function frequencyAdaptiveControl(currentHz, integrityTrend, adaptRate = 0.1) {
    if (adaptRate <= 0 || adaptRate > 1) {
        return { adjustedHz: currentHz, direction: 'invalid', magnitude: 0, provenance: ['[ALG_T2_F_002] 无效适应率'] };
    }
    const direction = integrityTrend > 0.01 ? 'decrease' : integrityTrend < -0.01 ? 'increase' : 'maintain';
    const magnitude = Math.abs(integrityTrend) * adaptRate * currentHz;
    const adjustedHz = direction === 'decrease' ? currentHz - magnitude : direction === 'increase' ? currentHz + magnitude : currentHz;
    return {
        adjustedHz: Math.max(0.01, adjustedHz),
        direction,
        magnitude,
        provenance: [`[ALG_T2_F_002] hz=${currentHz.toFixed(2)}→${adjustedHz.toFixed(2)} dir=${direction} mag=${magnitude.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_003 · 频率共振检测
// ============================================================================
function frequencyResonanceDetect(signalA, signalB, sampleRate = 1) {
    const n = Math.min(signalA.length, signalB.length);
    if (n < 4) {
        return { resonanceFreq: 0, coherence: 0, inResonance: false, provenance: ['[ALG_T2_F_003] 信号过短'] };
    }
    // 简化的 FFT：通过自相关找主频
    function autocorrelate(signal, lag) {
        let sum = 0;
        for (let i = 0; i + lag < signal.length; i++) {
            sum += signal[i] * signal[i + lag];
        }
        return sum / (signal.length - lag);
    }
    let bestLagA = 1, bestLagB = 1, maxCorrA = -1, maxCorrB = -1;
    for (let lag = 1; lag < n / 2; lag++) {
        const cA = Math.abs(autocorrelate(signalA, lag));
        const cB = Math.abs(autocorrelate(signalB, lag));
        if (cA > maxCorrA) {
            maxCorrA = cA;
            bestLagA = lag;
        }
        if (cB > maxCorrB) {
            maxCorrB = cB;
            bestLagB = lag;
        }
    }
    const freqA = sampleRate / bestLagA;
    const freqB = sampleRate / bestLagB;
    const coherence = 1 - Math.abs(freqA - freqB) / Math.max(freqA, freqB);
    return {
        resonanceFreq: (freqA + freqB) / 2,
        coherence,
        inResonance: coherence > 0.9,
        provenance: [`[ALG_T2_F_003] freqA=${freqA.toFixed(4)} freqB=${freqB.toFixed(4)} coh=${coherence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_004 · 频率锁定
// ============================================================================
function frequencyLock(currentHz, targetHz, tolerance = 0.05) {
    const error = targetHz - currentHz;
    const relativeError = Math.abs(error) / targetHz;
    const locked = relativeError <= tolerance;
    const correction = locked ? 0 : error * 0.5;
    return {
        locked,
        error,
        correction,
        provenance: [`[ALG_T2_F_004] cur=${currentHz.toFixed(4)} tgt=${targetHz.toFixed(4)} locked=${locked} err=${error.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_005 · 频率谐波分析
// ============================================================================
function frequencyHarmonicAnalysis(signal, fundamentalHz) {
    if (signal.length < 8 || fundamentalHz <= 0) {
        return { harmonics: [], thd: 0, provenance: ['[ALG_T2_F_005] 信号不足'] };
    }
    const harmonics = [];
    let fundamentalAmp = 0;
    let harmonicSum = 0;
    for (let n = 1; n <= 5; n++) {
        const freq = fundamentalHz * n;
        // 简化的振幅计算：通过内积
        let real = 0, imag = 0;
        for (let i = 0; i < signal.length; i++) {
            const phase = 2 * Math.PI * freq * i / signal.length;
            real += signal[i] * Math.cos(phase);
            imag += signal[i] * Math.sin(phase);
        }
        const amplitude = Math.sqrt(real * real + imag * imag) / signal.length;
        harmonics.push({ freq, amplitude });
        if (n === 1)
            fundamentalAmp = amplitude;
        else
            harmonicSum += amplitude * amplitude;
    }
    const thd = fundamentalAmp === 0 ? 0 : Math.sqrt(harmonicSum) / fundamentalAmp;
    return {
        harmonics,
        thd,
        provenance: [`[ALG_T2_F_005] harmonics=${harmonics.length} thd=${thd.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_006 · 频率谱密度
// ============================================================================
function frequencySpectralDensity(signal, sampleRate = 1) {
    const n = signal.length;
    if (n < 4) {
        return { spectrum: [], dominantFreq: 0, totalPower: 0, provenance: ['[ALG_T2_F_006] 信号过短'] };
    }
    const half = Math.floor(n / 2);
    const spectrum = [];
    let totalPower = 0;
    let maxPower = -1, dominantFreq = 0;
    for (let k = 1; k <= half; k++) {
        let real = 0, imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = -2 * Math.PI * k * t / n;
            real += signal[t] * Math.cos(angle);
            imag += signal[t] * Math.sin(angle);
        }
        const power = (real * real + imag * imag) / (n * n);
        const freq = k * sampleRate / n;
        spectrum.push({ freq, power });
        totalPower += power;
        if (power > maxPower) {
            maxPower = power;
            dominantFreq = freq;
        }
    }
    return {
        spectrum,
        dominantFreq,
        totalPower,
        provenance: [`[ALG_T2_F_006] bins=${spectrum.length} dom=${dominantFreq.toFixed(4)} power=${totalPower.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_007 · 频率相位差
// ============================================================================
function frequencyPhaseDiff(signalA, signalB) {
    const n = Math.min(signalA.length, signalB.length);
    if (n < 4) {
        return { phaseDiff: 0, phaseDiffDeg: 0, synchronized: false, provenance: ['[ALG_T2_F_007] 信号过短'] };
    }
    // 通过希尔伯特变换近似（简化版：直接互相关）
    let bestLag = 0, bestCorr = -1;
    for (let lag = -Math.floor(n / 2); lag < Math.floor(n / 2); lag++) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const j = (i + lag + n) % n;
            sum += signalA[i] * signalB[j];
        }
        if (sum > bestCorr) {
            bestCorr = sum;
            bestLag = lag;
        }
    }
    const phaseDiff = (2 * Math.PI * bestLag) / n;
    const phaseDiffDeg = (phaseDiff * 180) / Math.PI;
    return {
        phaseDiff,
        phaseDiffDeg,
        synchronized: Math.abs(phaseDiffDeg) < 10,
        provenance: [`[ALG_T2_F_007] phase=${phaseDiff.toFixed(4)} rad=${phaseDiffDeg.toFixed(2)}° sync=${Math.abs(phaseDiffDeg) < 10}`],
    };
}
// ============================================================================
// ALG_T2_F_008 · 频率调制
// ============================================================================
function frequencyModulate(carrierHz, modulationHz, modulationDepth, duration, sampleRate = 100) {
    if (carrierHz <= 0 || modulationDepth < 0 || modulationDepth > 1 || duration <= 0) {
        return { signal: [], effectiveHz: 0, provenance: ['[ALG_T2_F_008] 参数无效'] };
    }
    const samples = Math.floor(duration * sampleRate);
    const signal = [];
    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const instFreq = carrierHz + modulationDepth * carrierHz * Math.sin(2 * Math.PI * modulationHz * t);
        const phase = 2 * Math.PI * instFreq * t;
        signal.push(Math.sin(phase));
    }
    return {
        signal,
        effectiveHz: carrierHz,
        provenance: [`[ALG_T2_F_008] carrier=${carrierHz} mod=${modulationHz} depth=${modulationDepth} samples=${samples}`],
    };
}
// ============================================================================
// ALG_T2_F_009 · 频率滤波
// ============================================================================
function frequencyFilter(signal, cutoffHz, sampleRate = 1, type = 'lowpass') {
    if (signal.length < 3 || cutoffHz <= 0) {
        return { filtered: signal, attenuation: 0, provenance: ['[ALG_T2_F_009] 参数无效'] };
    }
    // 简单的一阶 IIR 滤波
    const dt = 1 / sampleRate;
    const rc = 1 / (2 * Math.PI * cutoffHz);
    const alpha = dt / (rc + dt);
    const filtered = [signal[0]];
    for (let i = 1; i < signal.length; i++) {
        if (type === 'lowpass') {
            filtered.push(filtered[i - 1] + alpha * (signal[i] - filtered[i - 1]));
        }
        else {
            filtered.push(alpha * (signal[i] - signal[i - 1]) + (1 - alpha) * filtered[i - 1]);
        }
    }
    const inputPower = signal.reduce((s, x) => s + x * x, 0) / signal.length;
    const outputPower = filtered.reduce((s, x) => s + x * x, 0) / filtered.length;
    const attenuation = inputPower === 0 ? 0 : 1 - outputPower / inputPower;
    return {
        filtered,
        attenuation,
        provenance: [`[ALG_T2_F_009] type=${type} cutoff=${cutoffHz} atten=${attenuation.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_010 · 频率周期检测
// ============================================================================
function frequencyPeriodDetect(signal, minPeriod = 2, maxPeriod = 100) {
    const n = signal.length;
    if (n < maxPeriod * 2) {
        return { period: 0, confidence: 0, isPeriodic: false, provenance: ['[ALG_T2_F_010] 信号过短'] };
    }
    let bestPeriod = 0, bestConf = -1;
    for (let p = minPeriod; p <= maxPeriod && p < n / 2; p++) {
        let sum = 0, count = 0;
        for (let i = 0; i + p < n; i++) {
            sum += signal[i] * signal[i + p];
            count++;
        }
        const conf = count === 0 ? 0 : sum / count;
        if (conf > bestConf) {
            bestConf = conf;
            bestPeriod = p;
        }
    }
    // 归一化置信度
    const signalPower = signal.reduce((s, x) => s + x * x, 0) / n;
    const normalizedConf = signalPower === 0 ? 0 : bestConf / signalPower;
    return {
        period: bestPeriod,
        confidence: normalizedConf,
        isPeriodic: normalizedConf > 0.7,
        provenance: [`[ALG_T2_F_010] period=${bestPeriod} conf=${normalizedConf.toFixed(4)} periodic=${normalizedConf > 0.7}`],
    };
}
// ============================================================================
// ALG_T2_F_011 · 频率扫描
// ============================================================================
function frequencySweep(startHz, endHz, duration, sampleRate = 100) {
    if (startHz <= 0 || endHz <= 0 || duration <= 0 || sampleRate <= 0) {
        return { signal: [], instantaneousHz: [], provenance: ['[ALG_T2_F_011] 参数无效'] };
    }
    const samples = Math.floor(duration * sampleRate);
    const signal = [];
    const instantaneousHz = [];
    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        const freq = startHz + (endHz - startHz) * progress;
        instantaneousHz.push(freq);
        // 累积相位
        const phase = 2 * Math.PI * (startHz * t + (endHz - startHz) * t * t / (2 * duration));
        signal.push(Math.sin(phase));
    }
    return {
        signal,
        instantaneousHz,
        provenance: [`[ALG_T2_F_011] start=${startHz} end=${endHz} dur=${duration} samples=${samples}`],
    };
}
// ============================================================================
// ALG_T2_F_012 · 频率同步
// ============================================================================
function frequencySynchronize(localHz, referenceHz, bandwidth = 0.1) {
    if (bandwidth <= 0 || bandwidth > 1) {
        return { synchronizedHz: localHz, converged: false, iterations: 0, provenance: ['[ALG_T2_F_012] 无效带宽'] };
    }
    let current = localHz;
    let iterations = 0;
    const maxIter = 100;
    for (let i = 0; i < maxIter; i++) {
        const error = referenceHz - current;
        if (Math.abs(error) < 0.001) {
            return {
                synchronizedHz: current,
                converged: true,
                iterations: i,
                provenance: [`[ALG_T2_F_012] conv=true iter=${i} hz=${current.toFixed(4)}`],
            };
        }
        current += error * bandwidth;
        iterations++;
    }
    return {
        synchronizedHz: current,
        converged: false,
        iterations,
        provenance: [`[ALG_T2_F_012] conv=false iter=${iterations} hz=${current.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_013 · 频率抖动分析
// ============================================================================
function frequencyJitterAnalyze(signal, nominalHz, sampleRate = 1) {
    if (signal.length < 4 || nominalHz <= 0) {
        return { jitter: 0, peakToPeak: 0, rms: 0, provenance: ['[ALG_T2_F_013] 参数无效'] };
    }
    // 检测过零点
    const zeroCrossings = [];
    for (let i = 1; i < signal.length; i++) {
        if ((signal[i - 1] < 0 && signal[i] >= 0) || (signal[i - 1] >= 0 && signal[i] < 0)) {
            // 线性插值找精确过零点
            const t = i - 1 + Math.abs(signal[i - 1]) / (Math.abs(signal[i - 1]) + Math.abs(signal[i]));
            zeroCrossings.push(t / sampleRate);
        }
    }
    if (zeroCrossings.length < 2) {
        return { jitter: 0, peakToPeak: 0, rms: 0, provenance: ['[ALG_T2_F_013] 过零点不足'] };
    }
    const nominalPeriod = 1 / nominalHz;
    const periods = [];
    for (let i = 1; i < zeroCrossings.length; i += 2) {
        if (i < zeroCrossings.length) {
            periods.push(zeroCrossings[i] - zeroCrossings[i - 1]);
        }
    }
    const deviations = periods.map(p => (p - nominalPeriod) / nominalPeriod);
    const mean = deviations.reduce((s, x) => s + x, 0) / deviations.length;
    const rms = Math.sqrt(deviations.reduce((s, x) => s + (x - mean) ** 2, 0) / deviations.length);
    const peakToPeak = Math.max(...deviations) - Math.min(...deviations);
    return {
        jitter: rms,
        peakToPeak,
        rms,
        provenance: [`[ALG_T2_F_013] jitter=${rms.toFixed(6)} p2p=${peakToPeak.toFixed(6)} crossings=${zeroCrossings.length}`],
    };
}
// ============================================================================
// ALG_T2_F_014 · 频率衰减
// ============================================================================
function frequencyDecay(initialHz, decayRate, timeSteps) {
    if (initialHz <= 0 || decayRate <= 0 || decayRate >= 1 || timeSteps <= 0) {
        return { frequencies: [], halfLife: 0, finalHz: 0, provenance: ['[ALG_T2_F_014] 参数无效'] };
    }
    const frequencies = [];
    let current = initialHz;
    for (let t = 0; t < timeSteps; t++) {
        frequencies.push(current);
        current *= (1 - decayRate);
    }
    const halfLife = Math.log(0.5) / Math.log(1 - decayRate);
    return {
        frequencies,
        halfLife,
        finalHz: current,
        provenance: [`[ALG_T2_F_014] init=${initialHz} final=${current.toFixed(4)} halfLife=${halfLife.toFixed(2)}`],
    };
}
// ============================================================================
// ALG_T2_F_015 · 频率放大
// ============================================================================
function frequencyAmplify(signal, gain, clippingThreshold = 1) {
    if (signal.length === 0 || gain <= 0) {
        return { amplified: [], clipped: 0, peakAmplitude: 0, provenance: ['[ALG_T2_F_015] 参数无效'] };
    }
    let clipped = 0;
    let peak = 0;
    const amplified = signal.map(s => {
        const v = s * gain;
        if (Math.abs(v) > clippingThreshold) {
            clipped++;
            return Math.sign(v) * clippingThreshold;
        }
        if (Math.abs(v) > peak)
            peak = Math.abs(v);
        return v;
    });
    return {
        amplified,
        clipped,
        peakAmplitude: peak,
        provenance: [`[ALG_T2_F_015] gain=${gain} clipped=${clipped}/${signal.length} peak=${peak.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_016 · 频率混频
// ============================================================================
function frequencyMix(signalA, signalB) {
    const n = Math.min(signalA.length, signalB.length);
    if (n === 0) {
        return { mixed: [], sumFreq: 0, diffFreq: 0, provenance: ['[ALG_T2_F_016] 空信号'] };
    }
    const mixed = [];
    for (let i = 0; i < n; i++) {
        mixed.push(signalA[i] * signalB[i]);
    }
    // 简化：通过零交叉率估计频率
    function estimateFreq(sig) {
        let crossings = 0;
        for (let i = 1; i < sig.length; i++) {
            if ((sig[i - 1] < 0 && sig[i] >= 0) || (sig[i - 1] >= 0 && sig[i] < 0))
                crossings++;
        }
        return crossings / 2 / (sig.length / 100);
    }
    const freqA = estimateFreq(signalA);
    const freqB = estimateFreq(signalB);
    return {
        mixed,
        sumFreq: freqA + freqB,
        diffFreq: Math.abs(freqA - freqB),
        provenance: [`[ALG_T2_F_016] samples=${n} sum=${(freqA + freqB).toFixed(4)} diff=${Math.abs(freqA - freqB).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_017 · 频率阈值告警
// ============================================================================
function frequencyThresholdAlert(currentHz, thresholds) {
    let level;
    let action;
    if (currentHz >= thresholds.critical) {
        level = 'critical';
        action = 'emergency_shutdown';
    }
    else if (currentHz >= thresholds.high) {
        level = 'high';
        action = 'reduce_frequency';
    }
    else if (currentHz <= thresholds.low) {
        level = 'low';
        action = 'increase_frequency';
    }
    else {
        level = 'normal';
        action = 'continue';
    }
    return {
        level,
        action,
        provenance: [`[ALG_T2_F_017] hz=${currentHz.toFixed(2)} level=${level} action=${action}`],
    };
}
// ============================================================================
// ALG_T2_F_018 · 频率校准
// ============================================================================
function frequencyCalibrate(measured, reference) {
    if (measured.length === 0) {
        return { calibrated: [], offset: 0, residual: 0, provenance: ['[ALG_T2_F_018] 空测量'] };
    }
    const mean = measured.reduce((s, x) => s + x, 0) / measured.length;
    const offset = reference - mean;
    const calibrated = measured.map(m => m + offset);
    const residual = Math.sqrt(calibrated.reduce((s, x) => s + (x - reference) ** 2, 0) / calibrated.length);
    return {
        calibrated,
        offset,
        residual,
        provenance: [`[ALG_T2_F_018] offset=${offset.toFixed(4)} residual=${residual.toFixed(4)} n=${measured.length}`],
    };
}
// ============================================================================
// ALG_T2_F_019 · 频率统计
// ============================================================================
function frequencyStatistics(samples) {
    if (samples.length === 0) {
        return { mean: 0, median: 0, std: 0, min: 0, max: 0, provenance: ['[ALG_T2_F_019] 空样本'] };
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    const std = Math.sqrt(variance);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    return {
        mean,
        median,
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        provenance: [`[ALG_T2_F_019] n=${samples.length} mean=${mean.toFixed(4)} std=${std.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_F_020 · 频率综合评估
// ============================================================================
function frequencyComprehensiveAssessment(profile, metrics) {
    const stabilityScore = metrics.stability;
    const efficiencyScore = metrics.efficiency;
    const adaptabilityScore = metrics.adaptability;
    const integrityScore = profile.integrity;
    const overall = (stabilityScore + efficiencyScore + adaptabilityScore + integrityScore) / 4;
    let recommendation;
    if (overall >= 0.9)
        recommendation = 'maintain_current_frequency';
    else if (overall >= 0.7)
        recommendation = 'fine_tune_frequency';
    else if (overall >= 0.5)
        recommendation = 'adjust_frequency_state';
    else
        recommendation = 'frequency_overhaul_needed';
    return {
        overall,
        state: profile.state,
        recommendation,
        provenance: [`[ALG_T2_F_020] overall=${overall.toFixed(4)} state=${profile.state} rec=${recommendation}`],
    };
}

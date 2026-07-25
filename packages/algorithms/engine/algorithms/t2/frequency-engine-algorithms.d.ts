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
export type FrequencyState = 'dormant' | 'standby' | 'active' | 'hyperactive';
export interface FrequencyProfile {
    state: FrequencyState;
    currentHz: number;
    targetHz: number;
    integrity: number;
}
export declare function frequencyStateMachine(integrity: number, currentState: FrequencyState): {
    nextState: FrequencyState;
    targetHz: number;
    transitionReason: string;
    provenance: string[];
};
export declare function frequencyAdaptiveControl(currentHz: number, integrityTrend: number, adaptRate?: number): {
    adjustedHz: number;
    direction: string;
    magnitude: number;
    provenance: string[];
};
export declare function frequencyResonanceDetect(signalA: number[], signalB: number[], sampleRate?: number): {
    resonanceFreq: number;
    coherence: number;
    inResonance: boolean;
    provenance: string[];
};
export declare function frequencyLock(currentHz: number, targetHz: number, tolerance?: number): {
    locked: boolean;
    error: number;
    correction: number;
    provenance: string[];
};
export declare function frequencyHarmonicAnalysis(signal: number[], fundamentalHz: number): {
    harmonics: {
        freq: number;
        amplitude: number;
    }[];
    thd: number;
    provenance: string[];
};
export declare function frequencySpectralDensity(signal: number[], sampleRate?: number): {
    spectrum: {
        freq: number;
        power: number;
    }[];
    dominantFreq: number;
    totalPower: number;
    provenance: string[];
};
export declare function frequencyPhaseDiff(signalA: number[], signalB: number[]): {
    phaseDiff: number;
    phaseDiffDeg: number;
    synchronized: boolean;
    provenance: string[];
};
export declare function frequencyModulate(carrierHz: number, modulationHz: number, modulationDepth: number, duration: number, sampleRate?: number): {
    signal: number[];
    effectiveHz: number;
    provenance: string[];
};
export declare function frequencyFilter(signal: number[], cutoffHz: number, sampleRate?: number, type?: 'lowpass' | 'highpass'): {
    filtered: number[];
    attenuation: number;
    provenance: string[];
};
export declare function frequencyPeriodDetect(signal: number[], minPeriod?: number, maxPeriod?: number): {
    period: number;
    confidence: number;
    isPeriodic: boolean;
    provenance: string[];
};
export declare function frequencySweep(startHz: number, endHz: number, duration: number, sampleRate?: number): {
    signal: number[];
    instantaneousHz: number[];
    provenance: string[];
};
export declare function frequencySynchronize(localHz: number, referenceHz: number, bandwidth?: number): {
    synchronizedHz: number;
    converged: boolean;
    iterations: number;
    provenance: string[];
};
export declare function frequencyJitterAnalyze(signal: number[], nominalHz: number, sampleRate?: number): {
    jitter: number;
    peakToPeak: number;
    rms: number;
    provenance: string[];
};
export declare function frequencyDecay(initialHz: number, decayRate: number, timeSteps: number): {
    frequencies: number[];
    halfLife: number;
    finalHz: number;
    provenance: string[];
};
export declare function frequencyAmplify(signal: number[], gain: number, clippingThreshold?: number): {
    amplified: number[];
    clipped: number;
    peakAmplitude: number;
    provenance: string[];
};
export declare function frequencyMix(signalA: number[], signalB: number[]): {
    mixed: number[];
    sumFreq: number;
    diffFreq: number;
    provenance: string[];
};
export declare function frequencyThresholdAlert(currentHz: number, thresholds: {
    low: number;
    high: number;
    critical: number;
}): {
    level: string;
    action: string;
    provenance: string[];
};
export declare function frequencyCalibrate(measured: number[], reference: number): {
    calibrated: number[];
    offset: number;
    residual: number;
    provenance: string[];
};
export declare function frequencyStatistics(samples: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    provenance: string[];
};
export declare function frequencyComprehensiveAssessment(profile: FrequencyProfile, metrics: {
    stability: number;
    efficiency: number;
    adaptability: number;
}): {
    overall: number;
    state: string;
    recommendation: string;
    provenance: string[];
};

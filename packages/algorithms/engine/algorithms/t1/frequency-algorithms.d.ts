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
export type FrequencyState = 'dormant' | 'standby' | 'active';
export declare function computeIntegrity(dimensions: {
    name: string;
    value: number;
    weight: number;
    target: number;
}[]): {
    integrity: number;
    gaps: {
        name: string;
        gap: number;
    }[];
    provenance: string[];
};
export declare function frequencyState(integrity: number, threshold?: number): {
    state: FrequencyState;
    reason: string;
    provenance: string[];
};
export declare function frequencyAdapt(history: {
    integrity: number;
    frequency: number;
}[], targetIntegrity?: number, adjustmentRate?: number): {
    newFrequency: number;
    state: FrequencyState;
    provenance: string[];
};
export declare function lowFrequencyDive(currentFrequency: number, depth?: number): {
    frequency: number;
    depth: number;
    provenance: string[];
};
export declare function highFrequencyActivate(currentFrequency: number, boostFactor?: number): {
    frequency: number;
    boost: number;
    provenance: string[];
};
export declare function frequencyDecay(initialFrequency: number, elapsed: number, halfLife?: number): {
    frequency: number;
    decayFactor: number;
    provenance: string[];
};
export declare function frequencyOscillation(baseFrequency: number, amplitude: number, time: number, period?: number): {
    frequency: number;
    phase: number;
    provenance: string[];
};
export declare function frequencyResonance(frequencyA: number, frequencyB: number, tolerance?: number): {
    resonant: boolean;
    ratio: number;
    harmonic: number;
    provenance: string[];
};
export declare function frequencySpectrum(signal: number[]): {
    magnitudes: number[];
    phases: number[];
    dominantFreq: number;
    provenance: string[];
};
export declare function frequencyPhase(frequency: number, time: number, initialPhase?: number): {
    phase: number;
    normalizedPhase: number;
    provenance: string[];
};
export declare function frequencyAmplitude(signal: number[]): {
    amplitude: number;
    peak: number;
    rms: number;
    provenance: string[];
};
export declare function frequencyModulation(carrierFreq: number, modulatingFreq: number, modulationIndex: number, time: number): {
    modulatedFreq: number;
    provenance: string[];
};
export declare function frequencySynchronization(localFreq: number, referenceFreq: number, couplingStrength?: number): {
    synchronizedFreq: number;
    lockRange: number;
    provenance: string[];
};
export declare function frequencyHarmonics(fundamentalFreq: number, maxHarmonics?: number): {
    harmonics: number[];
    totalEnergy: number;
    provenance: string[];
};
export declare function frequencyBandwidth(frequencies: number[]): {
    bandwidth: number;
    minFreq: number;
    maxFreq: number;
    centerFreq: number;
    provenance: string[];
};

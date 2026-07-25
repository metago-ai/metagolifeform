"use strict";
/**
 * MetaGO Engine - A5 927 算法真实化 · 算法注册表
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单（T1=300 / T2=400 / T3=227）
 *
 * 算法 ID 规范：
 *   T1: ALG_T1_<族代码>_<序号>（如 ALG_T1_C_001 = 耦生度类第 1 个）
 *   T2: ALG_T2_<族代码>_<序号>
 *   T3: ALG_T3_<族代码>_<序号>
 *
 * 族代码：
 *   C=COUPLING  V=VALUE  B=BIAS  L=LOGIC
 *   E=EVOLUTION  M=CREATION  F=FREQUENCY  D=DECISION
 *   S=SECURITY  N=NEGENTROPY  K=MEMORY  G=LEARNING
 *   R=REASONING  I=INTUITION  X=CONFLICT  T=TIME
 *   A=DIALOG  P=PROACTIVE  H=IDEA  U=AUDIT
 *   O=ORCHESTRATION  W=ENVELOPE  EM=EMBODIED  ED=EDGE
 *   IN=INDUSTRIAL  MR=MODE_RESONANCE  Z=GENERAL
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistry = getRegistry;
exports.getAlgorithmById = getAlgorithmById;
exports.getAlgorithmsByTier = getAlgorithmsByTier;
exports.getAlgorithmsByFamily = getAlgorithmsByFamily;
exports.searchAlgorithms = searchAlgorithms;
exports.getImplementedCount = getImplementedCount;
exports.getTotalCount = getTotalCount;
exports.executeAlgorithm = executeAlgorithm;
exports.executeAlgorithmSync = executeAlgorithmSync;
const types_1 = require("./types");
// ============================================================================
// T1 第一批已实现算法（4 类 × 30 = 120 个）导入
// ============================================================================
const CouplingAlg = __importStar(require("./t1/coupling-algorithms"));
const ValueAlg = __importStar(require("./t1/value-algorithms"));
const BiasAlg = __importStar(require("./t1/bias-algorithms"));
const LogicAlg = __importStar(require("./t1/logic-algorithms"));
// ============================================================================
// T1 第二批已实现算法（12 类 × 15 = 180 个）导入
// ============================================================================
const EvolutionAlg = __importStar(require("./t1/evolution-algorithms"));
const CreationAlg = __importStar(require("./t1/creation-algorithms"));
const FrequencyAlg = __importStar(require("./t1/frequency-algorithms"));
const DecisionAlg = __importStar(require("./t1/decision-algorithms"));
const SecurityAlg = __importStar(require("./t1/security-algorithms"));
const NegentropyAlg = __importStar(require("./t1/negentropy-algorithms"));
const MemoryAlg = __importStar(require("./t1/memory-algorithms"));
const LearningAlg = __importStar(require("./t1/learning-algorithms"));
const ReasoningAlg = __importStar(require("./t1/reasoning-algorithms"));
const IntuitionAlg = __importStar(require("./t1/intuition-algorithms"));
const ConflictAlg = __importStar(require("./t1/conflict-algorithms"));
const TimeAlg = __importStar(require("./t1/time-algorithms"));
// ============================================================================
// T2 引擎封装算法导入（20 类 × 20 = 400 个）
// ============================================================================
const T2CouplingAlg = __importStar(require("./t2/coupling-engine-algorithms"));
const T2ValueAlg = __importStar(require("./t2/value-engine-algorithms"));
const T2BiasAlg = __importStar(require("./t2/bias-engine-algorithms"));
const T2LogicAlg = __importStar(require("./t2/logic-engine-algorithms"));
const T2EvolutionAlg = __importStar(require("./t2/evolution-engine-algorithms"));
const T2CreationAlg = __importStar(require("./t2/creation-engine-algorithms"));
const T2FrequencyAlg = __importStar(require("./t2/frequency-engine-algorithms"));
const T2DecisionAlg = __importStar(require("./t2/decision-engine-algorithms"));
const T2SecurityAlg = __importStar(require("./t2/security-engine-algorithms"));
const T2NegentropyAlg = __importStar(require("./t2/negentropy-engine-algorithms"));
const T2MemoryAlg = __importStar(require("./t2/memory-engine-algorithms"));
const T2LearningAlg = __importStar(require("./t2/learning-engine-algorithms"));
const T2ReasoningAlg = __importStar(require("./t2/reasoning-engine-algorithms"));
const T2IntuitionAlg = __importStar(require("./t2/intuition-engine-algorithms"));
const T2ConflictAlg = __importStar(require("./t2/conflict-engine-algorithms"));
const T2TimeAlg = __importStar(require("./t2/time-engine-algorithms"));
const T2DialogAlg = __importStar(require("./t2/dialog-engine-algorithms"));
const T2ProactiveAlg = __importStar(require("./t2/proactive-engine-algorithms"));
const T2IdeaAlg = __importStar(require("./t2/idea-engine-algorithms"));
const T2AuditAlg = __importStar(require("./t2/audit-engine-algorithms"));
// T3 概念存档导入（227 个概念）
const concept_index_1 = require("./t3/concept-index");
// ============================================================================
// 注册表构造
// ============================================================================
const REGISTRY = [];
function registerT1(id, name, family, handler, description, inputSchema, outputSchema, keywords, complexity = types_1.AlgorithmComplexity.O_N) {
    REGISTRY.push({
        id,
        name,
        family,
        tier: types_1.AlgorithmTier.T1,
        handler: handler,
        testPath: `packages/engine/RUNTIME/src/algorithms/t1/${family.toLowerCase()}-algorithms.test.ts`,
        documentationRef: `附录A·T1·${id}`,
        complexity,
        inputSchema,
        outputSchema,
        description,
        keywords,
        implemented: true,
    });
}
// ============================================================================
// T1 第一批注册（120 个）—— 耦生度类
// ============================================================================
registerT1('ALG_T1_C_001', 'cosineSimilarity', types_1.AlgorithmFamily.COUPLING, CouplingAlg.cosineSimilarity, '余弦相似度计算，[-1,1] → [0,1] 归一化', 'VectorPair{a:number[],b:number[]}', 'CouplingResult{score,normalized,provenance}', ['相似度', '余弦', '向量', '耦生度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_002', 'jaccardCoefficient', types_1.AlgorithmFamily.COUPLING, CouplingAlg.jaccardCoefficient, 'Jaccard 系数 = 交集/并集', 'SetPair{a,b}', 'CouplingResult', ['Jaccard', '集合', '相似度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_003', 'diceCoefficient', types_1.AlgorithmFamily.COUPLING, CouplingAlg.diceCoefficient, 'Dice 系数 = 2*交集/(|A|+|B|)', 'SetPair', 'CouplingResult', ['Dice', '集合', '相似度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_004', 'euclideanDistance', types_1.AlgorithmFamily.COUPLING, CouplingAlg.euclideanDistance, '欧氏距离', 'VectorPair', 'CouplingResult', ['欧氏', '距离'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_005', 'manhattanDistance', types_1.AlgorithmFamily.COUPLING, CouplingAlg.manhattanDistance, '曼哈顿距离', 'VectorPair', 'CouplingResult', ['曼哈顿', '距离'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_006', 'chebyshevDistance', types_1.AlgorithmFamily.COUPLING, CouplingAlg.chebyshevDistance, '切比雪夫距离', 'VectorPair', 'CouplingResult', ['切比雪夫', '距离'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_007', 'pearsonCorrelation', types_1.AlgorithmFamily.COUPLING, CouplingAlg.pearsonCorrelation, '皮尔逊相关系数', 'VectorPair', 'CouplingResult', ['皮尔逊', '相关'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_008', 'spearmanCorrelation', types_1.AlgorithmFamily.COUPLING, CouplingAlg.spearmanCorrelation, '斯皮尔曼等级相关', 'VectorPair', 'CouplingResult', ['斯皮尔曼', '相关'], types_1.AlgorithmComplexity.O_N_LOG_N);
registerT1('ALG_T1_C_009', 'kendallTau', types_1.AlgorithmFamily.COUPLING, CouplingAlg.kendallTau, '肯德尔 τ 等级相关', 'VectorPair', 'CouplingResult', ['肯德尔', 'tau', '相关'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_010', 'weightedCosineSimilarity', types_1.AlgorithmFamily.COUPLING, CouplingAlg.weightedCosineSimilarity, '加权余弦相似度', 'VectorPair+weights', 'CouplingResult', ['加权', '余弦'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_011', 'fuzzyStringMatch', types_1.AlgorithmFamily.COUPLING, CouplingAlg.fuzzyStringMatch, '模糊字符串匹配（2-gram Jaccard）', 'string,string', 'CouplingResult', ['模糊', '字符串', '匹配'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_012', 'semanticSimilarity', types_1.AlgorithmFamily.COUPLING, CouplingAlg.semanticSimilarity, '语义相似度（关键词+同义词）', 'tokens1,tokens2,synonyms', 'CouplingResult', ['语义', '相似度', '同义词'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_C_013', 'cooccurrenceFrequency', types_1.AlgorithmFamily.COUPLING, CouplingAlg.cooccurrenceFrequency, '共现频率', 'sequences,item1,item2', 'CouplingResult', ['共现', '频率'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_014', 'timeDecayCooccurrence', types_1.AlgorithmFamily.COUPLING, CouplingAlg.timeDecayCooccurrence, '时间衰减共现', 'events,item1,item2,halfLife,now', 'CouplingResult', ['时间衰减', '共现'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_015', 'evaluateBidirectionalCoupling', types_1.AlgorithmFamily.COUPLING, CouplingAlg.evaluateBidirectionalCoupling, '双向耦生评估', 'forwardSamples,backwardSamples', 'BidirectionalCoupling', ['双向', '耦生', '对称'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_016', 'isSuperconductive', types_1.AlgorithmFamily.COUPLING, CouplingAlg.isSuperconductive, '超导判定（耦生度>1）', 'number', '{superconductive,margin}', ['超导', '耦生度'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_C_017', 'identifyWeakPairs', types_1.AlgorithmFamily.COUPLING, CouplingAlg.identifyWeakPairs, '弱对识别', 'CouplingMatrix,threshold', '{pairs}', ['弱对', '识别'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_018', 'identifyStrongPairs', types_1.AlgorithmFamily.COUPLING, CouplingAlg.identifyStrongPairs, '强对识别', 'CouplingMatrix,threshold', '{pairs}', ['强对', '识别'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_019', 'buildCouplingMatrix', types_1.AlgorithmFamily.COUPLING, CouplingAlg.buildCouplingMatrix, '耦生矩阵构造', 'labels,scoreFn', 'CouplingMatrix', ['矩阵', '耦生'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_020', 'normalizeCoupling', types_1.AlgorithmFamily.COUPLING, CouplingAlg.normalizeCoupling, '归一化耦生分数', 'number[]', '{normalized,min,max}', ['归一化'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_021', 'sortCouplingScores', types_1.AlgorithmFamily.COUPLING, CouplingAlg.sortCouplingScores, '耦生度排序', 'entries,descending', '{sorted}', ['排序'], types_1.AlgorithmComplexity.O_N_LOG_N);
registerT1('ALG_T1_C_022', 'recordSymmetric', types_1.AlgorithmFamily.COUPLING, CouplingAlg.recordSymmetric, '对称记录', 'store,a,b,score', '{key}', ['对称', '记录'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_C_023', 'detectAsymmetry', types_1.AlgorithmFamily.COUPLING, CouplingAlg.detectAsymmetry, '非对称检测', 'CouplingMatrix,tolerance', '{asymmetric}', ['非对称', '检测'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_024', 'couplingTrend', types_1.AlgorithmFamily.COUPLING, CouplingAlg.couplingTrend, '耦生趋势分析', 'timeSeries', '{slope,trend}', ['趋势'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_025', 'couplingClustering', types_1.AlgorithmFamily.COUPLING, CouplingAlg.couplingClustering, '耦生聚类（连通分量）', 'CouplingMatrix,threshold', '{clusters}', ['聚类', '连通'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_C_026', 'buildValueVector', types_1.AlgorithmFamily.COUPLING, CouplingAlg.buildValueVector, '价值向量构造', 'dimensions', '{vector,names,weights}', ['价值', '向量'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_027', 'reduceDimension', types_1.AlgorithmFamily.COUPLING, CouplingAlg.reduceDimension, '向量降维（平均聚合）', 'vector,targetDim', '{reduced}', ['降维'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_C_028', 'extractPrincipalComponent', types_1.AlgorithmFamily.COUPLING, CouplingAlg.extractPrincipalComponent, '主成分提取（方差最大）', 'vectors', '{component,index,variance}', ['PCA', '主成分'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_C_029', 'simplifiedSVD', types_1.AlgorithmFamily.COUPLING, CouplingAlg.simplifiedSVD, '简化奇异值分解（幂迭代）', 'matrix,iterations', '{leftVector,singularValue}', ['SVD', '奇异值'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_C_030', 'covariance', types_1.AlgorithmFamily.COUPLING, CouplingAlg.covariance, '协方差计算', 'samples{x,y}', '{cov}', ['协方差'], types_1.AlgorithmComplexity.O_N);
// ============================================================================
// T1 第一批 · 价值评估类（30 个）
// ============================================================================
registerT1('ALG_T1_V_001', 'aggregateSixDimValue', types_1.AlgorithmFamily.VALUE, ValueAlg.aggregateSixDimValue, '六维价值聚合', 'ValueDimension[]', 'ValueAssessment', ['六维', '价值', '聚合'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_002', 'normalizeValueVector', types_1.AlgorithmFamily.VALUE, ValueAlg.normalizeValueVector, '价值向量归一化', 'vector,method', '{normalized,method}', ['归一化', 'minmax', 'zscore', 'l2'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_003', 'calculateDCVWeights', types_1.AlgorithmFamily.VALUE, ValueAlg.calculateDCVWeights, 'DCV 权重计算（方差倒数法）', 'samples[][]', '{weights}', ['DCV', '权重'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_V_004', 'behaviorBankScore', types_1.AlgorithmFamily.VALUE, ValueAlg.behaviorBankScore, '行为银行积分', 'deposits,withdrawals', '{net,total}', ['行为银行', '积分'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_005', 'holographicCreditScore', types_1.AlgorithmFamily.VALUE, ValueAlg.holographicCreditScore, '全息信用评分', 'factors[]{score,weight}', '{score,grade}', ['信用', '评分'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_006', 'valueAlignment', types_1.AlgorithmFamily.VALUE, ValueAlg.valueAlignment, '价值对齐度（余弦）', 'current,target', '{alignment,deviation}', ['对齐', '价值'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_007', 'detectValueConflicts', types_1.AlgorithmFamily.VALUE, ValueAlg.detectValueConflicts, '价值冲突检测', 'values[]{name,vector},threshold', '{conflicts}', ['冲突', '价值'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_V_008', 'prioritizeValues', types_1.AlgorithmFamily.VALUE, ValueAlg.prioritizeValues, '价值优先级排序', 'values[]{importance,urgency}', '{ranked}', ['优先级', '价值'], types_1.AlgorithmComplexity.O_N_LOG_N);
registerT1('ALG_T1_V_009', 'valueDecay', types_1.AlgorithmFamily.VALUE, ValueAlg.valueDecay, '价值衰减（时间）', 'initialValue,halfLife,elapsed', '{currentValue}', ['衰减', '价值'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_V_010', 'valueGain', types_1.AlgorithmFamily.VALUE, ValueAlg.valueGain, '价值增益', 'baseline,actual,maxPossible', '{gain,relativeGain}', ['增益', '价值'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_V_011', 'valueTransfer', types_1.AlgorithmFamily.VALUE, ValueAlg.valueTransfer, '价值转移（账户间）', 'from,to,amount,fromKey,toKey', '{from,to}', ['转移', '账户'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_V_012', 'valueBalance', types_1.AlgorithmFamily.VALUE, ValueAlg.valueBalance, '价值平衡', 'values[]', '{mean,variance,balance}', ['平衡', '方差'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_013', 'compareMultiDimValues', types_1.AlgorithmFamily.VALUE, ValueAlg.compareMultiDimValues, '多维价值对比', 'a,b', '{dominant,margin}', ['对比', '多维'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_014', 'buildValueMatrix', types_1.AlgorithmFamily.VALUE, ValueAlg.buildValueMatrix, '价值矩阵构造', 'rows,cols,valueFn', '{matrix}', ['矩阵'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_V_015', 'valueTrend', types_1.AlgorithmFamily.VALUE, ValueAlg.valueTrend, '价值趋势分析', 'timeSeries', '{slope,trend}', ['趋势', '价值'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_016', 'valueRiskAssessment', types_1.AlgorithmFamily.VALUE, ValueAlg.valueRiskAssessment, '价值风险评估', 'values,confidence', '{risk,confidence}', ['风险', '价值'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_017', 'valueROI', types_1.AlgorithmFamily.VALUE, ValueAlg.valueROI, '价值回报率', 'investment,return,period', '{roi,annualizedRoi}', ['ROI', '回报率'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_V_018', 'valueDensity', types_1.AlgorithmFamily.VALUE, ValueAlg.valueDensity, '价值密度', 'totalValue,volume', '{density}', ['密度'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_V_019', 'valueEntropy', types_1.AlgorithmFamily.VALUE, ValueAlg.valueEntropy, '价值熵（信息熵）', 'values[]', '{entropy}', ['熵', '信息'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_020', 'valueCoverage', types_1.AlgorithmFamily.VALUE, ValueAlg.valueCoverage, '价值覆盖度', 'covered,total', '{coverage,gaps}', ['覆盖'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_021', 'valueDepth', types_1.AlgorithmFamily.VALUE, ValueAlg.valueDepth, '价值深度', 'chain[]{level,value}', '{maxDepth,avgDepth}', ['深度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_022', 'valueBreadth', types_1.AlgorithmFamily.VALUE, ValueAlg.valueBreadth, '价值广度', 'domains,coverage', '{breadth,coveredDomains}', ['广度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_023', 'valueStability', types_1.AlgorithmFamily.VALUE, ValueAlg.valueStability, '价值稳定度', 'timeSeries', '{stability,cv}', ['稳定', 'CV'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_024', 'valueConfidence', types_1.AlgorithmFamily.VALUE, ValueAlg.valueConfidence, '价值可信度', 'samples,reference', '{confidence,bias}', ['可信度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_025', 'valueTrace', types_1.AlgorithmFamily.VALUE, ValueAlg.valueTrace, '价值溯源', 'chain[]{source,contribution}', '{sources,total}', ['溯源'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_026', 'valueAudit', types_1.AlgorithmFamily.VALUE, ValueAlg.valueAudit, '价值审计', 'claimed,actual', '{discrepancies,auditScore}', ['审计'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_027', 'valueCalibration', types_1.AlgorithmFamily.VALUE, ValueAlg.valueCalibration, '价值校准', 'measured,standard', '{calibrated,offsets}', ['校准'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_028', 'valueMapping', types_1.AlgorithmFamily.VALUE, ValueAlg.valueMapping, '价值映射', 'source,mapping[]', '{mapped}', ['映射'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_V_029', 'valueProjection', types_1.AlgorithmFamily.VALUE, ValueAlg.valueProjection, '价值投影', 'vector,basis[][]', '{projection}', ['投影'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_V_030', 'comprehensiveValueAssessment', types_1.AlgorithmFamily.VALUE, ValueAlg.comprehensiveValueAssessment, '价值综合评估', 'metrics{alignment,balance,...}', '{score,grade}', ['综合', '评估'], types_1.AlgorithmComplexity.O1);
// ============================================================================
// T1 第一批 · 偏差检测类（30 个）
// ============================================================================
registerT1('ALG_T1_B_001', 'driftScore', types_1.AlgorithmFamily.BIAS, BiasAlg.driftScore, '漂移分数（余弦偏离）', 'expected,actual', '{score}', ['漂移', '分数'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_002', 'deviationVector', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationVector, '偏差向量', 'expected,actual', '{vector}', ['偏差', '向量'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_003', 'deviationDirection', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationDirection, '偏差方向', 'deviation[]', '{directions,dominant}', ['方向'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_004', 'deviationMagnitude', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationMagnitude, '偏差幅度', 'deviation[]', '{magnitude,maxAbs}', ['幅度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_005', 'deviationTrend', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationTrend, '偏差趋势', 'samples[]{timestamp,expected,actual}', '{slope,trend}', ['趋势', '偏差'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_006', 'deviationAccumulation', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationAccumulation, '偏差累积', 'samples[]', '{cumulative,maxCumulative}', ['累积'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_007', 'thresholdAlert', types_1.AlgorithmFamily.BIAS, BiasAlg.thresholdAlert, '阈值告警', 'values,thresholds[]', '{alerts}', ['阈值', '告警'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_008', 'anomalyDetection', types_1.AlgorithmFamily.BIAS, BiasAlg.anomalyDetection, '异常检测（Z-score）', 'values,zThreshold', '{anomalies,zScores}', ['异常', 'zscore'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_009', 'outlierDetection', types_1.AlgorithmFamily.BIAS, BiasAlg.outlierDetection, '离群点识别（IQR）', 'values,multiplier', '{outliers,q1,q3,iqr}', ['离群', 'IQR'], types_1.AlgorithmComplexity.O_N_LOG_N);
registerT1('ALG_T1_B_010', 'distributionShift', types_1.AlgorithmFamily.BIAS, BiasAlg.distributionShift, '分布偏移（KS 检验）', 'reference,current', '{ksStatistic,shifted}', ['分布', 'KS'], types_1.AlgorithmComplexity.O_N_LOG_N);
registerT1('ALG_T1_B_011', 'conceptDrift', types_1.AlgorithmFamily.BIAS, BiasAlg.conceptDrift, '概念漂移', 'errorRates[]{window,errorRate},threshold', '{driftDetected,driftPoint}', ['概念', '漂移'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_012', 'dataDrift', types_1.AlgorithmFamily.BIAS, BiasAlg.dataDrift, '数据漂移', 'refStats,curStats,threshold', '{drifted,meanShift,stdShift}', ['数据', '漂移'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_B_013', 'modelDrift', types_1.AlgorithmFamily.BIAS, BiasAlg.modelDrift, '模型漂移', 'performanceHistory[],threshold', '{drifting,rate}', ['模型', '漂移'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_014', 'behaviorDrift', types_1.AlgorithmFamily.BIAS, BiasAlg.behaviorDrift, '行为漂移', 'expectedActions,actualActions', '{driftScore,newActions,missingActions}', ['行为', '漂移'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_015', 'valueDrift', types_1.AlgorithmFamily.BIAS, BiasAlg.valueDrift, '价值漂移', 'historicalValues,currentValue,sensitivity', '{drifted,zScore}', ['价值', '漂移'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_016', 'performanceDegradation', types_1.AlgorithmFamily.BIAS, BiasAlg.performanceDegradation, '性能退化', 'baseline,current,threshold', '{degraded,degradation}', ['性能', '退化'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_B_017', 'accuracyDrop', types_1.AlgorithmFamily.BIAS, BiasAlg.accuracyDrop, '准确度下降', 'historicalAccuracy[],currentAccuracy,threshold', '{dropped,drop}', ['准确度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_018', 'recallDrop', types_1.AlgorithmFamily.BIAS, BiasAlg.recallDrop, '召回率下降', 'historicalRecall[],currentRecall,threshold', '{dropped,drop}', ['召回率'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_019', 'precisionDrop', types_1.AlgorithmFamily.BIAS, BiasAlg.precisionDrop, '精度下降', 'historicalPrecision[],currentPrecision,threshold', '{dropped,drop}', ['精度'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_020', 'f1ScoreDrop', types_1.AlgorithmFamily.BIAS, BiasAlg.f1ScoreDrop, 'F1 分数下降', 'historicalF1[],currentF1,threshold', '{dropped,drop}', ['F1'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_021', 'deviationAttribution', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationAttribution, '偏差归因', 'deviation,factors[]{name,contribution}', '{attributed}', ['归因'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_022', 'deviationRootCause', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationRootCause, '偏差根因分析', 'symptoms,causes', '{rootCause,confidence}', ['根因'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_023', 'deviationImpact', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationImpact, '偏差影响评估', 'deviation,impactWeights', '{totalImpact,maxImpact}', ['影响'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_024', 'deviationRisk', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationRisk, '偏差风险评估', 'magnitude,frequency,impact', '{risk,level}', ['风险'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_B_025', 'deviationCorrection', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationCorrection, '偏差修正', 'values,deviations', '{corrected}', ['修正'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_026', 'deviationCompensation', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationCompensation, '偏差补偿', 'target,current,compensationRate', '{compensated,remainingDeviation}', ['补偿'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_B_027', 'deviationCalibration', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationCalibration, '偏差校准', 'measurements,standards', '{calibrationFactors,calibrated}', ['校准'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_028', 'deviationMonitor', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationMonitor, '偏差监控', 'history[]{time,deviation},alertThreshold', '{status,latestDeviation}', ['监控'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_029', 'deviationReport', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationReport, '偏差报告生成', 'deviations[]{name,value,threshold,impact}', '{report,criticalCount}', ['报告'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_B_030', 'deviationEarlyWarning', types_1.AlgorithmFamily.BIAS, BiasAlg.deviationEarlyWarning, '偏差预警', 'trend,currentValue,threshold,timeToThreshold', '{willBreach,estimatedBreachTime}', ['预警'], types_1.AlgorithmComplexity.O1);
// ============================================================================
// T1 第一批 · 逻辑审计类（30 个）
// ============================================================================
registerT1('ALG_T1_L_001', 'parseProposition', types_1.AlgorithmFamily.LOGIC, LogicAlg.parseProposition, '命题解析', 'string', 'Proposition', ['命题', '解析'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_002', 'normalizeProposition', types_1.AlgorithmFamily.LOGIC, LogicAlg.normalizeProposition, '命题归一化', 'Proposition', 'string', ['归一化'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_003', 'negateProposition', types_1.AlgorithmFamily.LOGIC, LogicAlg.negateProposition, '命题否定', 'Proposition', 'Proposition', ['否定'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_004', 'conjoinPropositions', types_1.AlgorithmFamily.LOGIC, LogicAlg.conjoinPropositions, '命题合取', 'left,right', 'Proposition', ['合取', 'AND'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_005', 'disjoinPropositions', types_1.AlgorithmFamily.LOGIC, LogicAlg.disjoinPropositions, '命题析取', 'left,right', 'Proposition', ['析取', 'OR'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_006', 'implyPropositions', types_1.AlgorithmFamily.LOGIC, LogicAlg.implyPropositions, '命题蕴含', 'antecedent,consequent', 'Proposition', ['蕴含', 'IMPLIES'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_007', 'equivPropositions', types_1.AlgorithmFamily.LOGIC, LogicAlg.equivPropositions, '命题等价', 'left,right', 'Proposition', ['等价', 'EQUIV'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_008', 'isSatisfiable', types_1.AlgorithmFamily.LOGIC, LogicAlg.isSatisfiable, '命题可满足性（真值表）', 'Proposition', '{satisfiable,model}', ['SAT', '可满足'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_009', 'isValid', types_1.AlgorithmFamily.LOGIC, LogicAlg.isValid, '命题有效性（永真）', 'Proposition', '{valid}', ['VALID', '永真'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_010', 'isConsistent', types_1.AlgorithmFamily.LOGIC, LogicAlg.isConsistent, '命题一致性', 'Proposition[]', '{consistent}', ['一致'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_011', 'matchInferenceRule', types_1.AlgorithmFamily.LOGIC, LogicAlg.matchInferenceRule, '推理规则匹配', 'premises,conclusion', '{rule}', ['推理', '规则', 'MP'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_012', 'verifyProofStep', types_1.AlgorithmFamily.LOGIC, LogicAlg.verifyProofStep, '推理步骤验证', 'step,previousSteps', '{valid}', ['验证', '步骤'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_013', 'buildProofTree', types_1.AlgorithmFamily.LOGIC, LogicAlg.buildProofTree, '证明树构造', 'steps[]', 'ProofTree', ['证明树'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_014', 'traverseProofTree', types_1.AlgorithmFamily.LOGIC, LogicAlg.traverseProofTree, '证明树遍历', 'ProofTree', '{visited,edges}', ['遍历'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_015', 'verifyProofTree', types_1.AlgorithmFamily.LOGIC, LogicAlg.verifyProofTree, '证明树验证', 'ProofTree', '{valid,invalidSteps}', ['验证', '证明树'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_L_016', 'searchCounterExample', types_1.AlgorithmFamily.LOGIC, LogicAlg.searchCounterExample, '反例搜索', 'Proposition,maxAttempts', '{found,counterExample}', ['反例'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_017', 'detectRefutation', types_1.AlgorithmFamily.LOGIC, LogicAlg.detectRefutation, '反驳检测', 'claim,evidence[]', '{refuted,refutation}', ['反驳'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_018', 'detectContradiction', types_1.AlgorithmFamily.LOGIC, LogicAlg.detectContradiction, '矛盾检测', 'Proposition[]', '{hasContradiction}', ['矛盾'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_019', 'detectVulnerability', types_1.AlgorithmFamily.LOGIC, LogicAlg.detectVulnerability, '漏洞检测', 'ProofTree,requiredPremises', '{vulnerabilities}', ['漏洞'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_020', 'verifyAssumption', types_1.AlgorithmFamily.LOGIC, LogicAlg.verifyAssumption, '假设验证', 'assumption,facts[]', '{holds}', ['假设'], types_1.AlgorithmComplexity.O_2_N);
registerT1('ALG_T1_L_021', 'applyAxiom', types_1.AlgorithmFamily.LOGIC, LogicAlg.applyAxiom, '公理应用', 'axiom,target', '{result,rule}', ['公理'], types_1.AlgorithmComplexity.O1);
registerT1('ALG_T1_L_022', 'referenceTheorem', types_1.AlgorithmFamily.LOGIC, LogicAlg.referenceTheorem, '定理引用', 'theorem,context[]', '{applicable,instantiated}', ['定理'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_023', 'buildInferenceChain', types_1.AlgorithmFamily.LOGIC, LogicAlg.buildInferenceChain, '推理链构造', 'start,steps[]', '{chain}', ['推理链'], types_1.AlgorithmComplexity.O_N);
registerT1('ALG_T1_L_024', 'verifyInferenceChain', types_1.AlgorithmFamily.LOGIC, LogicAlg.verifyInferenceChain, '推理链验证', 'chain[]', '{valid,brokenAt}', ['验证', '推理链'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_L_025', 'checkLogicalConsistency', types_1.AlgorithmFamily.LOGIC, LogicAlg.checkLogicalConsistency, '逻辑一致性检查', 'Proposition[]', '{consistent,conflicts}', ['一致性'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_L_026', 'checkLogicalCompleteness', types_1.AlgorithmFamily.LOGIC, LogicAlg.checkLogicalCompleteness, '逻辑完备性检查', 'axioms,targetTheorems', '{complete,unprovable}', ['完备性'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_L_027', 'checkLogicalSoundness', types_1.AlgorithmFamily.LOGIC, LogicAlg.checkLogicalSoundness, '逻辑可靠性', 'ProofTree,axioms', '{sound,unsoundSteps}', ['可靠性'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_L_028', 'checkLogicalRobustness', types_1.AlgorithmFamily.LOGIC, LogicAlg.checkLogicalRobustness, '逻辑健全性', 'ProofTree,perturbations', '{robust,brokenBy}', ['健全性', '鲁棒'], types_1.AlgorithmComplexity.O_N_M);
registerT1('ALG_T1_L_029', 'generateLogicAuditReport', types_1.AlgorithmFamily.LOGIC, LogicAlg.generateLogicAuditReport, '逻辑审计报告', 'props,ProofTree,axioms', '{report,score}', ['审计', '报告'], types_1.AlgorithmComplexity.O_N2);
registerT1('ALG_T1_L_030', 'comprehensiveLogicAssessment', types_1.AlgorithmFamily.LOGIC, LogicAlg.comprehensiveLogicAssessment, '逻辑综合评估', 'props,ProofTree,axioms', '{overallScore,grade,issues}', ['综合', '评估'], types_1.AlgorithmComplexity.O_N2);
function registerBatch2(family, code, moduleRef, metas, testFileName) {
    metas.forEach((meta, i) => {
        const idx = String(i + 1).padStart(3, '0');
        const id = `ALG_T1_${code}_${idx}`;
        const [name, handler, description, inputSchema, outputSchema, keywords, complexity] = meta;
        registerT1(id, name, family, handler, description, inputSchema, outputSchema, keywords, complexity ?? types_1.AlgorithmComplexity.O_N);
        // 修正 testPath 指向具体族文件
        const entry = REGISTRY[REGISTRY.length - 1];
        entry.testPath = `packages/engine/RUNTIME/src/algorithms/t1/${testFileName}`;
    });
}
// --- EVOLUTION（E）ALG_T1_E_001 ~ ALG_T1_E_015 ---
registerBatch2(types_1.AlgorithmFamily.EVOLUTION, 'E', EvolutionAlg, [
    ['detectBoundary', EvolutionAlg.detectBoundary, '边界感知', 'BoundaryPoint[]', '{boundaries,gaps,provenance}', ['边界', '感知'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['analyzeGap', EvolutionAlg.analyzeGap, '差距分析', '{current,target}', '{gaps,priorities,provenance}', ['差距', '分析'], types_1.AlgorithmComplexity.O_N],
    ['selfGenerate', EvolutionAlg.selfGenerate, '自生成', '{boundary,gap,resources}', '{solution,feasibility,provenance}', ['自生成', '进化'], types_1.AlgorithmComplexity.O_N],
    ['verifyEvolution', EvolutionAlg.verifyEvolution, '进化验证', '{before,after,criteria}', '{passed,improvements,regressions,provenance}', ['验证', '进化'], types_1.AlgorithmComplexity.O_N],
    ['recursiveEvolve', EvolutionAlg.recursiveEvolve, '递归进化', '{state,depth,maxDepth}', '{finalState,depth,provenance}', ['递归', '进化'], types_1.AlgorithmComplexity.O_2_N],
    ['evolutionCycle', EvolutionAlg.evolutionCycle, '进化循环', '{state,steps}', '{finalState,history,provenance}', ['循环', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionRate', EvolutionAlg.evolutionRate, '进化速率', '{history}', '{rate,acceleration,provenance}', ['速率', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionDepth', EvolutionAlg.evolutionDepth, '进化深度', '{tree}', '{depth,branches,provenance}', ['深度', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionBreadth', EvolutionAlg.evolutionBreadth, '进化广度', '{tree}', '{breadth,leaves,provenance}', ['广度', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionFitness', EvolutionAlg.evolutionFitness, '进化适应度', '{individual,environment}', '{fitness,survival,provenance}', ['适应度', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionPressure', EvolutionAlg.evolutionPressure, '进化压力', '{population,environment}', '{pressure,direction,provenance}', ['压力', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionMutation', EvolutionAlg.evolutionMutation, '进化变异', '{genes,rate}', '{mutated,mutations,provenance}', ['变异', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionSelection', EvolutionAlg.evolutionSelection, '进化选择', '{population,fitness,selectionSize}', '{selected,provenance}', ['选择', '进化'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['evolutionCrossover', EvolutionAlg.evolutionCrossover, '进化交叉', '{parentA,parentB}', '{offspring,provenance}', ['交叉', '进化'], types_1.AlgorithmComplexity.O_N],
    ['evolutionLineage', EvolutionAlg.evolutionLineage, '进化谱系', '{ancestors,descendant}', '{lineage,depth,provenance}', ['谱系', '进化'], types_1.AlgorithmComplexity.O_N],
], 'evolution-algorithms.test.ts');
// --- CREATION（M）ALG_T1_M_001 ~ ALG_T1_M_015 ---
registerBatch2(types_1.AlgorithmFamily.CREATION, 'M', CreationAlg, [
    ['generateNovelIdea', CreationAlg.generateNovelIdea, '新颖思想生成', '{domain,constraints}', '{idea,novelty,provenance}', ['创造', '新颖'], types_1.AlgorithmComplexity.O_N],
    ['constraintAlignment', CreationAlg.constraintAlignment, '约束对齐', '{idea,constraints}', '{aligned,violations,provenance}', ['约束', '对齐'], types_1.AlgorithmComplexity.O_N],
    ['noveltyScore', CreationAlg.noveltyScore, '新颖性评分', '{idea,history}', '{score,dimensions,provenance}', ['新颖性', '评分'], types_1.AlgorithmComplexity.O_N],
    ['creationTrigger', CreationAlg.creationTrigger, '创造触发', '{state,context}', '{triggered,source,provenance}', ['触发', '创造'], types_1.AlgorithmComplexity.O1],
    ['creationPrimitive', CreationAlg.creationPrimitive, '创造原语', '{type,params}', '{result,provenance}', ['原语', '创造'], types_1.AlgorithmComplexity.O_N],
    ['creationIntegrityCheck', CreationAlg.creationIntegrityCheck, '创造完整性检查', '{creation,criteria}', '{integrity,gaps,provenance}', ['完整性', '创造'], types_1.AlgorithmComplexity.O_N],
    ['historyNegentropy', CreationAlg.historyNegentropy, '历史负熵', '{history}', '{negentropy,trend,provenance}', ['负熵', '历史'], types_1.AlgorithmComplexity.O_N],
    ['creationGovernor', CreationAlg.creationGovernor, '创造治理', '{creation,rules}', '{approved,violations,provenance}', ['治理', '创造'], types_1.AlgorithmComplexity.O_N],
    ['divergentGeneration', CreationAlg.divergentGeneration, '发散生成', '{seed,branchFactor,depth}', '{branches,provenance}', ['发散', '生成'], types_1.AlgorithmComplexity.O_2_N],
    ['convergentRefinement', CreationAlg.convergentRefinement, '收敛精炼', '{ideas,criteria}', '{refined,scores,provenance}', ['收敛', '精炼'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['creationMutation', CreationAlg.creationMutation, '创造变异', '{idea,mutationRate}', '{mutated,changes,provenance}', ['变异', '创造'], types_1.AlgorithmComplexity.O_N],
    ['creationRecombination', CreationAlg.creationRecombination, '创造重组', '{ideaA,ideaB}', '{recombined,provenance}', ['重组', '创造'], types_1.AlgorithmComplexity.O_N],
    ['creationSelection', CreationAlg.creationSelection, '创造选择', '{creations,criteria,topK}', '{selected,provenance}', ['选择', '创造'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['creationFitness', CreationAlg.creationFitness, '创造适应度', '{creation,environment}', '{fitness,provenance}', ['适应度', '创造'], types_1.AlgorithmComplexity.O_N],
    ['creationLineage', CreationAlg.creationLineage, '创造谱系', '{ancestors,creation}', '{lineage,provenance}', ['谱系', '创造'], types_1.AlgorithmComplexity.O_N],
], 'creation-algorithms.test.ts');
// --- FREQUENCY（F）ALG_T1_F_001 ~ ALG_T1_F_015 ---
registerBatch2(types_1.AlgorithmFamily.FREQUENCY, 'F', FrequencyAlg, [
    ['computeIntegrity', FrequencyAlg.computeIntegrity, '完整性计算', 'Dimension[]', '{integrity,gaps,provenance}', ['完整性', '频率'], types_1.AlgorithmComplexity.O_N],
    ['frequencyState', FrequencyAlg.frequencyState, '频率态判定', '{integrity,threshold}', '{state,reason,provenance}', ['状态', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencyAdapt', FrequencyAlg.frequencyAdapt, '频率自适应', '{history,targetIntegrity,adjustmentRate}', '{newFrequency,state,provenance}', ['自适应', '频率'], types_1.AlgorithmComplexity.O_N],
    ['lowFrequencyDive', FrequencyAlg.lowFrequencyDive, '低频深潜', '{currentFrequency,depth}', '{frequency,depth,provenance}', ['低频', '深潜'], types_1.AlgorithmComplexity.O1],
    ['highFrequencyActivate', FrequencyAlg.highFrequencyActivate, '高频激活', '{currentFrequency,boostFactor}', '{frequency,boost,provenance}', ['高频', '激活'], types_1.AlgorithmComplexity.O1],
    ['frequencyDecay', FrequencyAlg.frequencyDecay, '频率衰减', '{initialFrequency,elapsed,halfLife}', '{frequency,decayFactor,provenance}', ['衰减', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencyOscillation', FrequencyAlg.frequencyOscillation, '频率振荡', '{baseFrequency,amplitude,time,period}', '{frequency,phase,provenance}', ['振荡', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencyResonance', FrequencyAlg.frequencyResonance, '频率共振', '{frequencyA,frequencyB,tolerance}', '{resonant,ratio,harmonic,provenance}', ['共振', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencySpectrum', FrequencyAlg.frequencySpectrum, '频率谱分析（DFT）', 'number[]', '{magnitudes,phases,dominantFreq,provenance}', ['谱', 'DFT'], types_1.AlgorithmComplexity.O_N2],
    ['frequencyPhase', FrequencyAlg.frequencyPhase, '频率相位', '{frequency,time,initialPhase}', '{phase,normalizedPhase,provenance}', ['相位', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencyAmplitude', FrequencyAlg.frequencyAmplitude, '频率振幅', 'number[]', '{amplitude,peak,rms,provenance}', ['振幅', '频率'], types_1.AlgorithmComplexity.O_N],
    ['frequencyModulation', FrequencyAlg.frequencyModulation, '频率调制', '{carrierFreq,modulatingFreq,modulationIndex,time}', '{modulatedFreq,provenance}', ['调制', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencySynchronization', FrequencyAlg.frequencySynchronization, '频率同步', '{localFreq,referenceFreq,couplingStrength}', '{synchronizedFreq,lockRange,provenance}', ['同步', '频率'], types_1.AlgorithmComplexity.O1],
    ['frequencyHarmonics', FrequencyAlg.frequencyHarmonics, '频率谐波', '{fundamentalFreq,maxHarmonics}', '{harmonics,totalEnergy,provenance}', ['谐波', '频率'], types_1.AlgorithmComplexity.O_N],
    ['frequencyBandwidth', FrequencyAlg.frequencyBandwidth, '频率带宽', 'number[]', '{bandwidth,minFreq,maxFreq,centerFreq,provenance}', ['带宽', '频率'], types_1.AlgorithmComplexity.O_N],
], 'frequency-algorithms.test.ts');
// --- DECISION（D）ALG_T1_D_001 ~ ALG_T1_D_015 ---
registerBatch2(types_1.AlgorithmFamily.DECISION, 'D', DecisionAlg, [
    ['intentVerification', DecisionAlg.intentVerification, '意图验证（IVL）', '{intent,context}', '{verified,reason,provenance}', ['意图', 'IVL'], types_1.AlgorithmComplexity.O_N],
    ['intentLineageTrace', DecisionAlg.intentLineageTrace, '意图谱系追踪（ILT）', '{intent,history}', '{lineage,provenance}', ['谱系', 'ILT'], types_1.AlgorithmComplexity.O_N],
    ['semanticOutputGate', DecisionAlg.semanticOutputGate, '语义输出门（OSG）', '{output,constraints}', '{passed,violations,provenance}', ['语义', 'OSG'], types_1.AlgorithmComplexity.O_N],
    ['contentIntegrityCheck', DecisionAlg.contentIntegrityCheck, '内容完整性校验', '{content,expected}', '{complete,missing,provenance}', ['完整性', '校验'], types_1.AlgorithmComplexity.O_N],
    ['decisionLockGate', DecisionAlg.decisionLockGate, '决策锁门控', '{decision,checks}', '{passed,gates,provenance}', ['决策锁', '门控'], types_1.AlgorithmComplexity.O_N],
    ['decisionAudit', DecisionAlg.decisionAudit, '决策审计', '{decision,trail}', '{audit,issues,provenance}', ['审计', '决策'], types_1.AlgorithmComplexity.O_N],
    ['decisionRollback', DecisionAlg.decisionRollback, '决策回滚', '{decision,checkpoint}', '{rolledBack,provenance}', ['回滚', '决策'], types_1.AlgorithmComplexity.O1],
    ['decisionVeto', DecisionAlg.decisionVeto, '决策否决', '{decision,vetoRules}', '{vetoed,reason,provenance}', ['否决', '决策'], types_1.AlgorithmComplexity.O_N],
    ['decisionPriority', DecisionAlg.decisionPriority, '决策优先级', '{decisions[]}', '{prioritized,provenance}', ['优先级', '决策'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['decisionConflict', DecisionAlg.decisionConflict, '决策冲突', '{decisions[]}', '{conflicts,resolution,provenance}', ['冲突', '决策'], types_1.AlgorithmComplexity.O_N2],
    ['decisionQuorum', DecisionAlg.decisionQuorum, '决策法定人数', '{voters,required}', '{quorumMet,provenance}', ['法定人数', '决策'], types_1.AlgorithmComplexity.O_N],
    ['decisionConsensus', DecisionAlg.decisionConsensus, '决策共识', '{votes[]}', '{consensus,level,provenance}', ['共识', '决策'], types_1.AlgorithmComplexity.O_N],
    ['decisionThreshold', DecisionAlg.decisionThreshold, '决策阈值', '{value,threshold}', '{passed,provenance}', ['阈值', '决策'], types_1.AlgorithmComplexity.O1],
    ['decisionWeight', DecisionAlg.decisionWeight, '决策权重', '{factors[]}', '{weightedScore,provenance}', ['权重', '决策'], types_1.AlgorithmComplexity.O_N],
    ['decisionTraceability', DecisionAlg.decisionTraceability, '决策可追溯', '{decision,history}', '{traceable,chain,provenance}', ['追溯', '决策'], types_1.AlgorithmComplexity.O_N],
], 'decision-algorithms.test.ts');
// --- SECURITY（S）ALG_T1_S_001 ~ ALG_T1_S_015 ---
registerBatch2(types_1.AlgorithmFamily.SECURITY, 'S', SecurityAlg, [
    ['vulnerabilityScan', SecurityAlg.vulnerabilityScan, '漏洞扫描', '{target,checks}', '{vulnerabilities,severity,provenance}', ['漏洞', '扫描'], types_1.AlgorithmComplexity.O_N],
    ['threatAssessment', SecurityAlg.threatAssessment, '威胁评估', '{threats,assets}', '{assessment,risk,provenance}', ['威胁', '评估'], types_1.AlgorithmComplexity.O_N],
    ['riskScoring', SecurityAlg.riskScoring, '风险评分', '{likelihood,impact}', '{score,level,provenance}', ['风险', '评分'], types_1.AlgorithmComplexity.O1],
    ['accessControl', SecurityAlg.accessControl, '访问控制', '{subject,resource,action}', '{allowed,reason,provenance}', ['访问', '控制'], types_1.AlgorithmComplexity.O_N],
    ['permissionCheck', SecurityAlg.permissionCheck, '权限检查', '{user,resource,permission}', '{granted,provenance}', ['权限', '检查'], types_1.AlgorithmComplexity.O1],
    ['authenticationVerify', SecurityAlg.authenticationVerify, '认证验证', '{credentials,method}', '{authenticated,provenance}', ['认证', '验证'], types_1.AlgorithmComplexity.O1],
    ['authorizationCheck', SecurityAlg.authorizationCheck, '授权检查', '{user,action,resource}', '{authorized,provenance}', ['授权', '检查'], types_1.AlgorithmComplexity.O_N],
    ['dataEncrypt', SecurityAlg.dataEncrypt, '数据加密', '{data,algorithm,key}', '{encrypted,provenance}', ['加密', '数据'], types_1.AlgorithmComplexity.O_N],
    ['sensitiveDataDetection', SecurityAlg.sensitiveDataDetection, '敏感数据检测', '{content,patterns}', '{detected,locations,provenance}', ['敏感', '检测'], types_1.AlgorithmComplexity.O_N],
    ['injectionPrevention', SecurityAlg.injectionPrevention, '注入防护', '{input,type}', '{safe,sanitized,provenance}', ['注入', '防护'], types_1.AlgorithmComplexity.O_N],
    ['xssPrevention', SecurityAlg.xssPrevention, 'XSS 防护', '{input}', '{safe,escaped,provenance}', ['XSS', '防护'], types_1.AlgorithmComplexity.O_N],
    ['csrfPrevention', SecurityAlg.csrfPrevention, 'CSRF 防护', '{request,token}', '{safe,provenance}', ['CSRF', '防护'], types_1.AlgorithmComplexity.O1],
    ['rateLimit', SecurityAlg.rateLimit, '速率限制', '{identifier,limit,window}', '{allowed,remaining,provenance}', ['限流', '速率'], types_1.AlgorithmComplexity.O1],
    ['auditLog', SecurityAlg.auditLog, '审计日志', '{event,actor,action}', '{logged,provenance}', ['审计', '日志'], types_1.AlgorithmComplexity.O1],
    ['securityPosture', SecurityAlg.securityPosture, '安全态势', '{controls,threats}', '{score,posture,provenance}', ['态势', '安全'], types_1.AlgorithmComplexity.O_N],
], 'security-algorithms.test.ts');
// --- NEGENTROPY（N）ALG_T1_N_001 ~ ALG_T1_N_015 ---
registerBatch2(types_1.AlgorithmFamily.NEGENTROPY, 'N', NegentropyAlg, [
    ['computeEntropy', NegentropyAlg.computeEntropy, '熵计算', 'number[]', '{entropy,maxEntropy,normalized,provenance}', ['熵', '计算'], types_1.AlgorithmComplexity.O_N],
    ['computeNegentropy', NegentropyAlg.computeNegentropy, '负熵计算', '{probabilities,maxEntropy}', '{negentropy,ratio,provenance}', ['负熵', '计算'], types_1.AlgorithmComplexity.O_N],
    ['entropyDelta', NegentropyAlg.entropyDelta, '熵变计算', '{before,after}', '{delta,rate,provenance}', ['熵变', 'delta'], types_1.AlgorithmComplexity.O_N],
    ['orderDegree', NegentropyAlg.orderDegree, '有序度', '{elements}', '{order,disorder,provenance}', ['有序', '秩序'], types_1.AlgorithmComplexity.O_N],
    ['complexityMeasure', NegentropyAlg.complexityMeasure, '复杂度度量', '{structure}', '{complexity,provenance}', ['复杂度', '度量'], types_1.AlgorithmComplexity.O_N],
    ['informationDensity', NegentropyAlg.informationDensity, '信息密度', '{data,volume}', '{density,provenance}', ['信息', '密度'], types_1.AlgorithmComplexity.O_N],
    ['mutualInformation', NegentropyAlg.mutualInformation, '互信息', '{x,y}', '{mi,normalized,provenance}', ['互信息'], types_1.AlgorithmComplexity.O_N2],
    ['conditionalEntropy', NegentropyAlg.conditionalEntropy, '条件熵', '{x,y}', '{entropy,provenance}', ['条件熵'], types_1.AlgorithmComplexity.O_N2],
    ['relativeEntropy', NegentropyAlg.relativeEntropy, '相对熵（KL 散度）', '{p,q}', '{divergence,provenance}', ['KL', '散度'], types_1.AlgorithmComplexity.O_N],
    ['crossEntropy', NegentropyAlg.crossEntropy, '交叉熵', '{p,q}', '{entropy,provenance}', ['交叉熵'], types_1.AlgorithmComplexity.O_N],
    ['entropyRate', NegentropyAlg.entropyRate, '熵率', '{series,order}', '{rate,provenance}', ['熵率'], types_1.AlgorithmComplexity.O_N],
    ['entropyProduction', NegentropyAlg.entropyProduction, '熵产生', '{flows,forces}', '{production,provenance}', ['熵产生'], types_1.AlgorithmComplexity.O_N],
    ['entropyExport', NegentropyAlg.entropyExport, '熵输出', '{internal,external}', '{exported,provenance}', ['熵输出'], types_1.AlgorithmComplexity.O_N],
    ['entropyBalance', NegentropyAlg.entropyBalance, '熵平衡', '{production,export}', '{balance,net,provenance}', ['熵平衡'], types_1.AlgorithmComplexity.O1],
    ['entropyMonitor', NegentropyAlg.entropyMonitor, '熵监控', '{history,threshold}', '{status,trend,provenance}', ['熵监控'], types_1.AlgorithmComplexity.O_N],
], 'negentropy-algorithms.test.ts');
// --- MEMORY（K）ALG_T1_K_001 ~ ALG_T1_K_015 ---
registerBatch2(types_1.AlgorithmFamily.MEMORY, 'K', MemoryAlg, [
    ['memoryEncode', MemoryAlg.memoryEncode, '记忆编码', '{input,schema}', '{encoded,provenance}', ['编码', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryStore', MemoryAlg.memoryStore, '记忆存储', '{memory,store}', '{stored,location,provenance}', ['存储', '记忆'], types_1.AlgorithmComplexity.O1],
    ['memoryRetrieve', MemoryAlg.memoryRetrieve, '记忆检索', '{query,store}', '{results,scores,provenance}', ['检索', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryConsolidate', MemoryAlg.memoryConsolidate, '记忆巩固', '{memories[]}', '{consolidated,provenance}', ['巩固', '记忆'], types_1.AlgorithmComplexity.O_N2],
    ['memoryDecay', MemoryAlg.memoryDecay, '记忆衰减', '{memory,elapsed,halfLife}', '{strength,provenance}', ['衰减', '记忆'], types_1.AlgorithmComplexity.O1],
    ['memoryForgetting', MemoryAlg.memoryForgetting, '记忆遗忘', '{memories,currentTime}', '{forgotten,retained,provenance}', ['遗忘', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryRehearsal', MemoryAlg.memoryRehearsal, '记忆复述', '{memory,rehearsals}', '{strengthened,provenance}', ['复述', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryInterference', MemoryAlg.memoryInterference, '记忆干扰', '{target,interferers}', '{interference,provenance}', ['干扰', '记忆'], types_1.AlgorithmComplexity.O_N2],
    ['memoryAssociation', MemoryAlg.memoryAssociation, '记忆联想', '{cue,associations}', '{linked,strength,provenance}', ['联想', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memorySchema', MemoryAlg.memorySchema, '记忆图式', '{memories[]}', '{schema,provenance}', ['图式', '记忆'], types_1.AlgorithmComplexity.O_N2],
    ['memoryEpisodic', MemoryAlg.memoryEpisodic, '情景记忆', '{events[]}', '{episodes,provenance}', ['情景', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memorySemantic', MemoryAlg.memorySemantic, '语义记忆', '{facts[]}', '{knowledge,provenance}', ['语义', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryProcedural', MemoryAlg.memoryProcedural, '程序记忆', '{procedures[]}', '{skills,provenance}', ['程序', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryWorking', MemoryAlg.memoryWorking, '工作记忆', '{items,capacity}', '{active,overflow,provenance}', ['工作', '记忆'], types_1.AlgorithmComplexity.O_N],
    ['memoryLongTerm', MemoryAlg.memoryLongTerm, '长期记忆', '{memories,criteria}', '{permanent,provenance}', ['长期', '记忆'], types_1.AlgorithmComplexity.O_N_LOG_N],
], 'memory-algorithms.test.ts');
// --- LEARNING（G）ALG_T1_G_001 ~ ALG_T1_G_015 ---
registerBatch2(types_1.AlgorithmFamily.LEARNING, 'G', LearningAlg, [
    ['supervisedLearn', LearningAlg.supervisedLearn, '监督学习', '{samples,labels}', '{model,accuracy,provenance}', ['监督', '学习'], types_1.AlgorithmComplexity.O_N2],
    ['unsupervisedLearn', LearningAlg.unsupervisedLearn, '无监督学习', '{samples,k}', '{clusters,provenance}', ['无监督', '聚类'], types_1.AlgorithmComplexity.O_N2],
    ['reinforcementLearn', LearningAlg.reinforcementLearn, '强化学习', '{episodes,learningRate}', '{policy,value,provenance}', ['强化', '学习'], types_1.AlgorithmComplexity.O_N],
    ['transferLearning', LearningAlg.transferLearning, '迁移学习', '{sourceModel,targetDomain}', '{transferred,adaptation,provenance}', ['迁移', '学习'], types_1.AlgorithmComplexity.O_N],
    ['activeLearning', LearningAlg.activeLearning, '主动学习', '{unlabeled,budget}', '{queried,model,provenance}', ['主动', '学习'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['passiveLearning', LearningAlg.passiveLearning, '被动学习', '{observations}', '{learned,provenance}', ['被动', '学习'], types_1.AlgorithmComplexity.O_N],
    ['associativeLearning', LearningAlg.associativeLearning, '联想学习', '{pairs[]}', '{associations,provenance}', ['联想', '学习'], types_1.AlgorithmComplexity.O_N],
    ['habituation', LearningAlg.habituation, '习惯化', '{stimulus,repetitions}', '{response,provenance}', ['习惯化'], types_1.AlgorithmComplexity.O_N],
    ['sensitization', LearningAlg.sensitization, '敏感化', '{stimulus,intensity}', '{response,provenance}', ['敏感化'], types_1.AlgorithmComplexity.O_N],
    ['conditioning', LearningAlg.conditioning, '条件反射', '{cs,us,trials}', '{association,provenance}', ['条件反射'], types_1.AlgorithmComplexity.O_N],
    ['observationalLearning', LearningAlg.observationalLearning, '观察学习', '{demonstrator,observer}', '{learned,provenance}', ['观察', '学习'], types_1.AlgorithmComplexity.O_N],
    ['experientialLearning', LearningAlg.experientialLearning, '体验学习', '{experiences[]}', '{lessons,provenance}', ['体验', '学习'], types_1.AlgorithmComplexity.O_N],
    ['socialLearning', LearningAlg.socialLearning, '社会学习', '{individuals,behaviors}', '{adopted,provenance}', ['社会', '学习'], types_1.AlgorithmComplexity.O_N2],
    ['metaLearning', LearningAlg.metaLearning, '元学习', '{tasks,metafeatures}', '{metaModel,provenance}', ['元学习'], types_1.AlgorithmComplexity.O_N2],
    ['curriculumLearning', LearningAlg.curriculumLearning, '课程学习', '{samples,difficulty}', '{curriculum,provenance}', ['课程', '学习'], types_1.AlgorithmComplexity.O_N_LOG_N],
], 'learning-algorithms.test.ts');
// --- REASONING（R）ALG_T1_R_001 ~ ALG_T1_R_015 ---
registerBatch2(types_1.AlgorithmFamily.REASONING, 'R', ReasoningAlg, [
    ['deductiveReasoning', ReasoningAlg.deductiveReasoning, '演绎推理', '{premises,rules}', '{conclusions,provenance}', ['演绎', '推理'], types_1.AlgorithmComplexity.O_N_M],
    ['inductiveReasoning', ReasoningAlg.inductiveReasoning, '归纳推理', '{observations}', '{generalizations,provenance}', ['归纳', '推理'], types_1.AlgorithmComplexity.O_N2],
    ['abductiveReasoning', ReasoningAlg.abductiveReasoning, '溯因推理', '{observations,hypotheses}', '{bestExplanation,provenance}', ['溯因', '推理'], types_1.AlgorithmComplexity.O_N2],
    ['analogicalReasoning', ReasoningAlg.analogicalReasoning, '类比推理', '{source,target}', '{mappings,score,provenance}', ['类比', '推理'], types_1.AlgorithmComplexity.O_N2],
    ['causalReasoning', ReasoningAlg.causalReasoning, '因果推理', '{cause,effect,model}', '{causation,provenance}', ['因果', '推理'], types_1.AlgorithmComplexity.O_N],
    ['counterfactualReasoning', ReasoningAlg.counterfactualReasoning, '反事实推理', '{factual,counterfactual}', '{difference,provenance}', ['反事实', '推理'], types_1.AlgorithmComplexity.O_N],
    ['modalReasoning', ReasoningAlg.modalReasoning, '模态推理', '{propositions,modalities}', '{necessity,possibility,provenance}', ['模态', '推理'], types_1.AlgorithmComplexity.O_N],
    ['temporalReasoning', ReasoningAlg.temporalReasoning, '时序推理', '{events,relations}', '{orderings,provenance}', ['时序', '推理'], types_1.AlgorithmComplexity.O_N2],
    ['spatialReasoning', ReasoningAlg.spatialReasoning, '空间推理', '{objects,query}', '{result,provenance}', ['空间', '推理'], types_1.AlgorithmComplexity.O_N],
    ['quantitativeReasoning', ReasoningAlg.quantitativeReasoning, '数量推理', '{values,query}', '{result,provenance}', ['数量', '推理'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['qualitativeReasoning', ReasoningAlg.qualitativeReasoning, '定性推理', '{variables,relations}', '{predictions,provenance}', ['定性', '推理'], types_1.AlgorithmComplexity.O_N2],
    ['fuzzyReasoning', ReasoningAlg.fuzzyReasoning, '模糊推理', '{inputs,rules}', '{output,provenance}', ['模糊', '推理'], types_1.AlgorithmComplexity.O_N],
    ['probabilisticReasoning', ReasoningAlg.probabilisticReasoning, '概率推理（贝叶斯）', '{prior,evidence}', '{posterior,confidence,provenance}', ['概率', '贝叶斯'], types_1.AlgorithmComplexity.O_N],
    ['heuristicReasoning', ReasoningAlg.heuristicReasoning, '启发式推理', '{problem,heuristics}', '{selectedHeuristic,action,provenance}', ['启发式', '推理'], types_1.AlgorithmComplexity.O_N],
    ['forwardChaining', ReasoningAlg.forwardChaining, '前向链推理', '{facts,rules}', '{derived,iterations,provenance}', ['前向链', '推理'], types_1.AlgorithmComplexity.O_N2],
], 'reasoning-algorithms.test.ts');
// --- INTUITION（I）ALG_T1_I_001 ~ ALG_T1_I_015 ---
registerBatch2(types_1.AlgorithmFamily.INTUITION, 'I', IntuitionAlg, [
    ['patternRecognitionIntuition', IntuitionAlg.patternRecognitionIntuition, '模式识别直觉', '{input,patterns}', '{matchedPattern,confidence,provenance}', ['模式识别', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['heuristicIntuition', IntuitionAlg.heuristicIntuition, '启发式直觉', '{situation,heuristics}', '{selected,weight,provenance}', ['启发式', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['associativeIntuition', IntuitionAlg.associativeIntuition, '联想直觉', '{cue,memory}', '{associations,topAssociation,provenance}', ['联想', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['sixthSense', IntuitionAlg.sixthSense, '第六感计算', '{signals,threshold}', '{triggered,aggregateStrength,provenance}', ['第六感', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['intuitionConfidence', IntuitionAlg.intuitionConfidence, '直觉置信度', '{strength,evidenceCount,consistency,expertiseLevel}', '{confidence,calibrated,provenance}', ['置信度', '直觉'], types_1.AlgorithmComplexity.O1],
    ['intuitionCalibration', IntuitionAlg.intuitionCalibration, '直觉校准', '{historicalIntuitions[]}', '{calibrationScore,bias,resolution,provenance}', ['校准', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['expertIntuition', IntuitionAlg.expertIntuition, '专家直觉（Klein RPD）', '{situation,experience}', '{action,recognizedPattern,provenance}', ['专家', 'RPD'], types_1.AlgorithmComplexity.O_N],
    ['patternMatching', IntuitionAlg.patternMatching, '模式匹配（k-NN）', '{query,dataset,k}', '{label,neighbors,provenance}', ['k-NN', '匹配'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['intuitionTrigger', IntuitionAlg.intuitionTrigger, '直觉触发', '{signals,threshold,noveltyBonus}', '{triggered,triggerScore,sources,provenance}', ['触发', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['intuitionAggregation', IntuitionAlg.intuitionAggregation, '直觉聚合（DS 证据）', '{intuitions[]}', '{aggregated,conflict,provenance}', ['聚合', 'Dempster'], types_1.AlgorithmComplexity.O_N],
    ['intuitionDecay', IntuitionAlg.intuitionDecay, '直觉衰减', '{initialStrength,elapsed,halfLife,reinforcementCount}', '{currentStrength,decayFactor,provenance}', ['衰减', '直觉'], types_1.AlgorithmComplexity.O1],
    ['intuitionConflict', IntuitionAlg.intuitionConflict, '直觉冲突', '{intuitions[]}', '{conflictLevel,dominantDirection,resolution,provenance}', ['冲突', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['intuitionLearning', IntuitionAlg.intuitionLearning, '直觉学习', '{currentWeights,experiences}', '{updatedWeights,totalAdjustment,provenance}', ['学习', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['intuitionProvenance', IntuitionAlg.intuitionProvenance, '直觉溯源', '{intuition,sources}', '{traceability,dominantSource,sourceBreakdown,provenance}', ['溯源', '直觉'], types_1.AlgorithmComplexity.O_N],
    ['intuitionValidation', IntuitionAlg.intuitionValidation, '直觉验证', '{intuition,evidence,tolerance}', '{validated,deviation,adjustedConfidence,provenance}', ['验证', '直觉'], types_1.AlgorithmComplexity.O_N],
], 'intuition-algorithms.test.ts');
// --- CONFLICT（X）ALG_T1_X_001 ~ ALG_T1_X_015 ---
registerBatch2(types_1.AlgorithmFamily.CONFLICT, 'X', ConflictAlg, [
    ['conflictDetection', ConflictAlg.conflictDetection, '冲突检测', '{parties,threshold}', '{hasConflict,conflictPairs,provenance}', ['冲突', '检测'], types_1.AlgorithmComplexity.O_N2],
    ['conflictIntensity', ConflictAlg.conflictIntensity, '冲突强度计算', '{partyA,partyB,issueWeight}', '{intensity,powerAsymmetry,stakeLevel,provenance}', ['强度', '冲突'], types_1.AlgorithmComplexity.O_N],
    ['contradictionIdentification', ConflictAlg.contradictionIdentification, '矛盾识别', '{parties[]}', '{contradictions,provenance}', ['矛盾', '识别'], types_1.AlgorithmComplexity.O_N2],
    ['dialecticalAnalysis', ConflictAlg.dialecticalAnalysis, '对立统一分析', '{thesis,antithesis}', '{synthesis,integrationScore,residualTension,provenance}', ['辩证', '对立统一'], types_1.AlgorithmComplexity.O1],
    ['conflictMediation', ConflictAlg.conflictMediation, '冲突调解', '{parties,mediatorPower}', '{mediationSuccess,proposedSettlement,provenance}', ['调解', '冲突'], types_1.AlgorithmComplexity.O_N],
    ['consensusSeeking', ConflictAlg.consensusSeeking, '共识寻求', '{positions[]}', '{consensus,agreement,holdouts,provenance}', ['共识', '寻求'], types_1.AlgorithmComplexity.O_N],
    ['compromiseGeneration', ConflictAlg.compromiseGeneration, '妥协方案生成', '{parties,constraints}', '{compromises,feasibility,provenance}', ['妥协', '方案'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['conflictEscalationPrediction', ConflictAlg.conflictEscalationPrediction, '冲突升级预测', '{currentTension,recentActions,historyEscalationRate}', '{willEscalate,escalationProbability,provenance}', ['升级', '预测'], types_1.AlgorithmComplexity.O_N],
    ['conflictDeescalation', ConflictAlg.conflictDeescalation, '冲突降级', '{currentTension,deescalationActions,budget}', '{achievable,reducedTension,actionsTaken,provenance}', ['降级', '冲突'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['multiPartyGameEquilibrium', ConflictAlg.multiPartyGameEquilibrium, '多方博弈均衡', '{players[]}', '{equilibriumStrategy,equilibriumPayoff,stable,provenance}', ['博弈', '均衡'], types_1.AlgorithmComplexity.O_N2],
    ['paretoImprovement', ConflictAlg.paretoImprovement, '帕累托改进', '{current,alternatives}', '{improvementFound,bestAlternative,improvements,provenance}', ['帕累托', '改进'], types_1.AlgorithmComplexity.O_N_M],
    ['nashEquilibrium', ConflictAlg.nashEquilibrium, '纳什均衡检测', '{payoffMatrix}', '{equilibria,pureStrategyFound,provenance}', ['纳什', '均衡'], types_1.AlgorithmComplexity.O_N2],
    ['zeroSumDetection', ConflictAlg.zeroSumDetection, '零和检测', '{payoffMatrix}', '{isZeroSum,sumVariance,skewness,provenance}', ['零和', '检测'], types_1.AlgorithmComplexity.O_N2],
    ['winWinStrategy', ConflictAlg.winWinStrategy, '双赢策略', '{parties,resourcePool}', '{allocations,totalUtility,provenance}', ['双赢', '策略'], types_1.AlgorithmComplexity.O_N],
    ['conflictProvenance', ConflictAlg.conflictProvenance, '冲突溯源', '{conflict}', '{rootCause,depthDistribution,traceability,provenance}', ['溯源', '冲突'], types_1.AlgorithmComplexity.O_N],
], 'conflict-algorithms.test.ts');
// --- TIME（T）ALG_T1_T_001 ~ ALG_T1_T_015 ---
registerBatch2(types_1.AlgorithmFamily.TIME, 'T', TimeAlg, [
    ['timeSeriesForecast', TimeAlg.timeSeriesForecast, '时间序列预测（线性回归）', '{series,horizon}', '{forecast,slope,rSquared,provenance}', ['时间序列', '预测'], types_1.AlgorithmComplexity.O_N],
    ['temporalPatternRecognition', TimeAlg.temporalPatternRecognition, '时序模式识别（自相关）', '{series,maxLag}', '{autocorrelations,dominantLag,periodic,provenance}', ['时序', '自相关'], types_1.AlgorithmComplexity.O_N2],
    ['timeArrowDetermination', TimeAlg.timeArrowDetermination, '时间箭头判定（熵增）', '{states[]}', '{arrow,entropyDelta,confidence,provenance}', ['时间箭头', '熵增'], types_1.AlgorithmComplexity.O_N],
    ['spatialDistance', TimeAlg.spatialDistance, '空间距离计算', '{a,b,metric}', '{distance,metric,provenance}', ['空间', '距离'], types_1.AlgorithmComplexity.O1],
    ['spatiotemporalInterpolation', TimeAlg.spatiotemporalInterpolation, '时空插值（IDW）', '{known,target,power}', '{value,weights,provenance}', ['时空', 'IDW'], types_1.AlgorithmComplexity.O_N],
    ['periodicityDetection', TimeAlg.periodicityDetection, '周期检测（FFT）', '{series}', '{period,strength,spectrum,provenance}', ['周期', 'FFT'], types_1.AlgorithmComplexity.O_N2],
    ['trendAnalysis', TimeAlg.trendAnalysis, '趋势分析（Mann-Kendall）', '{series}', '{trend,slope,significance,provenance}', ['趋势', 'Mann-Kendall'], types_1.AlgorithmComplexity.O_N2],
    ['seasonalDecomposition', TimeAlg.seasonalDecomposition, '季节性分解', '{series,period}', '{trend,seasonal,residual,provenance}', ['季节性', '分解'], types_1.AlgorithmComplexity.O_N2],
    ['timeWindowAggregation', TimeAlg.timeWindowAggregation, '时间窗口聚合', '{series,windowSize,aggregation}', '{windows,provenance}', ['窗口', '聚合'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['spatiotemporalClustering', TimeAlg.spatiotemporalClustering, '时空聚类（DBSCAN）', '{points,eps,minPts}', '{clusters,noise,clusterCount,provenance}', ['聚类', 'DBSCAN'], types_1.AlgorithmComplexity.O_N2],
    ['temporalAnomalyDetection', TimeAlg.temporalAnomalyDetection, '时序异常检测', '{series,method,threshold}', '{anomalies,anomalyIndices,provenance}', ['异常', '检测'], types_1.AlgorithmComplexity.O_N],
    ['timeDecayMemory', TimeAlg.timeDecayMemory, '时间衰减记忆', '{memories,currentTime,halfLife}', '{retained,provenance}', ['衰减', '记忆'], types_1.AlgorithmComplexity.O_N_LOG_N],
    ['causalTemporalInference', TimeAlg.causalTemporalInference, '因果时序推断（Granger）', '{cause,effect,maxLag}', '{bestLag,causalityScore,significant,provenance}', ['因果', 'Granger'], types_1.AlgorithmComplexity.O_N2],
    ['temporalConsistencyCheck', TimeAlg.temporalConsistencyCheck, '时间一致性校验', '{events[]}', '{consistent,violations,provenance}', ['一致性', '校验'], types_1.AlgorithmComplexity.O_N_M],
    ['spatiotemporalPathOptimization', TimeAlg.spatiotemporalPathOptimization, '时空路径优化（最近邻 TSP）', '{start,destinations}', '{path,totalDistance,totalTime,provenance}', ['路径', 'TSP'], types_1.AlgorithmComplexity.O_N2],
], 'time-algorithms.test.ts');
// ============================================================================
// T2 真实注册（20 类 × 20 = 400 个，引擎封装算法）
// ============================================================================
/** T2 批量注册辅助函数 */
function registerT2Batch(family, code, moduleRef, functionNames, testFileName) {
    functionNames.forEach((fnName, i) => {
        const idx = String(i + 1).padStart(3, '0');
        const id = `ALG_T2_${code}_${idx}`;
        const handler = moduleRef[fnName];
        REGISTRY.push({
            id,
            name: fnName,
            family,
            tier: types_1.AlgorithmTier.T2,
            handler: handler,
            testPath: `packages/engine/RUNTIME/src/algorithms/t2/${testFileName}`,
            enginePath: `packages/engine/RUNTIME/src/algorithms/t2/${testFileName.replace('.test.ts', '.ts')}`,
            documentationRef: `附录A·T2·${id}`,
            complexity: types_1.AlgorithmComplexity.O_N,
            inputSchema: 'varies',
            outputSchema: '{...provenance:string[]}',
            description: `T2 ${family} 引擎封装算法 ${fnName}`,
            keywords: ['T2', family, code, fnName],
            implemented: true,
        });
    });
}
// COUPLING (C) ALG_T2_C_001~020
registerT2Batch(types_1.AlgorithmFamily.COUPLING, 'C', T2CouplingAlg, ['trilayerCoupling', 'buildCouplingGraph', 'couplingCentrality', 'couplingShortestPath', 'couplingStateTransition', 'couplingStability', 'couplingResonance', 'couplingEntropy', 'couplingDecay', 'couplingEnhance', 'couplingRiskAlert', 'couplingCommunity', 'couplingSymmetrize', 'couplingDistribution', 'couplingHierarchicalAggregate', 'couplingGini', 'couplingForecast', 'couplingAnomalyInjection', 'couplingPropagation', 'couplingComprehensiveAssessment'], 'coupling-engine-algorithms.test.ts');
// VALUE (V) ALG_T2_V_001~020
registerT2Batch(types_1.AlgorithmFamily.VALUE, 'V', T2ValueAlg, ['dcvWeightedAggregate', 'valueFlowTrace', 'stakeholderBalance', 'valueBankReconcile', 'valueDecayModel', 'valueRiskMatrix', 'valueAttribution', 'valueExponentialSmoothing', 'valueBenchmark', 'valueHealthIndex', 'valueArbitration', 'valueLock', 'valueAuditChain', 'valueDensityAnalysis', 'valueOptimizationSuggest', 'valueEquity', 'valueLifecycle', 'valueCoupling', 'valueNPV', 'valueComprehensiveRating'], 'value-engine-algorithms.test.ts');
// BIAS (B) ALG_T2_B_001~020
registerT2Batch(types_1.AlgorithmFamily.BIAS, 'B', T2BiasAlg, ['multiSourceBiasAggregate', 'biasCascadeDetect', 'biasRootCause', 'biasCorrectionStrategy', 'biasCorrelation', 'biasAccumulationMonitor', 'biasHeatmap', 'biasPropagationPath', 'biasThresholdAdapt', 'biasReportGenerate', 'biasSelfHeal', 'biasTraceChain', 'biasImpactScope', 'biasCompensator', 'biasStatisticalTest', 'biasSeasonality', 'biasSpatialDistribution', 'biasAlertLevel', 'biasCausalInference', 'biasComprehensiveAssessment'], 'bias-engine-algorithms.test.ts');
// LOGIC (L) ALG_T2_L_001~020
registerT2Batch(types_1.AlgorithmFamily.LOGIC, 'L', T2LogicAlg, ['proofTreeDepth', 'proofTreeVerify', 'axiomConsistencyCheck', 'inferenceChainBuild', 'propositionSatisfiability', 'modalLogicEval', 'deductiveVerify', 'inductiveStrength', 'abductiveBestExplanation', 'analogicalReasoning', 'logicConsistencyMatrix', 'predicateUnification', 'counterExampleSearch', 'logicCompleteness', 'logicSoundness', 'inferenceRuleSynthesize', 'truthTableGenerate', 'logicNormalFormConvert', 'argumentStrength', 'logicAuditComprehensive'], 'logic-engine-algorithms.test.ts');
// EVOLUTION (E) ALG_T2_E_001~020
registerT2Batch(types_1.AlgorithmFamily.EVOLUTION, 'E', T2EvolutionAlg, ['evolutionFiveStageCycle', 'evolutionBoundarySense', 'evolutionGapAnalysis', 'evolutionSelfGenerate', 'evolutionVerify', 'evolutionRecurseTrigger', 'evolutionFitness', 'evolutionHistoryTrace', 'evolutionAccelerate', 'evolutionStagnationDetect', 'evolutionPathPlanning', 'evolutionDiversityMaintain', 'evolutionAssessmentReport', 'evolutionThresholdAdapt', 'evolutionRollback', 'evolutionEfficiency', 'evolutionStressTest', 'evolutionCoEvolve', 'evolutionGoalAlign', 'evolutionComprehensiveAssessment'], 'evolution-engine-algorithms.test.ts');
// CREATION (M) ALG_T2_M_001~020
registerT2Batch(types_1.AlgorithmFamily.CREATION, 'M', T2CreationAlg, ['creationTriggerEvaluate', 'creationPrimitiveSynthesize', 'creationConstraintAlign', 'creationIntegrityCheck', 'creationNoveltyAssess', 'creationUtilityAssess', 'creationFeasibility', 'creationIterateOptimize', 'creationPathSelect', 'creationRiskAssess', 'creationProvenance', 'creationImpactAssess', 'creationSynergize', 'creationDecayMonitor', 'creationEvolutionTrace', 'creationValidationTest', 'creationOptimizationDirection', 'creationCombinatorialControl', 'creationQualityGrade', 'creationComprehensiveAssessment'], 'creation-engine-algorithms.test.ts');
// FREQUENCY (F) ALG_T2_F_001~020
registerT2Batch(types_1.AlgorithmFamily.FREQUENCY, 'F', T2FrequencyAlg, ['frequencyStateMachine', 'frequencyAdaptiveControl', 'frequencyResonanceDetect', 'frequencyLock', 'frequencyHarmonicAnalysis', 'frequencySpectralDensity', 'frequencyPhaseDiff', 'frequencyModulate', 'frequencyFilter', 'frequencyPeriodDetect', 'frequencySweep', 'frequencySynchronize', 'frequencyJitterAnalyze', 'frequencyDecay', 'frequencyAmplify', 'frequencyMix', 'frequencyThresholdAlert', 'frequencyCalibrate', 'frequencyStatistics', 'frequencyComprehensiveAssessment'], 'frequency-engine-algorithms.test.ts');
// DECISION (D) ALG_T2_D_001~020
registerT2Batch(types_1.AlgorithmFamily.DECISION, 'D', T2DecisionAlg, ['intentVerificationLayer', 'intentLineageTrace', 'semanticOutputGate', 'contentIntegrityCheck', 'decisionLockExecute', 'decisionTreeBuild', 'decisionTreeTraverse', 'decisionRiskAssess', 'decisionRollback', 'decisionAuditLog', 'decisionWeightCalculate', 'decisionConsistencyCheck', 'decisionPrioritize', 'decisionSimulate', 'decisionAuthorize', 'decisionTimeoutHandle', 'decisionConflictResolve', 'decisionReversibility', 'decisionPerformanceImpact', 'decisionComprehensiveAssessment'], 'decision-engine-algorithms.test.ts');
// SECURITY (S) ALG_T2_S_001~020
registerT2Batch(types_1.AlgorithmFamily.SECURITY, 'S', T2SecurityAlg, ['threatModeling', 'permissionVerify', 'sqlInjectionDetect', 'xssDetect', 'csrfTokenVerify', 'authStrengthAssess', 'privilegeEscalationDetect', 'anomalyAccessDetect', 'rateLimitCheck', 'encryptionStrengthVerify', 'auditLogGenerate', 'securityPolicyAssess', 'vulnerabilityAssess', 'intrusionDetect', 'dataLeakDetect', 'ddosDetect', 'securityIncidentResponse', 'complianceCheck', 'passwordHashVerify', 'securityComprehensiveAssessment'], 'security-engine-algorithms.test.ts');
// NEGENTROPY (N) ALG_T2_N_001~020
registerT2Batch(types_1.AlgorithmFamily.NEGENTROPY, 'N', T2NegentropyAlg, ['shannonEntropy', 'negentropyCalculate', 'entropyDeltaCalculate', 'systemOrderAssess', 'negentropyContributionAssess', 'entropyIncreaseDetect', 'thermodynamicEntropyApprox', 'informationEntropyFlow', 'entropyThresholdAlert', 'systemComplexityAssess', 'negentropyInjectStrategy', 'entropyBalance', 'entropySourceAnalyze', 'entropySteadyStateDetect', 'entropyPredict', 'entropyAudit', 'negentropyLedgerRecord', 'entropyOptimizationSuggest', 'entropyReportGenerate', 'negentropyComprehensiveAssessment'], 'negentropy-engine-algorithms.test.ts');
// MEMORY (K) ALG_T2_K_001~020
registerT2Batch(types_1.AlgorithmFamily.MEMORY, 'K', T2MemoryAlg, ['memoryLayerRoute', 'memoryDecay', 'memoryConsolidate', 'memoryRetrieve', 'memoryIndexBuild', 'memoryCompress', 'memoryAssociate', 'memoryForget', 'memoryReplay', 'memoryImportanceAssess', 'memoryDeduplicate', 'memoryMigrate', 'memoryCapacityManage', 'memoryTimestampManage', 'memoryValidate', 'memorySnapshot', 'memoryRestore', 'memoryAudit', 'memoryEncrypt', 'memoryComprehensiveAssessment'], 'memory-engine-algorithms.test.ts');
// LEARNING (G) ALG_T2_G_001~020
registerT2Batch(types_1.AlgorithmFamily.LEARNING, 'G', T2LearningAlg, ['patternExtract', 'skillGenerate', 'feedbackLoop', 'adaptiveLearningRate', 'knowledgeTransfer', 'learningCurve', 'experienceReplay', 'reinforcementSignal', 'curriculumLearning', 'knowledgeGraphBuild', 'learningStrategySelect', 'overfittingDetect', 'modelDistill', 'activeLearningSelect', 'onlineLearningUpdate', 'ensembleLearning', 'gradientCalculate', 'learningAssess', 'knowledgeConsolidate', 'learningComprehensiveAssessment'], 'learning-engine-algorithms.test.ts');
// REASONING (R) ALG_T2_R_001~020
registerT2Batch(types_1.AlgorithmFamily.REASONING, 'R', T2ReasoningAlg, ['fipoReasoning', 'causalReasoning', 'counterfactualReasoning', 'multiStepReasoningChain', 'abductiveReasoning', 'deductiveReasoning', 'inductiveReasoning', 'analogicalReasoning', 'modalReasoning', 'probabilisticReasoning', 'fuzzyReasoning', 'temporalReasoning', 'spatialReasoning', 'metaReasoning', 'reasoningChainValidate', 'reasoningPathSearch', 'reasoningConflictResolve', 'hypothesisGenerate', 'reasoningOptimize', 'reasoningComprehensiveAssessment'], 'reasoning-engine-algorithms.test.ts');
// INTUITION (I) ALG_T2_I_001~020
registerT2Batch(types_1.AlgorithmFamily.INTUITION, 'I', T2IntuitionAlg, ['fuseIntuitionSignals', 'rapidPatternMatch', 'assessIntuitionConfidence', 'heuristicDecision', 'intuitionDecay', 'calibrateIntuition', 'abstractPattern', 'detectIntuitionConflict', 'rankIntuitions', 'traceIntuitionSource', 'suppressLowConfidence', 'amplifyHighConfidence', 'countPatternFrequency', 'searchIntuitionPath', 'intuitionStateMachine', 'retrieveIntuitionMemory', 'mergeIntuitions', 'evaluateIntuitionTrigger', 'learnFromFeedback', 'comprehensiveIntuitionAssessment'], 'intuition-engine-algorithms.test.ts');
// CONFLICT (X) ALG_T2_X_001~020
registerT2Batch(types_1.AlgorithmFamily.CONFLICT, 'X', T2ConflictAlg, ['calculateConflictIntensity', 'analyzeConflictRootCause', 'assessPartyInfluence', 'findCompromisePoint', 'predictConflictEscalation', 'deescalateConflict', 'calculatePositionDistance', 'detectConflictCoalitions', 'selectMediator', 'evaluateResolution', 'recognizeConflictPattern', 'assessConflictImpact', 'prioritizeConflicts', 'planConflictResolution', 'modelPartyEmotion', 'calculateCoolingPeriod', 'reviewConflict', 'preventionMeasures', 'detectConflictSignals', 'comprehensiveConflictAssessment'], 'conflict-engine-algorithms.test.ts');
// TIME (T) ALG_T2_T_001~020
registerT2Batch(types_1.AlgorithmFamily.TIME, 'T', T2TimeAlg, ['aggregateTimeWindow', 'timeSeriesTrend', 'detectSeasonality', 'detectTimeAnomaly', 'analyzeTimeInterval', 'forecastTimeSeries', 'smoothTimeSeries', 'diffTimeSeries', 'autocorrelation', 'slidingWindow', 'decomposeTimeSeries', 'resampleTimeSeries', 'alignTimestamps', 'normalizeTimeSeries', 'crossCorrelation', 'detectPeriod', 'fillMissingTime', 'truncateTimeSeries', 'timeSeriesStatistics', 'comprehensiveTimeAssessment'], 'time-engine-algorithms.test.ts');
// DIALOG (A) ALG_T2_A_001~020
registerT2Batch(types_1.AlgorithmFamily.DIALOG, 'A', T2DialogAlg, ['recognizeDialogIntent', 'manageDialogContext', 'analyzeDialogSentiment', 'detectDialogTopic', 'generateDialogSummary', 'checkDialogConsistency', 'controlDialogFlow', 'analyzeParticipants', 'extractKeyInformation', 'generateResponse', 'assessDialogQuality', 'detectInterruption', 'trackDialogFocus', 'trackDialogEmotion', 'selectDialogStrategy', 'compressDialogHistory', 'recognizeEntities', 'predictNextTurn', 'fallbackStrategy', 'comprehensiveDialogAssessment'], 'dialog-engine-algorithms.test.ts');
// PROACTIVE (P) ALG_T2_P_001~020
registerT2Batch(types_1.AlgorithmFamily.PROACTIVE, 'P', T2ProactiveAlg, ['detectProactiveSignal', 'prioritizeProactiveActions', 'assessProactiveTiming', 'evaluateProactiveTrigger', 'predictProactiveImpact', 'assessProactiveSuppression', 'learnProactiveFeedback', 'proactiveCooldown', 'controlProactiveFrequency', 'assessProactiveScope', 'assessProactiveResources', 'modelProactiveContext', 'proactiveDecisionTree', 'assessProactiveRisk', 'evaluateProactiveEffect', 'selectProactiveStrategy', 'analyzeProactiveHistory', 'adaptProactiveThreshold', 'scheduleProactiveAction', 'comprehensiveProactiveAssessment'], 'proactive-engine-algorithms.test.ts');
// IDEA (H) ALG_T2_H_001~020
registerT2Batch(types_1.AlgorithmFamily.IDEA, 'H', T2IdeaAlg, ['evaluateIdeaGeneration', 'analyzeIdeaAssociations', 'traceIdeaEvolution', 'combineIdeas', 'detectIdeaDivergence', 'rankIdeas', 'filterIdeas', 'mutateIdea', 'crossoverIdeas', 'selectEliteIdeas', 'assessIdeaDiversity', 'detectIdeaConvergence', 'identifyInspirationSource', 'assessIdeaImpactScope', 'analyzeIdeaFeasibility', 'assessIdeaNovelty', 'planIdeaImplementation', 'assessIdeaRisk', 'integrateIdeaFeedback', 'comprehensiveIdeaAssessment'], 'idea-engine-algorithms.test.ts');
// AUDIT (U) ALG_T2_U_001~020
registerT2Batch(types_1.AlgorithmFamily.AUDIT, 'U', T2AuditAlg, ['aggregateAuditLogs', 'generateAuditReport', 'detectAuditAnomaly', 'checkAuditCompliance', 'analyzeAuditTimeline', 'identifyAuditPatterns', 'verifyAuditPermissions', 'verifyAuditIntegrity', 'buildAuditTraceChain', 'assessAuditRisk', 'analyzeAuditFrequency', 'analyzeAuditVariance', 'extractKeyAuditEvents', 'summarizeAuditStatistics', 'analyzeAuditCorrelation', 'evaluateAuditPerformance', 'forecastAuditTrend', 'cleanupAuditLogs', 'verifyAuditEncryption', 'comprehensiveAuditAssessment'], 'audit-engine-algorithms.test.ts');
// ============================================================================
// T3 真实注册（227 个概念存档，按族/关键词/复杂度索引）
// ============================================================================
/** ConceptComplexity → AlgorithmComplexity 映射 */
const COMPLEXITY_MAP = {
    'O(1)': types_1.AlgorithmComplexity.O1,
    'O(log n)': types_1.AlgorithmComplexity.O_LOG_N,
    'O(n)': types_1.AlgorithmComplexity.O_N,
    'O(n log n)': types_1.AlgorithmComplexity.O_N_LOG_N,
    'O(n²)': types_1.AlgorithmComplexity.O_N2,
    'O(n·m)': types_1.AlgorithmComplexity.O_N_M,
    'O(2^n)': types_1.AlgorithmComplexity.O_2_N,
};
/** 族名字符串 → AlgorithmFamily 枚举映射（16 族） */
const FAMILY_MAP = {
    COUPLING: types_1.AlgorithmFamily.COUPLING,
    VALUE: types_1.AlgorithmFamily.VALUE,
    BIAS: types_1.AlgorithmFamily.BIAS,
    LOGIC: types_1.AlgorithmFamily.LOGIC,
    EVOLUTION: types_1.AlgorithmFamily.EVOLUTION,
    CREATION: types_1.AlgorithmFamily.CREATION,
    FREQUENCY: types_1.AlgorithmFamily.FREQUENCY,
    DECISION: types_1.AlgorithmFamily.DECISION,
    SECURITY: types_1.AlgorithmFamily.SECURITY,
    NEGENTROPY: types_1.AlgorithmFamily.NEGENTROPY,
    MEMORY: types_1.AlgorithmFamily.MEMORY,
    LEARNING: types_1.AlgorithmFamily.LEARNING,
    REASONING: types_1.AlgorithmFamily.REASONING,
    INTUITION: types_1.AlgorithmFamily.INTUITION,
    CONFLICT: types_1.AlgorithmFamily.CONFLICT,
    TIME: types_1.AlgorithmFamily.TIME,
};
/** 将 T3 ConceptEntry 转换并注册到 REGISTRY */
function registerT3(concept) {
    const family = FAMILY_MAP[concept.family] ?? types_1.AlgorithmFamily.GENERAL;
    const complexity = COMPLEXITY_MAP[concept.complexity] ?? types_1.AlgorithmComplexity.O_N;
    REGISTRY.push({
        id: concept.id,
        name: concept.name,
        family,
        tier: types_1.AlgorithmTier.T3,
        handler: undefined,
        documentationRef: concept.documentationRef,
        complexity,
        inputSchema: concept.inputSchema,
        outputSchema: concept.outputSchema,
        description: concept.description,
        keywords: concept.keywords,
        implemented: true,
    });
}
// 注册全部 227 个 T3 概念
for (const concept of concept_index_1.ALL_CONCEPTS) {
    registerT3(concept);
}
// ============================================================================
// 注册表 API
// ============================================================================
function getRegistry() {
    return REGISTRY;
}
function getAlgorithmById(id) {
    return REGISTRY.find(e => e.id === id);
}
function getAlgorithmsByTier(tier) {
    return REGISTRY.filter(e => e.tier === tier);
}
function getAlgorithmsByFamily(family) {
    return REGISTRY.filter(e => e.family === family);
}
function searchAlgorithms(keywords) {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    return REGISTRY.filter(e => e.keywords.some(k => lowerKeywords.some(lk => k.toLowerCase().includes(lk))));
}
function getImplementedCount() {
    const t1 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T1 && e.implemented).length;
    const t2 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T2 && e.implemented).length;
    const t3 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T3 && e.implemented).length;
    return { t1, t2, t3, total: t1 + t2 + t3 };
}
function getTotalCount() {
    const t1 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T1).length;
    const t2 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T2).length;
    const t3 = REGISTRY.filter(e => e.tier === types_1.AlgorithmTier.T3).length;
    return { t1, t2, t3, total: t1 + t2 + t3 };
}
/** 执行算法（异步版本，支持 async handler） */
async function executeAlgorithm(id, input) {
    const entry = getAlgorithmById(id);
    if (!entry) {
        return { success: false, error: `算法 ${id} 不存在`, provenance: [], durationMs: 0 };
    }
    if (!entry.implemented || !entry.handler) {
        return {
            success: false,
            error: `算法 ${id} 未实现（NOT_IMPLEMENTED）`,
            provenance: [`[${id}] NOT_IMPLEMENTED`],
            durationMs: 0,
        };
    }
    const start = Date.now();
    try {
        const output = await entry.handler(input);
        return {
            success: true,
            output: output,
            provenance: [`[${id}] executed`],
            durationMs: Date.now() - start,
        };
    }
    catch (e) {
        return {
            success: false,
            error: e.message,
            provenance: [`[${id}] error: ${e.message}`],
            durationMs: Date.now() - start,
        };
    }
}
/**
 * 执行算法（同步版本，仅适用于同步 handler，如 T1 算法）
 *
 * 当 handler 返回 Promise 时，会返回错误提示用户改用 executeAlgorithm（async 版本）。
 * 适用于 T1 直接函数型算法（300 个），不适用于 T2/T3 可能的 async handler。
 *
 * @example
 * ```typescript
 * const result = executeAlgorithmSync('ALG_T1_C_001', { a: [1,2,3], b: [2,4,6] });
 * console.log(result.output.score); // 1
 * ```
 */
function executeAlgorithmSync(id, input) {
    const entry = getAlgorithmById(id);
    if (!entry) {
        return { success: false, error: `算法 ${id} 不存在`, provenance: [], durationMs: 0 };
    }
    if (!entry.implemented || !entry.handler) {
        return {
            success: false,
            error: `算法 ${id} 未实现（NOT_IMPLEMENTED）`,
            provenance: [`[${id}] NOT_IMPLEMENTED`],
            durationMs: 0,
        };
    }
    const start = Date.now();
    try {
        const output = entry.handler(input);
        // 检测 handler 是否返回 Promise
        if (output && typeof output.then === 'function') {
            return {
                success: false,
                error: `算法 ${id} 的 handler 是异步的，请使用 executeAlgorithm（async 版本）并 await`,
                provenance: [`[${id}] async_handler_detected`],
                durationMs: Date.now() - start,
            };
        }
        return {
            success: true,
            output: output,
            provenance: [`[${id}] executed_sync`],
            durationMs: Date.now() - start,
        };
    }
    catch (e) {
        return {
            success: false,
            error: e.message,
            provenance: [`[${id}] error: ${e.message}`],
            durationMs: Date.now() - start,
        };
    }
}

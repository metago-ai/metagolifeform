/**
 * MetaGO Engine - SDK 类型定义
 * SDK Type Definitions
 *
 * 让其他开发者基于引擎构建应用时的类型接口。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

// ===== 引擎核心类型 =====

export interface EngineConfig {
  enginePath?: string;
  version?: string;
  memoryPath?: string;
}

export interface EngineContext {
  input?: string;
  decision?: string;
  capability?: {
    trigger?: string;
    preconditions?: string[];
    steps?: string[];
    feedback?: string;
    endState?: string;
  };
}

// ===== 验证类型 =====

export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ValidationStatus = 'pass' | 'fail' | 'warning';

export interface ValidationResult {
  axiomId: string;
  axiomName: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  details?: string[];
  timestamp: string;
}

export interface ValidationSummary {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  criticalFail: number;
}

// ===== 决策锁类型 =====

export type GateStatus = 'pass' | 'fail' | 'warning';

export interface GateResult {
  gateId: string;
  gateName: string;
  status: GateStatus;
  message: string;
  details?: string[];
}

export interface DecisionLockResult {
  passed: boolean;
  gates: GateResult[];
  failedGates: string[];
  timestamp: string;
  output: string;
}

// ===== 进化类型 =====

export type EvolutionStage =
  | 'PERCEPTION'
  | 'GAP_ANALYSIS'
  | 'SELF_GENERATION'
  | 'VALIDATION'
  | 'RECURSION';

export interface Boundary {
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: string;
  context?: Record<string, any>;
}

export interface Gap {
  id: string;
  description: string;
  missingCapability: string;
  requiredSkill?: string;
  requiredProtocol?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface GeneratedSolution {
  id: string;
  type: 'skill' | 'protocol' | 'validator' | 'engine';
  name: string;
  description: string;
  draft: string;
  validated: boolean;
}

export interface EvolutionResult {
  success: boolean;
  stage: EvolutionStage;
  boundary?: Boundary;
  gaps?: Gap[];
  solutions?: GeneratedSolution[];
  newVersion?: string;
  errors: string[];
  timestamp: string;
  metaMetaEvolution?: {
    monitored: boolean;
    evolutionValid: boolean;
    concerns: string[];
  };
}

// ===== 基因组类型 =====

export interface Genome {
  engine_version: string;
  metago_version: string;
  package_version: string;
  release_date: string;
  backward_compatibility: string;
  genome: {
    axioms: { total: number; critical: number; critical_ids: string[]; immutable: boolean; file: string };
    attributes: { total: number; critical: number; critical_ids: string[]; evolvable: boolean; file: string };
    protocols: { total: number; critical: number; critical_ids: string[]; file: string };
    engines: { total: number; core: number; file: string };
    algorithms: { total: number };
    atoms: { total: number };
    patents: { total: number; accepted: number; reserved: number };
    value_dimensions: number;
    meta_ideologies: number;
    capability_families: number;
    architecture_layers: number;
  };
  runtime: {
    validators: string[];
    decision_lock_gates: string[];
    evolution_stages: string[];
  };
  activation: {
    rate: string;
    strategy: string;
    priority_order: string[];
  };
  platforms: string[];
}

// ===== SDK 接口 =====

export interface IMetaGOEngine {
  init(): Promise<boolean>;
  validate(output: string, context?: EngineContext): { results: ValidationResult[]; summary: ValidationSummary };
  lock(output: string, intent?: string, userRequest?: string): Promise<DecisionLockResult>;
  evolve(context?: { task?: string; failure?: { type: string; message: string }; feedback?: string }): Promise<EvolutionResult>;
  getStatus(): string;
  getGenome(): Genome | null;
}

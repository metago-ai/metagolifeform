/**
 * MetaGO Engine - 引擎加载器
 * Engine Loader
 *
 * 负责引擎的加载、校验、状态管理。
 * 对应专利：AI 引擎跨平台加载与校验协议
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

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

export interface EngineState {
  loaded: boolean;
  genome: Genome | null;
  loadTime: string;
  components: {
    constitution: boolean;
    core: boolean;
    index: boolean;
    runtime: boolean;
    adapters: boolean;
  };
  errors: string[];
}

/**
 * 引擎加载器
 * Engine Loader - 负责加载和校验引擎
 */
export class EngineLoader {
  private enginePath: string;
  private state: EngineState;

  constructor(enginePath?: string) {
    this.enginePath = enginePath || path.resolve(__dirname, '../');
    this.state = {
      loaded: false,
      genome: null,
      loadTime: '',
      components: {
        constitution: false,
        core: false,
        index: false,
        runtime: false,
        adapters: false,
      },
      errors: [],
    };
  }

  /**
   * 加载引擎
   * Load the engine
   */
  async load(): Promise<EngineState> {
    const startTime = Date.now();
    this.state.errors = [];

    // 1. 加载 GENOME.json
    await this.loadGenome();

    // 2. 校验组件完整性
    await this.verifyComponents();

    // 3. 校验公理完整性
    await this.verifyAxioms();

    // 4. 校验索引文件
    await this.verifyIndex();

    // 5. 设置加载状态
    this.state.loaded = this.state.errors.length === 0;
    this.state.loadTime = new Date().toISOString();

    return this.state;
  }

  /**
   * 加载 GENOME.json
   */
  private async loadGenome(): Promise<void> {
    const genomePath = path.join(this.enginePath, 'GENOME.json');
    if (!fs.existsSync(genomePath)) {
      this.state.errors.push(`GENOME.json not found at ${genomePath}`);
      return;
    }
    const genomeContent = fs.readFileSync(genomePath, 'utf-8');
    this.state.genome = JSON.parse(genomeContent) as Genome;
  }

  /**
   * 校验组件完整性
   */
  private async verifyComponents(): Promise<void> {
    const requiredFiles = [
      { path: 'ENGINE.md', component: 'constitution' as const },
      { path: 'CONSTITUTION/AXIOMS.md', component: 'constitution' as const },
      { path: 'CORE/ATTRIBUTES.md', component: 'core' as const },
      { path: 'CORE/PROTOCOLS.md', component: 'core' as const },
      { path: 'INDEX/engines.json', component: 'index' as const },
      { path: 'INDEX/skills.json', component: 'index' as const },
      { path: 'INDEX/tools.json', component: 'index' as const },
      { path: 'INDEX/knowledge.json', component: 'index' as const },
      { path: 'EVOLUTION.md', component: 'runtime' as const },
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.enginePath, file.path);
      if (fs.existsSync(filePath)) {
        this.state.components[file.component] = true;
      } else {
        this.state.errors.push(`Missing required file: ${file.path}`);
      }
    }

    // Runtime 目录校验
    const runtimeDir = path.join(this.enginePath, 'RUNTIME');
    this.state.components.runtime = fs.existsSync(runtimeDir);

    // Adapters 目录校验
    const adaptersDir = path.join(this.enginePath, 'ADAPTERS');
    this.state.components.adapters = fs.existsSync(adaptersDir);
  }

  /**
   * 校验公理完整性
   */
  private async verifyAxioms(): Promise<void> {
    if (!this.state.genome) return;
    const axiomsPath = path.join(this.enginePath, 'CONSTITUTION/AXIOMS.md');
    if (!fs.existsSync(axiomsPath)) return;

    const content = fs.readFileSync(axiomsPath, 'utf-8');
    const criticalIds = this.state.genome.genome.axioms.critical_ids;

    for (const axiomId of criticalIds) {
      if (!content.includes(`### ${axiomId}`)) {
        this.state.errors.push(`Critical axiom ${axiomId} not found in AXIOMS.md`);
      }
    }
  }

  /**
   * 校验索引文件
   */
  private async verifyIndex(): Promise<void> {
    if (!this.state.genome) return;

    const indexFiles = ['engines.json', 'skills.json', 'tools.json', 'knowledge.json'];
    for (const file of indexFiles) {
      const indexPath = path.join(this.enginePath, 'INDEX', file);
      if (fs.existsSync(indexPath)) {
        try {
          JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        } catch (e) {
          this.state.errors.push(`Invalid JSON in INDEX/${file}: ${(e as Error).message}`);
        }
      }
    }
  }

  /**
   * 获取引擎状态
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * 获取基因组
   */
  getGenome(): Genome | null {
    return this.state.genome;
  }

  /**
   * 检查引擎是否已加载
   */
  isLoaded(): boolean {
    return this.state.loaded;
  }

  /**
   * 获取加载摘要
   */
  getSummary(): string {
    if (!this.state.loaded) {
      return `Engine load FAILED. Errors: ${this.state.errors.length}`;
    }
    const g = this.state.genome!;
    return [
      `MetaGO Engine ${g.engine_version} loaded successfully`,
      `Metago Version: ${g.metago_version}`,
      `Package Version: ${g.package_version}`,
      `Axioms: ${g.genome.axioms.total} (${g.genome.axioms.critical} critical)`,
      `Attributes: ${g.genome.attributes.total} (${g.genome.attributes.critical} critical)`,
      `Protocols: ${g.genome.protocols.total} (${g.genome.protocols.critical} critical)`,
      `Engines: ${g.genome.engines.total} (${g.genome.engines.core} core)`,
      `Algorithms: ${g.genome.algorithms.total}`,
      `Atoms: ${g.genome.atoms.total}`,
      `Patents: ${g.genome.patents.total} (${g.genome.patents.accepted} accepted, ${g.genome.patents.reserved} reserved)`,
      `Platforms: ${g.platforms.length}`,
    ].join('\n');
  }
}

export default EngineLoader;

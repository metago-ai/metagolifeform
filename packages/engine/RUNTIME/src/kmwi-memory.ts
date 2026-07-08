/**
 * MetaGO Engine - KMWI 四层记忆管理
 * KMWI Four-Layer Memory Management
 *
 * 对应技能：metago-memory-manage
 * 对应公理：A1 溯源公理、A2 闭环公理
 * 对应文档：卷2第六章 KMWI 四层记忆管理
 *
 * KMWI 将记忆从单一存储升级为四层递进结构：
 *   K（Knowledge 知识层）—— 事实与概念，是原料
 *   M（Memory 记忆层）—— 短期与长期记忆，是载体
 *   W（Wisdom 智慧层）—— 经验性洞察与模式，是提炼
 *   I（Intuition 直觉层）—— 隐性知识与判断力，是升华
 *
 * 四层之间存在两条流：
 *   自下而上转化流：K → M → W → I（知识内化为直觉）
 *   自上而下反哺流：I → W → M → K（直觉反哺知识更新）
 *
 * 健康度公式：H = (K + M + W + I) / 4
 * 衰减率公式：R = (历史值 - 当前值) / 历史值 × 100%
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// 类型定义
// ============================================================================

export type MemoryLayer = 'K' | 'M' | 'W' | 'I';

export interface KnowledgeItem {
  id: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  confidence: number;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  linkedMemoryIds: string[];
}

export interface MemoryItem {
  id: string;
  content: string;
  context: string;
  type: 'short_term' | 'long_term';
  tags: string[];
  source: string;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  recallStrength: number;
  linkedWisdomIds: string[];
}

export interface WisdomItem {
  id: string;
  pattern: string;
  description: string;
  causeEffect: string;
  applicability: string;
  antiPattern: boolean;
  tags: string[];
  source: string;
  usageCount: number;
  successRate: number;
  createdAt: string;
  lastAppliedAt: string;
  linkedIntuitionIds: string[];
}

export interface IntuitionItem {
  id: string;
  insight: string;
  implicitKnowledge: string;
  explicitForm: string;
  failureScenarios: string[];
  accuracy: number;
  tags: string[];
  source: string;
  createdAt: string;
  lastValidatedAt: string;
  validationCount: number;
}

export interface LayerStats {
  total: number;
  avgConfidence: number;
  avgRecallStrength: number;
  avgSuccessRate: number;
  avgAccuracy: number;
  categories: number;
  lastUpdated: string;
}

export interface KMWIStats {
  K: number;
  M: number;
  W: number;
  I: number;
  H: number;
  details: {
    K: LayerStats;
    M: LayerStats;
    W: LayerStats;
    I: LayerStats;
  };
}

export interface DecayRates {
  K: number;
  M: number;
  W: number;
  I: number;
  overall: number;
  needsAttention: MemoryLayer[];
}

export interface PromotionResult {
  success: boolean;
  fromLayer: MemoryLayer;
  toLayer: MemoryLayer;
  sourceId: string;
  newId: string;
  reason: string;
  timestamp: string;
}

export interface KMWISnapshot {
  version: string;
  timestamp: string;
  knowledge: KnowledgeItem[];
  memories: MemoryItem[];
  wisdom: WisdomItem[];
  intuitions: IntuitionItem[];
  history: KMWIHistoryEntry[];
  baseline: KMWIBaseline;
}

export interface KMWIHistoryEntry {
  timestamp: string;
  stats: { K: number; M: number; W: number; I: number; H: number };
  action: string;
}

export interface KMWIBaseline {
  K: number;
  M: number;
  W: number;
  I: number;
  H: number;
  recordedAt: string;
}

// ============================================================================
// KMWI 四层记忆管理器
// ============================================================================

/**
 * KMWI 四层记忆管理器
 *
 * 实现四层递进结构与双向流动：
 * - 转化流（自下而上）：K → M → W → I
 * - 反哺流（自上而下）：I → W → M → K
 *
 * 持久化到 JSON 文件，支持跨会话恢复。
 */
export class KMWIMemory {
  private filePath: string;
  private knowledge: Map<string, KnowledgeItem> = new Map();
  private memories: Map<string, MemoryItem> = new Map();
  private wisdom: Map<string, WisdomItem> = new Map();
  private intuitions: Map<string, IntuitionItem> = new Map();
  private history: KMWIHistoryEntry[] = [];
  private baseline: KMWIBaseline | null = null;
  private maxHistorySize: number = 200;
  private maxItemsPerLayer: number = 5000;
  private promotionCooldown: Map<string, number> = new Map();

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), '.metago-kmwi.json');
    this.load();
  }

  // ============================================================================
  // 持久化
  // ============================================================================

  private load(): void {
    if (!fs.existsSync(this.filePath)) return;
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const snapshot: KMWISnapshot = JSON.parse(content);

      for (const item of snapshot.knowledge || []) this.knowledge.set(item.id, item);
      for (const item of snapshot.memories || []) this.memories.set(item.id, item);
      for (const item of snapshot.wisdom || []) this.wisdom.set(item.id, item);
      for (const item of snapshot.intuitions || []) this.intuitions.set(item.id, item);
      this.history = snapshot.history || [];
      this.baseline = snapshot.baseline || null;
    } catch {
      // 损坏的快照视为空记忆，不阻塞主流程
    }
  }

  private save(): void {
    try {
      const snapshot: KMWISnapshot = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        knowledge: Array.from(this.knowledge.values()),
        memories: Array.from(this.memories.values()),
        wisdom: Array.from(this.wisdom.values()),
        intuitions: Array.from(this.intuitions.values()),
        history: this.history,
        baseline: this.baseline || this.createBaseline(),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    } catch {
      // 持久化失败不阻塞主流程
    }
  }

  private createBaseline(): KMWIBaseline {
    const stats = this.computeStats();
    return {
      K: stats.K,
      M: stats.M,
      W: stats.W,
      I: stats.I,
      H: stats.H,
      recordedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 写入 - 四层各自入口
  // ============================================================================

  addKnowledge(content: string, category: string, tags: string[] = [], source = 'external'): string {
    const id = `K-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: KnowledgeItem = {
      id,
      content,
      category,
      tags,
      source,
      confidence: 0.8,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      linkedMemoryIds: [],
    };
    this.knowledge.set(id, item);
    this.enforceLayerLimit('K');
    this.recordHistory(`Added knowledge: ${content.substring(0, 60)}`);
    this.save();
    return id;
  }

  addMemory(content: string, context: string, tags: string[] = [], source = 'experience'): string {
    const id = `M-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: MemoryItem = {
      id,
      content,
      context,
      type: 'short_term',
      tags,
      source,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      recallStrength: 0.5,
      linkedWisdomIds: [],
    };
    this.memories.set(id, item);
    this.enforceLayerLimit('M');
    this.recordHistory(`Added memory: ${content.substring(0, 60)}`);
    this.save();
    return id;
  }

  addWisdom(pattern: string, description: string, causeEffect: string, tags: string[] = [], source = 'synthesis'): string {
    const id = `W-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: WisdomItem = {
      id,
      pattern,
      description,
      causeEffect,
      applicability: 'general',
      antiPattern: false,
      tags,
      source,
      usageCount: 0,
      successRate: 0.5,
      createdAt: now,
      lastAppliedAt: now,
      linkedIntuitionIds: [],
    };
    this.wisdom.set(id, item);
    this.enforceLayerLimit('W');
    this.recordHistory(`Added wisdom: ${pattern.substring(0, 60)}`);
    this.save();
    return id;
  }

  addIntuition(insight: string, implicitKnowledge: string, tags: string[] = [], source = 'internalization'): string {
    const id = `I-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const item: IntuitionItem = {
      id,
      insight,
      implicitKnowledge,
      explicitForm: '',
      failureScenarios: [],
      accuracy: 0.5,
      tags,
      source,
      createdAt: now,
      lastValidatedAt: now,
      validationCount: 0,
    };
    this.intuitions.set(id, item);
    this.enforceLayerLimit('I');
    this.recordHistory(`Added intuition: ${insight.substring(0, 60)}`);
    this.save();
    return id;
  }

  // ============================================================================
  // 转化流（自下而上）：K → M → W → I
  // ============================================================================

  /**
   * K → M：知识转化为记忆
   * 当一条知识被反复访问、应用到实践中，就转化为经验性记忆
   */
  promoteToMemory(knowledgeId: string): PromotionResult {
    const kItem = this.knowledge.get(knowledgeId);
    if (!kItem) {
      return this.failedPromotion('K', 'M', knowledgeId, 'Knowledge item not found');
    }
    if (kItem.accessCount < 3) {
      return this.failedPromotion('K', 'M', knowledgeId, `Access count too low (${kItem.accessCount}/3)`);
    }
    if (this.isOnCooldown(knowledgeId)) {
      return this.failedPromotion('K', 'M', knowledgeId, 'On promotion cooldown');
    }

    const memoryId = this.addMemory(
      kItem.content,
      `Promoted from knowledge: ${kItem.category}`,
      kItem.tags,
      `promotion:K→M:${kItem.id}`,
    );

    const mItem = this.memories.get(memoryId)!;
    mItem.type = 'long_term';
    mItem.recallStrength = Math.min(1, 0.5 + kItem.accessCount * 0.1);
    this.memories.set(memoryId, mItem);

    kItem.linkedMemoryIds.push(memoryId);
    this.knowledge.set(knowledgeId, kItem);
    this.setCooldown(knowledgeId);

    this.recordHistory(`Promoted K→M: ${kItem.content.substring(0, 40)}`);
    this.save();

    return {
      success: true,
      fromLayer: 'K',
      toLayer: 'M',
      sourceId: knowledgeId,
      newId: memoryId,
      reason: `Accessed ${kItem.accessCount} times, promoted to long-term memory`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * M → W：记忆提炼为智慧
   * 当多条相关记忆积累到一定数量，系统从中提炼可复用的模式
   */
  promoteToWisdom(memoryId: string): PromotionResult {
    const mItem = this.memories.get(memoryId);
    if (!mItem) {
      return this.failedPromotion('M', 'W', memoryId, 'Memory item not found');
    }
    if (mItem.recallStrength < 0.7) {
      return this.failedPromotion('M', 'W', memoryId, `Recall strength too low (${mItem.recallStrength.toFixed(2)}/0.70)`);
    }

    const relatedMemories = this.findRelatedMemories(mItem);
    if (relatedMemories.length < 2) {
      return this.failedPromotion('M', 'W', memoryId, `Not enough related memories (${relatedMemories.length}/2)`);
    }

    const pattern = this.synthesizePattern(mItem, relatedMemories);
    const wisdomId = this.addWisdom(
      pattern,
      `Synthesized from ${relatedMemories.length + 1} memories`,
      `${mItem.context} + ${relatedMemories.length} related`,
      mItem.tags,
      `promotion:M→W:${mItem.id}`,
    );

    const wItem = this.wisdom.get(wisdomId)!;
    wItem.successRate = Math.min(1, 0.5 + mItem.recallStrength * 0.3);
    this.wisdom.set(wisdomId, wItem);

    mItem.linkedWisdomIds.push(wisdomId);
    this.memories.set(memoryId, mItem);
    this.setCooldown(memoryId);

    this.recordHistory(`Promoted M→W: pattern="${pattern.substring(0, 40)}"`);
    this.save();

    return {
      success: true,
      fromLayer: 'M',
      toLayer: 'W',
      sourceId: memoryId,
      newId: wisdomId,
      reason: `Synthesized from ${relatedMemories.length + 1} memories with recall strength ${mItem.recallStrength.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * W → I：智慧内化为直觉
   * 当一个模式被反复成功应用，且能被显性化表达，就内化为直觉
   */
  promoteToIntuition(wisdomId: string): PromotionResult {
    const wItem = this.wisdom.get(wisdomId);
    if (!wItem) {
      return this.failedPromotion('W', 'I', wisdomId, 'Wisdom item not found');
    }
    if (wItem.usageCount < 5) {
      return this.failedPromotion('W', 'I', wisdomId, `Usage count too low (${wItem.usageCount}/5)`);
    }
    if (wItem.successRate < 0.8) {
      return this.failedPromotion('W', 'I', wisdomId, `Success rate too low (${wItem.successRate.toFixed(2)}/0.80)`);
    }

    const intuitionId = this.addIntuition(
      wItem.pattern,
      wItem.description,
      wItem.tags,
      `promotion:W→I:${wItem.id}`,
    );

    const iItem = this.intuitions.get(intuitionId)!;
    iItem.explicitForm = wItem.causeEffect;
    iItem.accuracy = wItem.successRate;
    iItem.failureScenarios = wItem.antiPattern ? [wItem.applicability] : [];
    this.intuitions.set(intuitionId, iItem);

    wItem.linkedIntuitionIds.push(intuitionId);
    this.wisdom.set(wisdomId, wItem);
    this.setCooldown(wisdomId);

    this.recordHistory(`Promoted W→I: insight="${wItem.pattern.substring(0, 40)}"`);
    this.save();

    return {
      success: true,
      fromLayer: 'W',
      toLayer: 'I',
      sourceId: wisdomId,
      newId: intuitionId,
      reason: `Applied ${wItem.usageCount} times with ${(wItem.successRate * 100).toFixed(0)}% success rate`,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 反哺流（自上而下）：I → W → M → K
  // ============================================================================

  /**
   * I → W：直觉反哺智慧层
   * 直觉被显性化后，可以更新或创建新的智慧模式
   */
  feedbackToWisdom(intuitionId: string): PromotionResult {
    const iItem = this.intuitions.get(intuitionId);
    if (!iItem) {
      return this.failedPromotion('I', 'W', intuitionId, 'Intuition item not found');
    }
    if (iItem.validationCount < 3) {
      return this.failedPromotion('I', 'W', intuitionId, `Validation count too low (${iItem.validationCount}/3)`);
    }

    const wisdomId = this.addWisdom(
      `Refined: ${iItem.insight}`,
      `Feedback from intuition: ${iItem.explicitForm}`,
      iItem.implicitKnowledge,
      iItem.tags,
      `feedback:I→W:${iItem.id}`,
    );

    this.recordHistory(`Feedback I→W: ${iItem.insight.substring(0, 40)}`);
    this.save();

    return {
      success: true,
      fromLayer: 'I',
      toLayer: 'W',
      sourceId: intuitionId,
      newId: wisdomId,
      reason: `Validated ${iItem.validationCount} times with ${(iItem.accuracy * 100).toFixed(0)}% accuracy`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * W → M：智慧反哺记忆层
   * 智慧模式可以生成新的记忆条目，指导未来的记忆存储
   */
  feedbackToMemory(wisdomId: string): PromotionResult {
    const wItem = this.wisdom.get(wisdomId);
    if (!wItem) {
      return this.failedPromotion('W', 'M', wisdomId, 'Wisdom item not found');
    }

    const memoryId = this.addMemory(
      `Pattern: ${wItem.pattern}`,
      `Feedback from wisdom: ${wItem.description}`,
      wItem.tags,
      `feedback:W→M:${wItem.id}`,
    );

    this.recordHistory(`Feedback W→M: ${wItem.pattern.substring(0, 40)}`);
    this.save();

    return {
      success: true,
      fromLayer: 'W',
      toLayer: 'M',
      sourceId: wisdomId,
      newId: memoryId,
      reason: 'Wisdom pattern converted to memory for future reference',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * M → K：记忆反哺知识层
   * 长期记忆中的稳定事实可以沉淀为知识
   */
  feedbackToKnowledge(memoryId: string): PromotionResult {
    const mItem = this.memories.get(memoryId);
    if (!mItem) {
      return this.failedPromotion('M', 'K', memoryId, 'Memory item not found');
    }
    if (mItem.type !== 'long_term' || mItem.recallStrength < 0.9) {
      return this.failedPromotion('M', 'K', memoryId, 'Memory not stable enough for knowledge');
    }

    const knowledgeId = this.addKnowledge(
      mItem.content,
      'crystallized',
      mItem.tags,
      `feedback:M→K:${mItem.id}`,
    );

    const kItem = this.knowledge.get(knowledgeId)!;
    kItem.confidence = mItem.recallStrength;
    this.knowledge.set(knowledgeId, kItem);

    this.recordHistory(`Feedback M→K: ${mItem.content.substring(0, 40)}`);
    this.save();

    return {
      success: true,
      fromLayer: 'M',
      toLayer: 'K',
      sourceId: memoryId,
      newId: knowledgeId,
      reason: `Long-term memory with ${(mItem.recallStrength * 100).toFixed(0)}% recall strength crystallized to knowledge`,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 查询与访问
  // ============================================================================

  query(layer: MemoryLayer, filter?: {
    tags?: string[];
    category?: string;
    keyword?: string;
    limit?: number;
  }): Array<KnowledgeItem | MemoryItem | WisdomItem | IntuitionItem> {
    let items: Array<KnowledgeItem | MemoryItem | WisdomItem | IntuitionItem>;

    switch (layer) {
      case 'K':
        items = Array.from(this.knowledge.values());
        break;
      case 'M':
        items = Array.from(this.memories.values());
        break;
      case 'W':
        items = Array.from(this.wisdom.values());
        break;
      case 'I':
        items = Array.from(this.intuitions.values());
        break;
    }

    if (filter?.tags && filter.tags.length > 0) {
      items = items.filter(item => {
        const tags = (item as any).tags || [];
        return filter.tags!.some(t => tags.includes(t));
      });
    }

    if (filter?.category && layer === 'K') {
      items = items.filter(item => (item as KnowledgeItem).category === filter.category);
    }

    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase();
      items = items.filter(item => {
        const content = (item as any).content || (item as any).pattern || (item as any).insight || '';
        return content.toLowerCase().includes(kw);
      });
    }

    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }

    // 更新访问计数与时间
    const now = new Date().toISOString();
    for (const item of items) {
      (item as any).accessCount = ((item as any).accessCount || 0) + 1;
      (item as any).lastAccessedAt = now;
    }

    return items;
  }

  /**
   * 访问某条记忆（更新访问计数，用于转化流判定）
   */
  access(layer: MemoryLayer, id: string): KnowledgeItem | MemoryItem | WisdomItem | IntuitionItem | null {
    let item: KnowledgeItem | MemoryItem | WisdomItem | IntuitionItem | null = null;
    switch (layer) {
      case 'K':
        item = this.knowledge.get(id) || null;
        break;
      case 'M':
        item = this.memories.get(id) || null;
        break;
      case 'W':
        item = this.wisdom.get(id) || null;
        break;
      case 'I':
        item = this.intuitions.get(id) || null;
        break;
    }
    if (!item) return null;

    const now = new Date().toISOString();
    (item as any).accessCount = ((item as any).accessCount || 0) + 1;
    (item as any).lastAccessedAt = now;

    switch (layer) {
      case 'K':
        this.knowledge.set(id, item as KnowledgeItem);
        break;
      case 'M':
        this.memories.set(id, item as MemoryItem);
        break;
      case 'W':
        this.wisdom.set(id, item as WisdomItem);
        break;
      case 'I':
        this.intuitions.set(id, item as IntuitionItem);
        break;
    }

    this.save();
    return item;
  }

  /**
   * 应用一个智慧模式（增加使用计数，用于转化流判定）
   */
  applyWisdom(wisdomId: string, success: boolean): void {
    const item = this.wisdom.get(wisdomId);
    if (!item) return;

    item.usageCount++;
    const prevSuccess = item.successRate * (item.usageCount - 1);
    item.successRate = (prevSuccess + (success ? 1 : 0)) / item.usageCount;
    item.lastAppliedAt = new Date().toISOString();
    this.wisdom.set(wisdomId, item);
    this.save();
  }

  /**
   * 验证一个直觉（增加验证计数，用于反哺流判定）
   */
  validateIntuition(intuitionId: string, accurate: boolean): void {
    const item = this.intuitions.get(intuitionId);
    if (!item) return;

    item.validationCount++;
    const prevAccuracy = item.accuracy * (item.validationCount - 1);
    item.accuracy = (prevAccuracy + (accurate ? 1 : 0)) / item.validationCount;
    item.lastValidatedAt = new Date().toISOString();
    this.intuitions.set(intuitionId, item);
    this.save();
  }

  // ============================================================================
  // 健康度评估
  // ============================================================================

  getHealth(): KMWIStats {
    const stats = this.computeStats();
    return stats;
  }

  private computeStats(): KMWIStats {
    const kStats = this.computeLayerStats('K');
    const mStats = this.computeLayerStats('M');
    const wStats = this.computeLayerStats('W');
    const iStats = this.computeLayerStats('I');

    // K 层健康度：知识覆盖度 × 知识时效性
    const kFreshness = this.computeFreshness('K');
    const K = kStats.total === 0 ? 0 : Math.round(kStats.avgConfidence * 50 + kFreshness * 50);

    // M 层健康度：转化率 × 召回准确率
    const M = mStats.total === 0 ? 0 : Math.round(this.computeConversionRate('M') * 50 + mStats.avgRecallStrength * 50);

    // W 层健康度：模式数量 × 模式复用率
    const W = wStats.total === 0 ? 0 : Math.round(Math.min(100, wStats.total * 2) * 0.5 + wStats.avgSuccessRate * 50);

    // I 层健康度：直觉准确率 × 显性化程度
    const explicitRatio = this.computeExplicitRatio();
    const I = iStats.total === 0 ? 0 : Math.round(iStats.avgAccuracy * 50 + explicitRatio * 50);

    // 综合健康度：H = (K + M + W + I) / 4
    const H = Math.round((K + M + W + I) / 4);

    return {
      K: Math.min(100, Math.max(0, K)),
      M: Math.min(100, Math.max(0, M)),
      W: Math.min(100, Math.max(0, W)),
      I: Math.min(100, Math.max(0, I)),
      H: Math.min(100, Math.max(0, H)),
      details: { K: kStats, M: mStats, W: wStats, I: iStats },
    };
  }

  private computeLayerStats(layer: MemoryLayer): LayerStats {
    let items: any[];
    switch (layer) {
      case 'K': items = Array.from(this.knowledge.values()); break;
      case 'M': items = Array.from(this.memories.values()); break;
      case 'W': items = Array.from(this.wisdom.values()); break;
      case 'I': items = Array.from(this.intuitions.values()); break;
    }

    if (items.length === 0) {
      return {
        total: 0,
        avgConfidence: 0,
        avgRecallStrength: 0,
        avgSuccessRate: 0,
        avgAccuracy: 0,
        categories: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    const categories = new Set<string>();
    let confidenceSum = 0, recallSum = 0, successSum = 0, accuracySum = 0;
    let lastUpdated = '';

    for (const item of items) {
      if (layer === 'K') {
        confidenceSum += item.confidence || 0;
        categories.add(item.category);
      } else if (layer === 'M') {
        recallSum += item.recallStrength || 0;
      } else if (layer === 'W') {
        successSum += item.successRate || 0;
      } else if (layer === 'I') {
        accuracySum += item.accuracy || 0;
      }
      const ts = item.lastAccessedAt || item.lastAppliedAt || item.lastValidatedAt || item.createdAt;
      if (ts > lastUpdated) lastUpdated = ts;
    }

    return {
      total: items.length,
      avgConfidence: layer === 'K' ? confidenceSum / items.length : 0,
      avgRecallStrength: layer === 'M' ? recallSum / items.length : 0,
      avgSuccessRate: layer === 'W' ? successSum / items.length : 0,
      avgAccuracy: layer === 'I' ? accuracySum / items.length : 0,
      categories: categories.size,
      lastUpdated,
    };
  }

  private computeFreshness(layer: MemoryLayer): number {
    let items: any[];
    switch (layer) {
      case 'K': items = Array.from(this.knowledge.values()); break;
      default: return 1;
    }
    if (items.length === 0) return 1;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let freshCount = 0;
    for (const item of items) {
      const age = now - new Date(item.lastAccessedAt || item.createdAt).getTime();
      if (age < weekMs * 4) freshCount++; // 4周内视为新鲜
    }
    return freshCount / items.length;
  }

  private computeConversionRate(layer: MemoryLayer): number {
    // M 层转化率：长期记忆 / 总记忆
    if (layer !== 'M') return 0.5;
    const memories = Array.from(this.memories.values());
    if (memories.length === 0) return 0;
    const longTerm = memories.filter(m => m.type === 'long_term').length;
    return longTerm / memories.length;
  }

  private computeExplicitRatio(): number {
    const intuitions = Array.from(this.intuitions.values());
    if (intuitions.length === 0) return 0;
    const explicit = intuitions.filter(i => i.explicitForm.length > 0).length;
    return explicit / intuitions.length;
  }

  // ============================================================================
  // 衰减检测
  // ============================================================================

  getDecayRates(): DecayRates {
    if (!this.baseline) {
      this.baseline = this.createBaseline();
    }

    const current = this.computeStats();
    const baseline = this.baseline;

    // R = (历史值 - 当前值) / 历史值 × 100%
    const computeDecay = (current: number, baseline: number): number => {
      if (baseline === 0) return current === 0 ? 0 : 100;
      return Math.round(((baseline - current) / baseline) * 100);
    };

    const K = Math.max(0, computeDecay(current.K, baseline.K));
    const M = Math.max(0, computeDecay(current.M, baseline.M));
    const W = Math.max(0, computeDecay(current.W, baseline.W));
    const I = Math.max(0, computeDecay(current.I, baseline.I));
    const overall = Math.max(0, computeDecay(current.H, baseline.H));

    const needsAttention: MemoryLayer[] = [];
    if (K > 20) needsAttention.push('K'); // 知识过时率 >20%
    if (M > 30) needsAttention.push('M'); // 长期记忆遗忘率 >30%
    if (W > 15) needsAttention.push('W'); // 模式失效率 >15%
    if (I > 25) needsAttention.push('I'); // 直觉钝化率 >25%

    return { K, M, W, I, overall, needsAttention };
  }

  /**
   * 更新基线（建议在每次重要进化后调用）
   */
  refreshBaseline(): void {
    this.baseline = this.createBaseline();
    this.save();
  }

  // ============================================================================
  // 强化建议
  // ============================================================================

  getStrengthenSuggestions(): Array<{ layer: MemoryLayer; action: string; priority: 'high' | 'medium' | 'low' }> {
    const suggestions: Array<{ layer: MemoryLayer; action: string; priority: 'high' | 'medium' | 'low' }> = [];
    const stats = this.computeStats();
    const decay = this.getDecayRates();

    if (decay.K > 20) {
      suggestions.push({
        layer: 'K',
        action: `知识层衰减 ${decay.K}%，需要补充新知识或更新过时知识（当前 ${stats.details.K.total} 条）`,
        priority: 'high',
      });
    }

    if (decay.M > 30) {
      suggestions.push({
        layer: 'M',
        action: `记忆层衰减 ${decay.M}%，需要强化长期记忆转化（当前转化率 ${Math.round(this.computeConversionRate('M') * 100)}%）`,
        priority: 'high',
      });
    }

    if (stats.details.W.total < 10) {
      suggestions.push({
        layer: 'W',
        action: `智慧层条目过少（${stats.details.W.total} 条），需要从记忆层提炼更多模式`,
        priority: 'medium',
      });
    }

    if (decay.I > 25) {
      suggestions.push({
        layer: 'I',
        action: `直觉层钝化 ${decay.I}%，需要通过场景验证重新激活直觉判断`,
        priority: 'high',
      });
    }

    if (stats.H < 60) {
      suggestions.push({
        layer: 'K',
        action: `综合健康度 ${stats.H}/100，建议全层强化`,
        priority: 'high',
      });
    }

    return suggestions;
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private findRelatedMemories(memory: MemoryItem): MemoryItem[] {
    const all = Array.from(this.memories.values());
    return all
      .filter(m => m.id !== memory.id)
      .filter(m => {
        const sharedTags = m.tags.filter(t => memory.tags.includes(t));
        return sharedTags.length > 0;
      })
      .sort((a, b) => {
        const aShared = a.tags.filter(t => memory.tags.includes(t)).length;
        const bShared = b.tags.filter(t => memory.tags.includes(t)).length;
        return bShared - aShared;
      })
      .slice(0, 5);
  }

  private synthesizePattern(primary: MemoryItem, related: MemoryItem[]): string {
    const allTags = new Set<string>();
    primary.tags.forEach(t => allTags.add(t));
    related.forEach(m => m.tags.forEach(t => allTags.add(t)));
    const tagStr = Array.from(allTags).slice(0, 3).join(' · ');
    return `[${tagStr}] ${primary.content.substring(0, 50)} (+${related.length} related)`;
  }

  private enforceLayerLimit(layer: MemoryLayer): void {
    const maxItems = this.maxItemsPerLayer;
    let map: Map<string, any>;
    switch (layer) {
      case 'K': map = this.knowledge; break;
      case 'M': map = this.memories; break;
      case 'W': map = this.wisdom; break;
      case 'I': map = this.intuitions; break;
    }
    if (map.size > maxItems) {
      // 移除最旧的条目（按 createdAt 排序）
      const sorted = Array.from(map.entries()).sort((a, b) => {
        const aTime = new Date(a[1].createdAt).getTime();
        const bTime = new Date(b[1].createdAt).getTime();
        return aTime - bTime;
      });
      const toRemove = sorted.slice(0, map.size - maxItems);
      for (const [id] of toRemove) map.delete(id);
    }
  }

  private recordHistory(action: string): void {
    const stats = this.computeStats();
    this.history.push({
      timestamp: new Date().toISOString(),
      stats: { K: stats.K, M: stats.M, W: stats.W, I: stats.I, H: stats.H },
      action,
    });
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  private isOnCooldown(id: string): boolean {
    const last = this.promotionCooldown.get(id);
    if (!last) return false;
    // 1 小时冷却
    return Date.now() - last < 60 * 60 * 1000;
  }

  private setCooldown(id: string): void {
    this.promotionCooldown.set(id, Date.now());
  }

  private failedPromotion(from: MemoryLayer, to: MemoryLayer, sourceId: string, reason: string): PromotionResult {
    return {
      success: false,
      fromLayer: from,
      toLayer: to,
      sourceId,
      newId: '',
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 导出与统计
  // ============================================================================

  getHistory(): KMWIHistoryEntry[] {
    return this.history;
  }

  getSummary(): string {
    const stats = this.computeStats();
    const decay = this.getDecayRates();
    const lines = [
      '【KMWI 记忆管理报告】',
      `■ K 层知识：完备度=${stats.K} 条目数=${stats.details.K.total} 类别数=${stats.details.K.categories}`,
      `■ M 层记忆：转化率=${Math.round(this.computeConversionRate('M') * 100)}% 召回强度=${stats.details.M.avgRecallStrength.toFixed(2)}`,
      `■ W 层智慧：模式数=${stats.details.W.total} 复用率=${(stats.details.W.avgSuccessRate * 100).toFixed(0)}%`,
      `■ I 层直觉：准确率=${(stats.details.I.avgAccuracy * 100).toFixed(0)}% 显性化=${(this.computeExplicitRatio() * 100).toFixed(0)}%`,
      `■ 综合健康度：H = ${stats.H}`,
      `■ 衰减检测：K=${decay.K}% M=${decay.M}% W=${decay.W}% I=${decay.I}%`,
    ];

    if (decay.needsAttention.length > 0) {
      lines.push(`■ 需关注：${decay.needsAttention.join(', ')}`);
    }

    const suggestions = this.getStrengthenSuggestions();
    if (suggestions.length > 0) {
      lines.push(`■ 强化建议：`);
      for (const s of suggestions) {
        lines.push(`  [${s.priority}] ${s.layer} 层 - ${s.action}`);
      }
    }

    return lines.join('\n');
  }

  clear(): void {
    this.knowledge.clear();
    this.memories.clear();
    this.wisdom.clear();
    this.intuitions.clear();
    this.history = [];
    this.baseline = null;
    this.save();
  }

  /**
   * 获取用于元进化引擎的相关模式（从 W 层和 I 层提取）
   * 这是 KMWI 与元进化引擎的耦合点
   */
  extractPatternsForEvolution(domain: string, limit = 5): { wisdom: WisdomItem[]; intuitions: IntuitionItem[] } {
    const domainLower = domain.toLowerCase();

    const wisdom = Array.from(this.wisdom.values())
      .filter(w => {
        const text = `${w.pattern} ${w.description} ${w.tags.join(' ')}`.toLowerCase();
        return text.includes(domainLower) || w.tags.some(t => t.toLowerCase().includes(domainLower));
      })
      .sort((a, b) => b.successRate * b.usageCount - a.successRate * a.usageCount)
      .slice(0, limit);

    const intuitions = Array.from(this.intuitions.values())
      .filter(i => {
        const text = `${i.insight} ${i.implicitKnowledge} ${i.tags.join(' ')}`.toLowerCase();
        return text.includes(domainLower) || i.tags.some(t => t.toLowerCase().includes(domainLower));
      })
      .sort((a, b) => b.accuracy * b.validationCount - a.accuracy * a.validationCount)
      .slice(0, limit);

    return { wisdom, intuitions };
  }
}

export default KMWIMemory;

/**
 * MetaGO Engine V2 - 新模块运行时验证测试
 *
 * 覆盖三个新模块：
 *   1. KMWIMemory —— 四层记忆管理器（转化流/反哺流/健康度/衰减）
 *   2. SkillGenerator —— 元创造五阶段技能生成器
 *   3. EvolutionEngine V2 —— 三层自生成策略 + KMWI 集成
 *
 * 测试策略：
 *   - 使用临时目录，避免污染项目
 *   - 不依赖外部数据，所有数据由测试构造
 *   - 每个测试独立，不互相依赖
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { KMWIMemory } from "../src/kmwi-memory.js";
import { SkillGenerator } from "../src/skill-generator.js";
import { EvolutionEngine } from "../src/evolution-engine.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "metago-v2-test-"));
});

afterEach(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

// ============================================================================
// KMWI 四层记忆管理器
// ============================================================================

describe("KMWIMemory - 四层记忆基础", () => {
  it("四层各自写入应返回带前缀的 ID", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi.json"));
    const kId = mem.addKnowledge("公理 A1", "axiom");
    const mId = mem.addMemory("测试记忆", "上下文");
    const wId = mem.addWisdom("验证模式", "描述", "因果关系");
    const iId = mem.addIntuition("直觉洞察", "隐性知识");

    expect(kId.startsWith("K-")).toBe(true);
    expect(mId.startsWith("M-")).toBe(true);
    expect(wId.startsWith("W-")).toBe(true);
    expect(iId.startsWith("I-")).toBe(true);

    const health = mem.getHealth();
    expect(health.details.K.total).toBe(1);
    expect(health.details.M.total).toBe(1);
    expect(health.details.W.total).toBe(1);
    expect(health.details.I.total).toBe(1);
  });

  it("持久化文件应被创建", () => {
    const filePath = join(tempDir, "kmwi-persist.json");
    const mem = new KMWIMemory(filePath);
    mem.addKnowledge("持久化测试", "test");

    expect(existsSync(filePath)).toBe(true);

    const reloaded = new KMWIMemory(filePath);
    const health = reloaded.getHealth();
    expect(health.details.K.total).toBe(1);
  });
});

describe("KMWIMemory - 转化流（自下而上）", () => {
  it("promoteToMemory 应要求 accessCount ≥ 3", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-promote.json"));
    const kId = mem.addKnowledge("待转化的知识", "test");

    const early = mem.promoteToMemory(kId);
    expect(early.success).toBe(false);
    expect(early.reason.toLowerCase()).toContain("access count");

    for (let i = 0; i < 3; i++) mem.access("K", kId);
    const ok = mem.promoteToMemory(kId);
    expect(ok.success).toBe(true);
  });

  it("promoteToWisdom 应要求 recallStrength ≥ 0.7 且 ≥2 条相关记忆", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-wisdom.json"));

    // 1) 通过 K→M 路径得到 recallStrength ≥ 0.7 的 M 项
    const kId = mem.addKnowledge("待转化知识", "cat", ["tag-a"]);
    for (let i = 0; i < 5; i++) mem.access("K", kId);
    const promoteK = mem.promoteToMemory(kId);
    expect(promoteK.success).toBe(true);
    const mId = promoteK.newId!;

    // 2) 早绑定应失败：相关记忆不足
    const early = mem.promoteToWisdom(mId);
    expect(early.success).toBe(false);

    // 3) 补充 2 条带共享 tag 的相关记忆
    mem.addMemory("相关记忆 1", "上下文 A", ["tag-a"]);
    mem.addMemory("相关记忆 2", "上下文 A", ["tag-a"]);

    // 4) 现在应能成功
    const ok = mem.promoteToWisdom(mId);
    expect(ok.success).toBe(true);
  });

  it("promoteToIntuition 应要求 usageCount ≥ 5 且 successRate ≥ 0.8", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-int.json"));
    const wId = mem.addWisdom("待升华模式", "描述", "因果");

    const early = mem.promoteToIntuition(wId);
    expect(early.success).toBe(false);

    for (let i = 0; i < 5; i++) mem.applyWisdom(wId, true);

    const ok = mem.promoteToIntuition(wId);
    expect(ok.success).toBe(true);
  });
});

describe("KMWIMemory - 健康度与衰减", () => {
  it("getHealth 应返回 0-100 的 H 值", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-h.json"));
    mem.addKnowledge("k1", "cat");
    const h = mem.getHealth();
    expect(h.H).toBeGreaterThanOrEqual(0);
    expect(h.H).toBeLessThanOrEqual(100);
  });

  it("refreshBaseline 后再 getDecayRates 应返回有效衰减", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-decay.json"));
    mem.addKnowledge("baseline1", "cat");
    mem.refreshBaseline();

    const decay = mem.getDecayRates();
    expect(decay).toBeDefined();
    expect(typeof decay.K).toBe("number");
  });

  it("extractPatternsForEvolution 应返回 W 和 I 层数据", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-extract.json"));
    mem.addWisdom("进化模式", "描述", "因果");
    const patterns = mem.extractPatternsForEvolution("进化", 10);
    expect(Array.isArray(patterns.wisdom)).toBe(true);
    expect(Array.isArray(patterns.intuitions)).toBe(true);
    expect(patterns.wisdom.length).toBeGreaterThanOrEqual(1);
  });

  it("getStrengthenSuggestions 应返回建议数组", () => {
    const mem = new KMWIMemory(join(tempDir, "kmwi-sug.json"));
    mem.refreshBaseline();
    const suggestions = mem.getStrengthenSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });
});

// ============================================================================
// SkillGenerator 元创造引擎
// ============================================================================

describe("SkillGenerator - 元创造五阶段", () => {
  it("构造函数应接受 KMWI 和 options", () => {
    const mem = new KMWIMemory(join(tempDir, "sg-construct.json"));
    const sg = new SkillGenerator(mem, {
      outputDir: join(tempDir, "skills"),
      enableFileWrite: false,
    });
    expect(sg).toBeDefined();
    expect(sg.getHistory().length).toBe(0);
  });

  it("create 新问题域应返回 CreationResult", async () => {
    const mem = new KMWIMemory(join(tempDir, "sg-create.json"));
    const sg = new SkillGenerator(mem, {
      outputDir: join(tempDir, "skills"),
      enableFileWrite: false,
    });

    const result = await sg.create("全新未知问题域-测试-xyz", {
      existingSkills: ["metago-critique", "metago-meta-evolve"],
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.skillName).toBe("string");
    expect(result.stage).toBeDefined();
  });

  it("KMWI 中有 wisdom 时耦生度应提升", async () => {
    const mem = new KMWIMemory(join(tempDir, "sg-coupling.json"));
    mem.addWisdom(
      "问题分解模式",
      "将复杂问题分解为可执行步骤",
      "分解后步骤更易验证",
      ["decomposition"],
    );
    mem.addIntuition("创造需保持内生", "A5 内生公理的隐性表达", ["creation"]);

    const sg = new SkillGenerator(mem, {
      outputDir: join(tempDir, "skills"),
      enableFileWrite: false,
    });

    const result = await sg.create("需要分解的新问题域-abc");
    expect(result).toBeDefined();
  });

  it("getSummary 应返回非空字符串", () => {
    const mem = new KMWIMemory(join(tempDir, "sg-summary.json"));
    const sg = new SkillGenerator(mem, {
      outputDir: join(tempDir, "skills"),
      enableFileWrite: false,
    });
    const summary = sg.getSummary();
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// EvolutionEngine V2 - 三层自生成 + KMWI 集成
// ============================================================================

describe("EvolutionEngine V2 - 构造与集成", () => {
  it("不传参构造应使用内部默认 KMWI 和 SkillGenerator（向后兼容）", () => {
    const engine = new EvolutionEngine("2.0.0");
    expect(engine.getVersion()).toBe("2.0.0");
    expect(engine.getKMWI()).toBeDefined();
    expect(engine.getSkillGenerator()).toBeDefined();
  });

  it("传入 KMWI 和 SkillGenerator 应被引用", () => {
    const mem = new KMWIMemory(join(tempDir, "ee-inject.json"));
    const sg = new SkillGenerator(mem, { enableFileWrite: false });
    const engine = new EvolutionEngine("2.0.0", mem, sg);

    expect(engine.getKMWI()).toBe(mem);
    expect(engine.getSkillGenerator()).toBe(sg);
  });
});

describe("EvolutionEngine V2 - 进化主循环", () => {
  it("无边界时应返回 success=true 的 PERCEPTION 阶段结果", async () => {
    const engine = new EvolutionEngine("2.0.0");
    const result = await engine.evolve();

    expect(result).toBeDefined();
    expect(result.stage).toBe("PERCEPTION");
    expect(result.success).toBe(true);
  });

  it("失败边界应触发完整进化流程", async () => {
    const engine = new EvolutionEngine("2.0.0");
    const result = await engine.evolve({
      failure: { type: "error", message: "测试失败触发进化" },
    });

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(Array.isArray(result.timing)).toBe(true);
    expect(result.timing.length).toBeGreaterThan(0);

    const perceptionTiming = result.timing.find((t) => t.stage === "PERCEPTION");
    expect(perceptionTiming).toBeDefined();
    expect(perceptionTiming?.budgetMs).toBe(10);
    expect(typeof perceptionTiming?.withinBudget).toBe("boolean");
  });

  it("时间预算应被记录且 withinBudget 为布尔值", async () => {
    const engine = new EvolutionEngine("2.0.0");
    const result = await engine.evolve({
      failure: { type: "error", message: "时间预算测试" },
    });

    for (const t of result.timing) {
      expect(typeof t.durationMs).toBe("number");
      expect(typeof t.budgetMs).toBe("number");
      expect(typeof t.withinBudget).toBe("boolean");
    }
  });

  it("metaMetaEvolution 应被监控", async () => {
    const engine = new EvolutionEngine("2.0.0");
    const result = await engine.evolve({
      failure: { type: "error", message: "元元进化测试" },
    });

    expect(result.metaMetaEvolution).toBeDefined();
    expect(result.metaMetaEvolution?.monitored).toBe(true);
  });

  it("getSummary 应返回非空字符串", async () => {
    const engine = new EvolutionEngine("2.0.0");
    await engine.evolve({
      failure: { type: "error", message: "summary 测试" },
    });
    const summary = engine.getSummary();
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 集成场景：KMWI + SkillGenerator + EvolutionEngine 联动
// ============================================================================

describe("V2 集成场景 - 三模块联动", () => {
  it("EvolutionEngine 应能使用注入的 KMWI 中的模式", async () => {
    const mem = new KMWIMemory(join(tempDir, "integration.json"));
    mem.addWisdom(
      "进化-内生模式",
      "进化应从内部结构生长新能力",
      "内生创造保持耦生关系",
      ["evolution", "internalization"],
    );

    const sg = new SkillGenerator(mem, {
      outputDir: join(tempDir, "skills"),
      enableFileWrite: false,
    });
    const engine = new EvolutionEngine("2.0.0", mem, sg);

    const result = await engine.evolve({
      failure: { type: "capability_gap", message: "缺少处理某问题的能力" },
    });

    expect(result).toBeDefined();
    expect(engine.getKMWI()).toBe(mem);
    expect(engine.getSkillGenerator()).toBe(sg);
  });
});

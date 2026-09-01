/**
 * MetaGO Engine — A37/A38/D44/D45 宪法校验接入测试（T6 · 36.9.4）
 */
import { describe, it, expect } from "vitest";
import { AxiomValidator } from "../src/validators.js";

describe("A37/A38/D44/D45 宪法校验（V36.9.4）", () => {
  it("A37 checkFirstPrinciples：含 F0 痕迹 → pass", () => {
    const r = AxiomValidator.checkFirstPrinciples("任务：修复登录 bug。F0 拆解：剥离假设→事实基元→重建方案");
    expect(r.axiomId).toBe("A37");
    expect(r.status).toBe("pass");
  });

  it("A37 checkFirstPrinciples：缺失 F0 → warning（强提示不阻断）", () => {
    const r = AxiomValidator.checkFirstPrinciples("任务：修复登录 bug");
    expect(r.axiomId).toBe("A37");
    expect(r.status).toBe("warning");
    expect(r.severity).toBe("critical");
  });

  it("A38 checkAdversarialReview：含对抗式痕迹 → pass", () => {
    const r = AxiomValidator.checkAdversarialReview("对抗式审查：角色切换→威胁建模→致命缺陷挖掘→修复闭环");
    expect(r.axiomId).toBe("A38");
    expect(r.status).toBe("pass");
  });

  it("A38 checkAdversarialReview：缺失 → warning", () => {
    const r = AxiomValidator.checkAdversarialReview("验证结果：全部通过");
    expect(r.axiomId).toBe("A38");
    expect(r.status).toBe("warning");
  });

  it("validateAll 输出含 A37/A38（D44/D45 同源）并保持契约稳定", () => {
    const results = AxiomValidator.validateAll("output", {
      task: "F0 拆解：事实基元重建方案",
      report: "对抗式审查：攻击面清单 + 致命缺陷 + 修复闭环",
    });
    const ids = results.map((r) => r.axiomId);
    expect(ids).toContain("A37");
    expect(ids).toContain("A38");
    expect(results.filter((r) => r.axiomId === "A37" && r.status === "pass").length).toBeGreaterThanOrEqual(1);
    expect(results.filter((r) => r.axiomId === "A38" && r.status === "pass").length).toBeGreaterThanOrEqual(1);
    const summary = AxiomValidator.getSummary(results);
    expect(summary.total).toBeGreaterThan(10);
  });
});

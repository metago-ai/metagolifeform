/**
 * T7 - README 链接活性检测
 *
 * 检测策略（按链接类型差异化）：
 * - npmjs.com/package/<pkg>：用 https://registry.npmjs.org/<pkg>/latest 检测包是否存在
 *   （npmjs.com 网页对所有 GET 返回 403 反爬，无法用 HTTP 状态判定）
 * - gitee.com / github.com：HEAD 请求 + 浏览器 UA，2xx/3xx 视为存在，404 视为不存在
 *   （403 可能是反爬或私仓，不视为失败）
 * - 其他链接：GET 请求，2xx/3xx 视为存在
 *
 * 历史：曾因 unpkg.com 链接 charset 缺失导致中文乱码，已替换为 gitee raw URL。
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import https from "node:https";

const pkgDir = resolve(__dirname, "..");
const readmePath = resolve(pkgDir, "README.md");

interface Link {
  text: string;
  url: string;
  isImage: boolean;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function extractLinks(markdown: string): Link[] {
  const linkRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
  const links: Link[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const isImage = match[1] === "!";
    const text = match[2];
    const url = match[3];
    if (url.startsWith("http://") || url.startsWith("https://")) {
      links.push({ text, url, isImage });
    }
  }
  return links;
}

function httpGet(url: string, timeout = 10000): Promise<number> {
  return new Promise((resolvePromise) => {
    const req = https.get(
      url,
      {
        timeout,
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/json,*/*",
        },
      },
      (res) => {
        resolvePromise(res.statusCode || 0);
        res.resume();
      },
    );
    req.on("error", () => resolvePromise(0));
    req.on("timeout", () => {
      req.destroy();
      resolvePromise(0);
    });
  });
}

/** 从 npmjs.com/package/<pkg> 提取包名（含 @scope） */
function extractNpmPackageName(url: string): string | null {
  const m = url.match(/npmjs\.com\/package\/(@?[\w-./]+)$/);
  return m ? m[1] : null;
}

/** 用 npm registry API 检测包是否存在 */
async function checkNpmPackageExists(pkg: string): Promise<boolean> {
  const escaped = pkg.replace("@", "%40");
  const url = `https://registry.npmjs.org/${escaped}/latest`;
  const status = await httpGet(url);
  return status === 200;
}

async function checkLink(url: string): Promise<{ ok: boolean; reason: string }> {
  // 1. npm 链接：用 registry API
  const npmPkg = extractNpmPackageName(url);
  if (npmPkg) {
    const exists = await checkNpmPackageExists(npmPkg);
    return {
      ok: exists,
      reason: exists ? "npm package exists" : "npm package not found",
    };
  }

  // 2. gitee/github 链接：gitee 对未登录请求统一返回 405（反爬），无法用 HTTP 状态判定
  // 只有 404 才视为"真的不存在"，其他状态都视为"可能存在"
  if (url.includes("gitee.com") || url.includes("github.com")) {
    const status = await httpGet(url);
    if (status === 0) return { ok: false, reason: "网络错误/超时" };
    if (status === 404) return { ok: false, reason: "404 Not Found" };
    // gitee 对未登录请求返回 405（反爬），github 对未授权 API 返回 403
    // 都不视为失败——这些平台的仓库实际状态需要登录才能准确判断
    return { ok: true, reason: `${status}（反爬或私仓，视为存在）` };
  }

  // 3. 其他链接：GET 请求
  const status = await httpGet(url);
  if (status === 0) return { ok: false, reason: "网络错误/超时" };
  return {
    ok: status >= 200 && status < 400,
    reason: `${status}`,
  };
}

describe("T7 - README 链接活性检测", () => {
  const readme = readFileSync(readmePath, "utf-8");
  const allLinks = extractLinks(readme);
  const externalLinks = allLinks.filter((l) => !l.isImage);

  it("README 应至少包含 1 个外链", () => {
    expect(externalLinks.length).toBeGreaterThan(0);
  });

  // 限制最多检测 15 个链接
  const linksToCheck = externalLinks.slice(0, 15);

  for (const link of linksToCheck) {
    const label = link.url.length > 60 ? link.url.slice(0, 60) + "..." : link.url;
    it(`链接应可访问：${label}`, async () => {
      const result = await checkLink(link.url);
      expect(result.ok, `${link.url} → ${result.reason}`).toBe(true);
    }, 30000);
  }

  it("README 不应包含已废弃的 unpkg.com 链接", () => {
    const unpkgLinks = externalLinks.filter((l) => l.url.includes("unpkg.com"));
    expect(
      unpkgLinks,
      `发现 ${unpkgLinks.length} 个 unpkg.com 链接，应替换为 gitee raw URL`,
    ).toEqual([]);
  });
});

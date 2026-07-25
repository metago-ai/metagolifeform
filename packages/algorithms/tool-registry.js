/**
 * tool-registry.js
 * 元构 927 算法 MCP 工具注册表
 *
 * 职责：
 *   1. 自动加载 tools/*.json schema
 *   2. 为每个工具创建 handler
 *   3. 提供 getAllSchemas() 和 getHandler(name) API
 *
 * 四层暴露架构：
 *   L1 通用入口（3）：execute / execute_sync / get_algorithm_info
 *   L2 检索发现（4）：list_algorithms / search_algorithms / list_families / get_statistics
 *   L3 高频专用（30）：cosine_similarity / euclidean_distance / ... （COUPLING 族 T1 30 个）
 *   L4 族级工具（20）：coupling_calculate / value_assess / ... （每族一个工具）
 */

const path = require('path');
const fs = require('fs');

const toolsDir = path.join(__dirname, 'tools');
const schemas = [];
const handlers = {};

// ============================================================================
// L1 通用入口 handler
// ============================================================================

function createExecuteHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] execute'],
        durationMs: Date.now() - startTime,
      };
    }
    const result = await registry.executeAlgorithm(args.id, args.input || {});
    return enrichResult(result, args.id, registry, 'execute', startTime);
  };
}

function createExecuteSyncHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] execute_sync'],
        durationMs: Date.now() - startTime,
      };
    }
    const result = registry.executeAlgorithmSync(args.id, args.input || {});
    return enrichResult(result, args.id, registry, 'execute_sync', startTime);
  };
}

function createGetAlgorithmInfoHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] get_algorithm_info'],
        durationMs: Date.now() - startTime,
      };
    }
    const alg = registry.getAlgorithmById(args.id);
    if (!alg) {
      return {
        success: false,
        error: `算法 ${args.id} 不存在`,
        provenance: ['[mcp_metago-algorithms] get_algorithm_info', `[not_found] ${args.id}`],
        durationMs: Date.now() - startTime,
      };
    }
    // 移除 handler 函数，避免序列化
    const { handler, ...meta } = alg;
    return {
      success: true,
      output: meta,
      provenance: ['[mcp_metago-algorithms] get_algorithm_info', `[info] ${args.id}`],
      durationMs: Date.now() - startTime,
      algorithmId: alg.id,
      algorithmName: alg.name,
      algorithmFamily: alg.family,
      algorithmTier: alg.tier,
    };
  };
}

// ============================================================================
// L2 检索发现 handler
// ============================================================================

function createListAlgorithmsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    let list = registry.getRegistry();
    if (args.tier) list = list.filter((a) => a.tier === args.tier);
    if (args.family) list = list.filter((a) => a.family === args.family);
    const limit = args.limit || 50;
    const total = list.length;
    list = list.slice(0, limit);
    // 移除 handler
    const sanitized = list.map(({ handler, ...meta }) => meta);
    return {
      success: true,
      output: { total, limit, algorithms: sanitized },
      provenance: ['[mcp_metago-algorithms] list_algorithms'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createSearchAlgorithmsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.query) {
      return {
        success: false,
        error: '缺少必填参数 query',
        provenance: ['[mcp_metago-algorithms] search_algorithms'],
        durationMs: Date.now() - startTime,
      };
    }
    // 自定义搜索：绕过引擎 searchAlgorithms 在某些算法 keywords 非 array 时的 bug
    const q = String(args.query).toLowerCase();
    const all = registry.getRegistry();
    const limit = args.limit || 20;
    const results = all.filter((a) => {
      if (!a) return false;
      const name = (a.name || '').toLowerCase();
      const id = (a.id || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const family = (a.family || '').toLowerCase();
      if (name.includes(q) || id.includes(q) || desc.includes(q) || family.includes(q)) return true;
      // 安全遍历 keywords（可能是 string / array / undefined）
      const kw = a.keywords;
      if (Array.isArray(kw)) {
        return kw.some((k) => String(k).toLowerCase().includes(q));
      } else if (typeof kw === 'string') {
        return kw.toLowerCase().includes(q);
      }
      return false;
    }).slice(0, limit);
    const sanitized = results.map(({ handler, ...meta }) => meta);
    return {
      success: true,
      output: { total: results.length, query: args.query, algorithms: sanitized },
      provenance: ['[mcp_metago-algorithms] search_algorithms', `[query] ${args.query}`, '[custom_search]'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createListFamiliesHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    const all = registry.getRegistry();
    const families = {};
    for (const a of all) {
      families[a.family] = (families[a.family] || 0) + 1;
    }
    return {
      success: true,
      output: {
        total: Object.keys(families).length,
        families: Object.entries(families)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
      provenance: ['[mcp_metago-algorithms] list_families'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createGetStatisticsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    const all = registry.getRegistry();
    const tiers = { T1: 0, T2: 0, T3: 0 };
    const families = {};
    for (const a of all) {
      tiers[a.tier] = (tiers[a.tier] || 0) + 1;
      families[a.family] = (families[a.family] || 0) + 1;
    }
    // getImplementedCount() 可能返回数字或对象 {t1,t2,t3,total}
    // implemented 字段语义：已实现算法数 = T1 已实现数（300）
    const impl = registry.getImplementedCount();
    const implemented = typeof impl === 'number' ? impl : (impl && impl.t1 != null ? impl.t1 : 0);
    return {
      success: true,
      output: {
        total: all.length,
        implemented,
        implementedBreakdown: typeof impl === 'object' && impl !== null ? impl : undefined,
        tiers,
        families,
        familiesCount: Object.keys(families).length,
      },
      provenance: ['[mcp_metago-algorithms] get_statistics'],
      durationMs: Date.now() - startTime,
    };
  };
}

// ============================================================================
// L3 高频专用工具 handler（COUPLING 族 T1 的 30 个数学算法）
// ============================================================================

const L3_ID_MAP = {
  cosine_similarity: 'ALG_T1_C_001',
  jaccard_coefficient: 'ALG_T1_C_002',
  dice_coefficient: 'ALG_T1_C_003',
  euclidean_distance: 'ALG_T1_C_004',
  manhattan_distance: 'ALG_T1_C_005',
  chebyshev_distance: 'ALG_T1_C_006',
  pearson_correlation: 'ALG_T1_C_007',
  spearman_correlation: 'ALG_T1_C_008',
  kendall_tau: 'ALG_T1_C_009',
  weighted_cosine: 'ALG_T1_C_010',
  fuzzy_string_match: 'ALG_T1_C_011',
  semantic_similarity: 'ALG_T1_C_012',
  cooccurrence_frequency: 'ALG_T1_C_013',
  time_decay_cooccurrence: 'ALG_T1_C_014',
  evaluate_bidirectional: 'ALG_T1_C_015',
  is_superconductive: 'ALG_T1_C_016',
  identify_weak_pairs: 'ALG_T1_C_017',
  identify_strong_pairs: 'ALG_T1_C_018',
  build_coupling_matrix: 'ALG_T1_C_019',
  normalize_coupling: 'ALG_T1_C_020',
  sort_coupling_scores: 'ALG_T1_C_021',
  record_symmetric: 'ALG_T1_C_022',
  detect_asymmetry: 'ALG_T1_C_023',
  coupling_trend: 'ALG_T1_C_024',
  coupling_clustering: 'ALG_T1_C_025',
  build_value_vector: 'ALG_T1_C_026',
  reduce_dimension: 'ALG_T1_C_027',
  extract_pca: 'ALG_T1_C_028',
  simplified_svd: 'ALG_T1_C_029',
  covariance: 'ALG_T1_C_030',
};

function createL3Handler(toolName, algorithmId) {
  return async (args, registry) => {
    const startTime = Date.now();
    const result = registry.executeAlgorithmSync(algorithmId, args);
    return enrichResult(result, algorithmId, registry, toolName, startTime);
  };
}

// ============================================================================
// L4 族级工具 handler（20 个算法族，每族一个工具）
// ============================================================================

const L4_FAMILY_MAP = {
  coupling_calculate: 'COUPLING',
  value_assess: 'VALUE',
  bias_detect: 'BIAS',
  logic_reason: 'LOGIC',
  evolution_evolve: 'EVOLUTION',
  creation_create: 'CREATION',
  negentropy_measure: 'NEGENTROPY',
  memory_operate: 'MEMORY',
  learning_learn: 'LEARNING',
  reasoning_chain: 'REASONING',
  intuition_gauge: 'INTUITION',
  conflict_resolve: 'CONFLICT',
  time_analyze: 'TIME',
  frequency_process: 'FREQUENCY',
  decision_decide: 'DECISION',
  security_assess: 'SECURITY',
  dialog_manage: 'DIALOG',
  proactive_suggest: 'PROACTIVE',
  idea_generate: 'IDEA',
  audit_check: 'AUDIT',
};

function createL4Handler(toolName, family) {
  return async (args, registry) => {
    const startTime = Date.now();
    const operation = args.operation || 'default';
    const input = args.input || {};

    // 在该族中查找匹配 operation 的算法
    const familyAlgs = registry.getAlgorithmsByFamily(family);
    if (!familyAlgs || familyAlgs.length === 0) {
      return {
        success: false,
        error: `族 ${family} 中没有算法`,
        provenance: ['[mcp_metago-algorithms] ' + toolName, '[empty_family] ' + family],
        durationMs: Date.now() - startTime,
        algorithmFamily: family,
      };
    }

    const opLower = operation.toLowerCase();
    const matched = familyAlgs.find(
      (a) =>
        a.name.toLowerCase().includes(opLower) ||
        a.id.toLowerCase().includes(opLower) ||
        (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(opLower)))
    );

    const targetAlg = matched || familyAlgs[0];
    const targetId = targetAlg.id;

    // 尝试同步执行
    let result = registry.executeAlgorithmSync(targetId, input);

    // 异步回退：如果同步执行失败且错误含"异步"字样，改用异步执行
    if (
      !result.success &&
      result.error &&
      (result.error.includes('异步') || result.error.includes('async'))
    ) {
      result = await registry.executeAlgorithm(targetId, input);
    }

    const enriched = enrichResult(result, targetId, registry, toolName, startTime);
    enriched.operation = operation;
    enriched.matched = !!matched;
    if (!matched) {
      enriched.warning = `未找到匹配 operation="${operation}" 的算法，使用族默认算法 ${targetId}。可用算法：${familyAlgs.slice(0, 5).map((a) => a.id).join(', ')}...`;
    }
    return enriched;
  };
}

// ============================================================================
// 结果富化函数（填充 algorithmId/Name/Family/Tier/provenance/durationMs）
// ============================================================================

function enrichResult(result, algorithmId, registry, toolName, startTime) {
  const alg = registry.getAlgorithmById(algorithmId);
  const durationMs = Date.now() - startTime;
  // 兼容 result 直接是算法返回值（无 success 字段）的情况
  const isSuccess = result && typeof result === 'object' && 'success' in result
    ? result.success
    : true;
  return {
    success: isSuccess,
    output: isSuccess && result && result.output !== undefined ? result.output : (isSuccess ? result : undefined),
    error: result && result.error ? result.error : undefined,
    provenance: [
      '[mcp_metago-algorithms] ' + toolName,
      '[engine] ' + (result && result.async ? 'executeAlgorithm' : 'executeAlgorithmSync'),
      algorithmId,
      ...((result && result.provenance) || []),
    ],
    durationMs,
    algorithmId,
    algorithmName: alg ? alg.name : 'unknown',
    algorithmFamily: alg ? alg.family : 'unknown',
    algorithmTier: alg ? alg.tier : 'unknown',
  };
}

// ============================================================================
// 初始化：加载所有 schema 并创建 handler
// ============================================================================

function initialize(registry) {
  schemas.length = 0;
  Object.keys(handlers).forEach((k) => delete handlers[k]);

  const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const schema = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));
    schemas.push(schema);

    const toolName = schema.name;
    let handler;

    // L1 通用入口
    if (toolName === 'execute') handler = createExecuteHandler();
    else if (toolName === 'execute_sync') handler = createExecuteSyncHandler();
    else if (toolName === 'get_algorithm_info') handler = createGetAlgorithmInfoHandler();
    // L2 检索发现
    else if (toolName === 'list_algorithms') handler = createListAlgorithmsHandler();
    else if (toolName === 'search_algorithms') handler = createSearchAlgorithmsHandler();
    else if (toolName === 'list_families') handler = createListFamiliesHandler();
    else if (toolName === 'get_statistics') handler = createGetStatisticsHandler();
    // L3 高频专用
    else if (L3_ID_MAP[toolName]) handler = createL3Handler(toolName, L3_ID_MAP[toolName]);
    // L4 族级工具
    else if (L4_FAMILY_MAP[toolName]) handler = createL4Handler(toolName, L4_FAMILY_MAP[toolName]);
    // 默认 handler
    else {
      handler = async () => ({
        success: false,
        error: `工具 ${toolName} 的 handler 未实现`,
        provenance: ['[mcp_metago-algorithms] ' + toolName, '[no_handler]'],
      });
    }

    handlers[toolName] = handler;
  }
}

// ============================================================================
// 模块导出
// ============================================================================

module.exports = {
  initialize,
  getAllSchemas: () => schemas,
  getHandler: (name) => handlers[name],
  getHandlerCount: () => Object.keys(handlers).length,
  L3_ID_MAP,
  L4_FAMILY_MAP,
};

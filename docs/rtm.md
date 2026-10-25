# UDGK RTM · 元构 v36.10.0 需求追踪矩阵

> 本表由 `fill_rtm.py` 生成，每条需求都可复跑验证。
> 证据列写的是**命令与输出**，不是结论性描述。

| 编号 | 要求 | 代码位置 | 断言测试 | 验收证据 |
|---|---|---|---|---|
| R01 | T3 227 条算法从概念存档转为真实可执行 | `packages/algorithms/engine/algorithms/t3impl/families/*.js (16 族)` | t3impl/t3test.cjs 227/227 + 反桩检测 | node t3impl/t3test.cjs → 通过 227 / 失败 0 / 未实现 0 |
| R02 | T3 接入上游原生执行路径（非本工程转接层） | `packages/algorithms/engine/algorithms/registry.js (T3-BINDING 段)` | executeAlgorithmSync('ALG_T3_C_001') 返回真实 output | success:true output:{phaseDiff,couplingScore,progressEfficiency,alignment} |
| R03 | 公理从 12 条补到蓝本全量 | `packages/engine/CONSTITUTION/AXIOMS.md` | verify-package E4：A 编号 ≥38 | 实收 38 条（A1-A30/A34-A36/A39-A43） |
| R04 | 属性从 11 条补到全覆盖 | `packages/engine/CORE/ATTRIBUTES.md` | verify-package E1：D 编号 = 47 | 实收 47 条（D1-D47 无缺口） |
| R05 | 协议从 6 条补到全覆盖 | `packages/engine/CORE/PROTOCOLS.md` | verify-package E2：≥108 | 实收 121 条（多于声明 108） |
| R06 | 引擎清单从无到全覆盖 | `packages/engine/INDEX/ENGINES.md` | verify-package E3：≥125 | 实收 161 条（多于声明 125） |
| R07 | 473 条无契约原子创造 I/O 契约 | `蓝本/附录卷-原子契约补全-V36.11.md` | 契约表行数 = 468，待设计 5 条 | 468 条带可验证判据 + 5 条哲学族待设计 |
| R08 | 契约变成可执行判定（非文档） | `packages/engine/atoms/contract-validator.cjs` | verify-package K1：592 契约 × 原子，0 失败 | 契约 592 条，compute 50/50，工厂 468/468，全过 |
| R09 | 契约驱动工厂：从契约生成符合判据的实现 | `packages/engine/atoms/atom-factory.cjs` | 工厂自测：468/468 符合契约 | 生成实现 468 ｜ 符合契约 468 ｜ 不符合 0 |
| R10 | 手写 compute 原子（逐条语义实现） | `packages/engine/atoms/engine.cjs` | atoms/verify.cjs：50/50 + 诚实性校验 | compute 50 通过 50 / 失败 0；非 compute 一律 success:false |
| R11 | 13 个技能文件中指向假行号的引用迁移到真实位置 | `skills/metago-*/SKILL.md, AGENTS.md L4` | verify_refs.py 20/20 | 14 处引用 + 2 处蓝本行 + 4 处 AGENTS 行，全部命中 |
| R12 | 公理/属性编号与蓝本对齐（方案乙：保留旧号加注真实号） | `AGENTS.md L128-L151` | verify_refs.py 抽样；AGENTS 已重载生效 | 12 处加注，如 A1（蓝本 A29）、D37（蓝本 D36） |
| R13 | 蓝本换代：14 文件逐行校验 | `元构初始文档/附录卷-第1~4部分` | blueprint_map 逐行比对 | 34,653 / 34,655 行一致 = 99.99% |
| R14 | 数字矛盾收敛到单一真相源 | `genome/FACTS.json` | verify-package F1：可解析且带裁决 | 51 条事实 / 3 组冲突 / 7 条权威裁决 |
| R15 | 产出一份可安装、可复跑验收的安装包 | `outbound/v36.10.0/metagolifeform-v36.10.0` | verify-package.cjs 18 项断言 | 18/18 PASS，6,000 文件 / 32.41 MB |
| R16 | 从任意工作目录可加载并执行（可移植性） | `包内 registry 与自测脚本` | verify-package J1：cwd=C:\ 加载 | 注册表 927，T3 227/227，执行成功 |
| R17 | 法则要求的硬门脚本实际可执行 | `$DSH_HOME/scripts/（36 文件 + 3 转发垫片）` | node scripts/memory-guard.cjs 实跑 | 1 通过 / 4 警告 / 1 失败（如实报出未初始化项） |
| R36 | **外部依赖纠错：9 → 5 条** | `atoms-crypto-emotion.cjs` | 自测 9/9 + 工厂路径 7/7 | **4 条误判改为真实实现（AES-256-GCM 加解密 / 词库情绪识别 / 结构化无障碍分块）；工厂生成 583→587；剩余 5 条逐条复核确认为真实外部依赖** |
| R219 | **第二批 11 条实现（CORR-047）** | `blueprint-atoms-2.cjs` + 补丁 P25 | L-1/L-2/L-3 + 语义抽查 | **11/11 通过；语义抽查 10/10** |
| R220 | **不支持项 14 → 3** | `atom-factory.cjs` MODEL_NEEDED/EXTERNAL_NEEDED | make() 分布 | **{526,52,11,5,3} = 597** |
| R216 | **T3 绑定统计检查（DEF-091）** | `check_t3_binding.cjs` | bound==total==227 且 families==16 | **已入回归；实测 227/227/16 PASS** |
| R217 | **最终全量验收** | `final_acceptance.py` | 19 项 | **19/19 PASS** |
| R218 | **交付报告** | `docs/R141-交付报告.md` | 八节完整 | **已生成** |
| R211 | **12 条假实现改诚实标注（DEF-087）** | `atom-factory.cjs` MODEL_NEEDED + 补丁 P24 | make() 返回 null | **597 分布 {526,52,5,14}；14 条全 null；契约校验 533/0/0** |
| R212 | **r4 数值溢出（DEF-088）** | `blueprint-atoms.cjs` | 恶意数值输入扫描 | **52×8 输入污染 0 次** |
| R213 | **三形式等价** | `verify_three_forms2.mjs` | 三入口同算一值 | **5/5 一致** |
| R214 | **对抗式审查（A38）** | `adversarial_review.mjs` | 7 攻击面 | **A1/A3/A4/A6/A7 未突破；A5 已修；A2 危险项已修** |
| R215 | **法则附录二/三** | AGENTS.md | 能力边界 + 活界面生效规则 | **已写入** |
| R208 | **52 条蓝本原子实现（DEF-084）** | `blueprint-atoms.cjs` + 补丁 P23 | L-1/L-2/L-3 三层 | **52/52 三层全过；597 条按来源 factory-gen 538 + blueprint 52 + constraint 5 + null 2** |
| R209 | **契约校验器覆盖全量（DEF-085）** | `contract-validator.cjs` | 遍历 597 而非 473 | **通过 545 / 失败 0 / 无实现 0** |
| R210 | **去除静默降级（DEF-086）** | `atom-factory.cjs` loadBlueprintAtoms | 语法错必抛 | **不存在跳过 / 加载失败抛 [R141-BP-ATOMS]** |
| R204 | **U-02~U-06 五面扫描** | `scan_mcp_surfaces.mjs` + 直接工具调用 | S1/S2 + 健康检查 | **playwright 24 工具 schema 全合格；web-session/yili/scrapling 均健康** |
| R205 | **U-08 prompts 扫描** | `scan_prompts_and_atoms.mjs` | prompts/get 8 个 | **全部实质（91–219 B）** |
| R206 | **U-07 597 原子归属核对** | `probe_atoms2~6.mjs` | getAllContracts × COMPUTE 差集 | **525 有归属 / 72 无归属（DET 58 + MODEL 11 + EXT 3）** |
| R207 | **5 个哲学族原子补齐（DEF-083）** | `atom-factory.cjs` CONSTRAINT_IMPL + 补丁 P22 | 违背/合规样本 | **违背精确命中、合规放行；工厂覆盖 468→473；契约校验 PASS** |
| R201 | **metago 工具性质明示（DEF-080）** | `scripts/classify-metago-tools.mjs` + AGENTS.md §18.3/§17.4/§19.6 | 55 工具逐个 tools/call 分类 | **注入 54 / 上报 1 / 计算 0；三处法则标注一致；分类落档** |
| R202 | **编号与引用规范（DEF-081）** | AGENTS.md §1.0 | 5 条铁律 | **已就位；章节数仍 20** |
| R203 | **上报工具语义明示（DEF-082）** | AGENTS.md §18.3 性质表 | 实测 401 被 ok:true 掩盖 | **已在法则明示；未改上游实现** |
| R197 | **旧产物清理（DEF-078）** | 删除 `metago/algorithm-coverage.json` + 作废说明 | 全盘无残留 | **已删除留说明；四个权威脚本清单在说明里** |
| R198 | **§17.10 版本表自动核对（DEF-078）** | `scripts/sync-law-versions.py` | --check | **2.1.3 / 1.3.4 / 1.0.3 三行全对；已入回归** |
| R199 | **附录三处陈述对齐（DEF-078）** | AGENTS.md 附录 | 实测比对 | **927=300+400+227 且由 P21 维护；函数型形参附安全边界；432 条实测正确** |
| R200 | **接管包时效性（DEF-079）** | `D:\DSH-Official\handoff\*.md` | 三类分开处理 | **A 类端口不写死（声明段 0 个具体端口）；B 类正文未改仅加声明；C 类不动** |
| R193 | **函数型形参桥接（DEF-075）** | `registry.js` metagoCoerceFn + `patches/r141-positional.tpl` | 字符串 / {__fn__} / 非法表达式 | **两种写法都跑出真实矩阵；非法表达式报 R141-FN-BRIDGE；31 条桥接失败 0** |
| R194 | **T3 227 条样例（DEF-076）** | `gen_t3_shapes2.mjs` + `merge_t3_shapes.mjs` + `fix_k7_fields.mjs` | shapes.json 计数 + K6/K7 | **700 → 927；227/227 跑通；K6 冲突 0 / K7 错配 0** |
| R195 | **T3 样例登记 P21** | `reapply-patches.cjs` + `patches/r141-t3-shapes.json` | --check | **17 组全部在位** |
| R196 | **检测器职责边界（DEF-077）** | `mcp-tools-callable.cjs` + `mcp-tools-semantic.cjs` | --check | **协议层 112/112 ｜ 语义层 有牙 5/5 + 30/30** |
| R188 | **执行器位置参数展开（DEF-072）** | `registry.js` metagoInvoke + `patches/r141-positional.tpl` | identify_strong_pairs 传 threshold=0.7 | **算法收到 0.7（原 0.9）；单形参算法结果完全不变** |
| R189 | **MCP L3 适配层 + 输出守卫（DEF-072）** | `tool-registry.js` L3_ADAPT 30 条 + `patches/r141-l3-adapt.tpl` | 30 工具按 schema 传参 + 语义断言 | **30/30 PASS；空壳不再报成功** |
| R190 | **语义检测器（DEF-074）** | `scripts/mcp-tools-semantic.cjs` | 三层判据 + 有牙自检 | **有牙 5/5 ｜ 语义 30/30；已入回归 L2** |
| R191 | **自检退化修复（DEF-073）** | `status.js` 正则放宽 + `scripts/lifeform-status-audit.py` | 独立调 parseLaw | **公理 10 / 属性 9；反向+兼容验证通过；已入回归 L3** |
| R192 | **补丁登记 P19/P20** | `reapply-patches.cjs` + `scripts/patches/*.tpl` | --check | **16 组全部在位；回归期望同步 14→16** |
| R186 | **Agent 预设描述自动同步（DEF-071）** | `sync-preset-desc.py` | 六道闸 + 实测重算 | **description/注释由实测生成；plugin 21 行未变；prefix 未动；CRLF 保持；--check PASS** |
| R187 | **预设同步纳入回归** | `full-regression.py` L5 | --check 只读模式 | **回归 36 → 37 项，全绿** |
| R185 | **占位符全域扫描（CORR-039）** | `placeholder_sweep.py` | 340 文件两轮筛 + 人工核实 | **118→28→0 真占位符；剩余均为检测机制与测试样本** |
| R184 | **RTM 完整性门（CORR-038）** | `rtm-gate.py` | 锚定正则计数 | **183 行 / R1–R183 连续 / 无重复 / 证据全非空；已入回归 L3** |
| R183 | **hooks 平台适用性声明（DEF-068）** | `declare_hook_scope.py` | 核查 hooks 配置与 DSH 侧 | **AGENTS.md 补第 6 条；明确 DSH 等价机制与「禁止声称自动拦截」红线** |
| R181 | **第零道硬门可用（DEF-067）** | `fix_memory_guard.py` | memory-guard 实跑 | **硬失败 1→0；project_memory.md 建立；退出码 0** |
| R182 | **veracity 用法纠正（CORR-037）** | `guard-chain-gate.py` | report 传文本 | **可提取+对账；claim 仅预览（设计如此）** |
| R179 | **完整性治理上线（DEF-065）** | `init_completeness.py` + `register_gaps.py` | target→AGENTS.md | **verify 由「文档不存在」→ 覆盖 71/259；190 项缺口分 7 组登记** |
| R180 | **补 traceId 机制（DEF-066）** | `add_traceid.py` | completeness B5 基线 | **§4.6.1 追溯标识；覆盖 69→71；20 章不变** |
| R178 | **CLI 两条能力链实测（CORR-036）** | `cli_plugin_arch_test.py` | plugin-pack / arch init+check | **4 套插件包 582 文件全有清单；arch 覆盖率 100% 违规 0；加入回归 L5** |
| R175 | **CLI 子命令实测** | `cli_subcommand_test.py` | 11 子命令中只读 3 个真跑 | **version/arch version/list-backups 全部 rc=0** |
| R176 | **元数据与文档版本修正（DEF-062/063）** | `fix_pkg_meta.py` + `fix_stale_ver_docs.py` | 13 文件逐行判定 | **metago 块 17 字段对齐实测；当前声明已无 V36.9.6** |
| R177 | **子包 rules_version 回写（DEF-064）** | `fix_pkg_rules_version.py` | 包内 vs 装机对比 | **5/5 一致；修复可存活于重装** |
| R173 | **版本一致性总检（CORR-035）** | `version_consistency.py` | 26 项逐项 | **26/26 一致；加入回归 L5；原文层豁免** |
| R174 | **端到端能力实证** | skill 加载 + yili + algorithms 实调 | 行为级验证 | **metago-core/metago-bazi 可加载；bazi_calc 返回完整四柱；cosine 返回 score=1** |
| R171 | **离线包重打（DEF-060）** | `rebuild_offline.py` | scripts 174→182 逐项对比 | **offline tgz 1.75 MB；portable 1,025 文件；自检 59/59** |
| R172 | **files 补根级入口（DEF-061）** | package.json files 23→24 | fresh_install | **PASS（可生成/内容完整/解包可运行）** |
| R170 | **回归扩到 31 项（全脚本语法门）** | scripts-syntax-gate.py | 443 文件语法 | **31/31 全绿；单项超时 900→2400s** |
| R169 | **全脚本语法门（CORR-034）** | `scripts-syntax-gate.py` | node --check / ast.parse 443 文件 | **443/443 通过；加入回归 L5；替代慢且危险的执行式冒烟** |
| R165 | **MCP 全线崩溃修复（DEF-053/056）** | `fix_dc_final.py` + `patch-dedupe.cjs` | decision-lock 157 份重复 → 1 份 | **mcp-all-health 6/6 恢复；162 工具可用；补丁幂等守卫上线** |
| R166 | **样例契约修正（DEF-057）** | `fix_shapes_9.py` + `fix_shapes_2.py` | 按源码真实契约 | **输出污染 4→0；K7 错配 5→0** |
| R167 | **全局安装核验修正（DEF-058）** | `fix_audit_global.py` | 清单改 scoped5+非scoped4 | **5/5 + 4/4 + 跨目录 3/3 PASS** |
| R168 | **蓝本总索引恢复（DEF-059）** | 从包内恢复 | 0 B → 7887 B | **蓝本 16 文件 / 2,060,388 B 全部非空** |
| R164 | **补丁组数期望串同步（DEF-051）** | `fix_patch_count.py` | 三个脚本逐处核对 | **13→14 同步；clean_env 19/19；全量回归 30/30** |
| R163 | **退出码引用未定义变量（DEF-050/CORR-030）** | `fix_exitcode_var.py` | 实跑 + 静态检查 | **conflicts→issues；新增 exit 变量存在性检查** |
| R162 | **硬驱动工具响应性 + ILT 关键词补齐（DEF-049）** | `harddriven-responsive-test.cjs` + `fix_ilt_keywords.py` | 9 工具 × 2 输入 + 5 例实跑 | **关键词表 8→26 个；依据/推导/综上 等中文推理词已识别** |
| R161 | **agents 深度 + prompts 端到端** | `agent_depth_audit.py` + `prompts-invoke-test.cjs` | 35 agents + 8 prompts | **agents 35/35 有方法结构；prompts 8/8 可调用返回实质内容** |
| R160 | **残旧数字全系统清扫（CORR-029）** | `stale_numeric_sweep.py` + `fix_stale_declared.py` | 56 处命中逐条分类 | **修 3 处当前声明；蓝本原文层保留；复扫当前声明 0 处** |
| R158 | **13 专家技能补方法论（DEF-047）** | `upgrade_13_experts.py` | 逐个体积+结构核对 | **707–918 B → 1333–1592 B；<300 B 档归零** |
| R159 | **metago-core 知识索引重写（DEF-048/CORR-028）** | `fix_metago_core.py` | 数字逐项对 K16 | **旧值 984/161 引擎/112 个技能 全清；新版全对实测** |
| R156 | **全量回归单命令（五层 29 项）** | `full-regression.py` | 一条命令跑完 | **29/29 全绿；--fast 13 项；--layer N 分层** |
| R157 | **移除包内开发脚本（DEF-046）** | `fix_regression_two.py` | 包↔装机差集 | **差集归零；L3 由 FAIL 转 PASS** |
| R155 | **退出码引发的连带问题（DEF-044/045）** | `fix_verify_capture.py` + `fix_py_capture.py` + `restore_responsive_scan.py` | 包验收复跑 | **16 处 execFileSync → runCapture；损坏文件从干净基准确认恢复；34/34 PASS** |
| R154 | **门禁检查器退出码全覆盖（CORR-026/027）** | `fix_all_exit_codes.py` + `fix_exit_codes_correct.py` | 23 个门禁类逐个补 + 实跑验证 | **23/23 均有退出码；reference_audit2 改为四类之和** |
| R153 | **断言质量审计（DEF-043/CORR-025）** | `assertion_quality2.py` | 8 个测试集 × 3 种写法 | **恒真断言 0 处；atom-hollow-scan 补退出码** |
| R152 | **检查器「有牙」元-元审计（DEF-042/CORR-024）** | `checker_teeth_audit.py` | 24 个判定型脚本 | **24/24 均有失败分支；audit_install.py 补判定+退出码** |
| R151 | **引用审计两轮修正（CORR-022/023）** | `reference_audit2.py` | 脚本/工具/prompt/技能/路径 五类 | **首轮误报 23 → 次轮 2 → 归零；真悬空 0 处** |
| R149 | **包↔装机全类别核对（DEF-040）** | `pkg_vs_installed.py` | 10 类别 + 脚本文件级 | **技能 112=112；脚本差 3 个（UDGK shim）→ 补齐 159** |
| R150 | **UDGK 端到端冒烟 + init bug 修复（DEF-041）** | `udgk_smoke.py` + `fix_udgk_init2.py` | init→verify 全链路 | **init 建出 e2e/asserts/；空 RTM 正确 FAIL；门禁提示精确化** |
| R146 | **差异化审计（通用化 DEF-037 教训）** | `differentiation-audit.cjs` | 7 组产物哈希比对 | **7/7 组全部差异化；并由此发现包内技能缺 11 个** |
| R147 | **补齐包内 11 个易理族技能（DEF-038）** | `sync_missing_skills.py` | 包↔装机差集 | **101 → 112，与装机完全一致** |
| R148 | **易理技能引擎引用去硬编码（DEF-039）** | `fix_yili_engine_ref.py` | 22 处替换 + 复扫 | **硬编码 DH工作区 归零；改为 yili MCP 14 工具** |
| R144 | **平台适配差异化修复（DEF-037）** | `fix_adapter_replacements.py` | 11 文件 SHA256 比对 | **修前唯一哈希 1/11（全同）→ 修后 11/11（全不同）；平台名各出现 18-21 次** |
| R145 | **11 平台内容质量审计** | `platform_content_audit.py` | 版本/占位符/章节/BOM/污染 | **11/11 全绿；1557 行；0 占位符；0 缺章节；无交叉污染** |
| R141 | **全新安装模拟（DEF-035）** | `fresh_install_test.py` + `tarball_content_audit.py` | npm pack → 解包 → 核对 | **tarball 可生成（1.6MB/970 文件）；核心资产齐全；补 files 字段 4 项** |
| R142 | **离线安装版修复（DEF-036）** | `fix_local_edition.py` | 自检脚本 | **57/59 → 59/59；重打 36.11.0 包；Engine 期望值纠正** |
| R143 | **11 平台法则升级到 V36.11.0** | `build-adapters.cjs` + `install_platform_adapters.py` | 逐平台版本复核 | **11/11 全部 V36.11.0（升级前 V36.9.1~V36.9.6）** |
| R139 | **CWD 无关性验证** | `cwd_independence.py` | 4 个目录 × 14 脚本 | **56/56 全部 PASS；不依赖工作目录** |
| R140 | **包可移植性验证（DEF-034）** | `pkg_portability.py` | 整包复制到临时目录跑 8 脚本 | **8/8 PASS；顺带发现交付包缺 rules_version 并补齐** |
| R137 | **干净环境全套验证（CORR-020）** | `clean_env_verify2.py` | 19 项逐个跑 | **19/19 全绿；不设任何 METAGO_* 变量** |
| R138 | **多副本残留修复（CORR-021）** | `fix_residual_111.py` | 三处 SHA256 比对 | **三处一致 c5e4675；此前只改一处，同步会回滚** |
| R136 | **DEF-030 真修复（CORR-019）** | `fix_health_python_chain.py` | 不设环境变量跑包验收 | **K5 PASS 6/6 组；候选链改为「筛存在的绝对路径 + 保留相对命令」** |
| R134 | **蓝本五项声明核实（DEF-033）** | `verify_blueprint_claims3.py` | 表格行计数 | **38/47/121/161/597 全部一致；发现原判定方法描述有误并改正** |
| R135 | **K16 断言（蓝本声明 vs 实体）** | `fix_claim_method_and_add_k16.py` | 包验收 33 → 34 项 | **K16 PASS（一致 5 / 不一致 0）** |
| R133 | **法则能力计数纠错（DEF-032）** | `fix_mcp_counts_in_law.py` | AGENTS.md 复测 | **§19.6 改为 6 服务器/162 工具实测表；§18.9/§18.10 标为快照** |
| R131 | **元验证：脚本期望 vs 实测** | `audit-expectations.cjs` | 逐条核对 | **抓到 2 处注释过期（111→112、116→112），已改为不带写死数字的表述** |
| R132 | **原子文档覆盖核实（CORR-018）** | `atom_never_documented.py` | 清单−全 16 卷 | **597 个原子从未提及 = 0；我最初的「缺 120」判断不成立** |
| R129 | **全局用户级审计修正（DEF-031）** | `fix_global_audit.py` | 重跑审计 | **scoped 3/3 + 非 scoped 4/4；此前误报缺 2 个** |
| R130 | **断言数口径 32 → 33 全同步** | `fix_index_33.py` | 总索引 + AGENTS.md | **4 处同步；K15 已写入蓝本口径** |
| R127 | **脆弱调用全盘扫描** | `scan_fragile_invocation.py` | 157 个脚本 | **裸 python 3 处（1 处为语言标签误报）；硬编码路径为机器特定分析工具，不算缺陷** |
| R128 | **装机脚本分类清理（CORR-017）** | `classify_scripts.py` + `cleanup_*` + `restore_*` | 归档 42 → 误删 3 → 恢复 3 | **118 装机 + 39 归档；MANIFEST.json 记录；复验全绿** |
| R125 | **输出污染清零** | `fix-2-final.cjs` | 全量复扫 694 条 | **103 → 0；K15 由「≤2」收紧为「必须 = 0」** |
| R126 | **修复健康检查 python 解析（DEF-030）** | `fix_health_python.py` | 不设环境变量重跑 | **6/6 PASS（scrapling 127ms/5 工具）；此前唯一 Python 服务被误判超时** |
| R123 | **逐条读源码修最后 15 条** | `fix-15-manual.cjs` + `fix-8-manual.cjs` + `fix-3-final.cjs` | 每条单独试跑 | **污染 15 → 8 → 3 → 2；修复数组的数组/对象数组/嵌套对象/函数型形参四类** |
| R124 | **K15 输出洁净度断言** | `add_k15.py` | 包验收 32 → 33 项 | **已知 2 例外；任何新算法出现污染即 FAIL** |
| R121 | **手工构造样例（读源码）** | `fix-28-manual.cjs` + `fix-6-manual.cjs` | 逐条试跑验证 | **污染 28 → 15；含数组的数组、函数型形参 __fn__ 等特殊结构** |
| R122 | **登记剩余 15 条 + 撤回坏修复（CORR-015）** | FACTS.output_pollution | 全量回归 | **700/700、474/474、K6、K7、慢算法 全部保持；15 条清单已登记** |
| R119 | **输出 NaN/null 污染扫描** | `null-nan-scan.cjs` | 695 条 success 算法递归扫描 | **初测 103 条含 NaN/Inf/全 null** |
| R120 | **四轮形状修复（DEF-029）** | `fix-null-shapes{,2,3,4}.cjs` | 修复后复扫 + 全量回归 | **103 → 28（修复 73%）；700/700、474/474、K6、K7 全部保持；剩余 28 条已登记** |
| R117 | **negentropy_monitor 接熵算子** | `wire_negentropy_tool.py` | 4 组入参（集中/均匀/文本/无数字） | **负熵 0.8656 / 0 / 0.0375 / 明确报「需数值」；硬驱动 11→12** |
| R118 | **补丁自愈扩到 13 组** | `update_patch_inventory2.py` | --check 复跑 | **P15 emotion/P16 negentropy/P17 词库纳入守护；13/13 在位；MCP 112/112；包验收 32/32** |
| R114 | **metago_emotion 接真分类器** | `wire_emotion_tool2.py` + `fix_emotion_esm.py` | MCP 端到端 2 用例 | **愤怒句→anger 80.7%；硬驱动 10→11** |
| R115 | **修复 ESM 里 require 静默失败（CORR-013）** | `fix_emotion_esm.py` | 加载验证 | **createRequire 替代 require；此前所有候选路径静默失败** |
| R116 | **情绪词库扩充（DEF-028）** | `expand_emotion_lexicon.py` | 8 用例 | **每类 6-11 词 → 24-30 词；「心情很好」由 neutral→joy；8/8 判定正确** |
| R111 | **4 个工具接入 AxiomValidator** | `wire_more_axiom_tools.py` | MCP 端到端逐个调用 | **compliance 返回 A36 WARNING；data_provenance 返回 A1 PASS；critique/objectivity 首测仍软驱动** |
| R112 | **修复 TOOLKIT_TOOLS 无分发（CORR-011）** | `wire_toolkit_harddriven.py` | 复测 2 工具 | **critique→D39 WARNING、objectivity→D38 PASS；硬驱动 8→10** |
| R113 | **补丁自愈扩到 10 组** | `update_patch_inventory.py` | --check 复跑 | **P13/P14 纳入守护；10/10 在位；MCP 112/112 可调用；包验收 32/32** |
| R109 | **陈旧数字全量扫描与同步** | `scan_stale_numbers.py` + 4 个 fix 脚本 | 35 处命中逐条分类 | **4 处需更新 + 2 处补充；误命中（原子 ID/专利号/历史记录）不改** |
| R110 | **包↔活系统 3 处差异同步** | `sync_live_to_pkg.py` | 逐文件 SHA256 | **AGENTS/总索引/mutation-test 已同步；33/33 一致** |
| R107 | **3 个「需外部」原子真实实现** | `atoms-cosmic-bio.cjs` + `wire_cosmic_bio_atoms.py` | 13 项自测 + 工厂复测 | **引力波匹配滤波(SNR 8.8)/分布式 CRDT 融合/跨物种声学特征；实现 587→590，外部 5→2** |
| R108 | **修复 K11 解释器解析（DEF-027）** | `fix_k11_python.py` | 包验收复跑 | **K11 由 FAIL→PASS；包验收 32/32** |
| R105 | **算法语义不变量测试（34 项）** | `algo-semantic-invariants.cjs` + `add_k14.py` | 自反/对称/三角/值域 | **34/34 通过；首轮 4 项失败全为我方入参或期望错** |
| R106 | **K14 断言固化** | verify-package.cjs | 包验收 31 → 32 项 | **K14 34 项不变量每次验收都跑** |
| R103 | **算子语义全量断言（86 项）** | `ops-semantic-full.cjs` + `add_k13.py` | 39 算子 × 数学性质 | **86/86 通过；首轮 2 处失败均为我方断言写错（risk 四色/learn EMA 步数）** |
| R104 | **K13 断言固化** | verify-package.cjs | 包验收 30 → 31 项 | **K13 86 项语义断言每次验收都跑** |
| R101 | **算子语义正确性测试** | `ops-semantic-correctness.cjs` | 28 项数学性质断言 | **通过 19 / 失败 9；逐条核实后 6 项为我方期望错、3 项为真实语义歧义** |
| R102 | **修复算子语义歧义（DEF-026）** | `fix_op_semantics.py`（含备份） | 修复前后对比 | **threshold 支持可选阈值参数；三者加 __semantics 标签；单参调用行为不变** |
| R99 | **vendor 补丁盘点** | `patch-inventory.cjs` | 12 个标记逐文件探测 | **12/12 在位（首测 2 处误报为标记串写错，非真实缺失）** |
| R100 | **补丁自愈器 + K12 断言（DEF-025）** | `reapply-patches.cjs` + `add_k12.py` | --check / 实跑 / 幂等 / 语法 | **8 组补丁可自动重放；重复运行不重复注入；包验收 29→30 项全绿** |
| R97 | **插件双副本比对** | `compare_plugin_copies.py` | 源码 vs 已装 逐文件 SHA256 | **关键 4 文件一致；preset.patch.yml 不一致（源码 13140B / 已装 14014B）** |
| R98 | **回灌 preset 修复到源码（DEF-024）** | `backport_preset_fix.py`（含备份） | 复扫同类风险 | **源码破坏性 suffix 已移除；两副本 SHA256 一致；patch 目录未注册模板变量 0 处** |
| R95 | **法则引用存在性核查** | `audit_law_references2.py` | 路径/脚本/CLI/技能 四类 | **首轮误报 17 处（判据错）→ 真实 3 处 → 全部修复 → 复扫 0 处** |
| R96 | **补装 18 个脚本到 $DSH_HOME/scripts** | `fix_law_refs.py` | 逐个存在性复核 | **verify-package.cjs 等按法则路径可达；失效命令改指向真实脚本** |
| R92 | **技能注册核对** | `audit_skill_registration.py` | 磁盘 112 vs 会话技能目录 | **易理族/思想族/专家扩展族抽查全部已注册** |
| R93 | **补建 metago-fabric-guide（DEF-022）** | `fix_fabric_guide.py` | 技能创建 + AGENTS.md 横幅 | **悬空引用消除；适用边界已声明；技能数 111 → 112** |
| R94 | **§18.10 技能表口径注** | `fix_skill_table_note.py` | 不改生成内容，表后加注 | **标称 100 vs 实测 112 的差异已说明并给出复核命令** |
| R89 | **KMWI 记忆持久化往返** | `test-kmwi-persistence.cjs` | 四层写入→落盘→重载→读回 | **K/M/W/I 四层计数与内容全部一致，持久化 PASS** |
| R90 | **蓝本 16 卷完整性扫描** | `scan_blueprint_integrity2.py` | 空章节/占位符/表格/围栏 四类 | **首轮 365 处误报（判据错）→ 修正后 7 处 → 复核真实问题仅 2 卷围栏未闭合** |
| R91 | **修复未闭合代码围栏（DEF-021）** | `fix_fences.py`（含备份） | 复检 16 卷 | **2 卷 69/447 → 70/448，全部偶数；不改动任何文字** |
| R87 | **类型假设系统性扫描** | `scan-type-assumptions.cjs` + `probe-type-crashes.cjs` | 11 文件静态 + 20 入口动态 | **静态 45 处；动态 13/20 入口崩溃** |
| R88 | **13 处入口批量归一化（DEF-020）** | `normalize_all_types.py` + `normalize_all_types2.py` | 复测 + 全量回归 | **崩溃 13→0；引擎 12 导出正常；13 项回归全绿；MCP 6/6** |
| R85 | **校验器鲁棒性扫描** | `validator-robustness.cjs` | 15 项校验 + DecisionLock × 7 类边界输入 | **AxiomValidator 7/7 不崩溃；DecisionLock 修复前 4/7 崩溃** |
| R86 | **修复 DecisionLock 入参未归一化（DEF-019）** | `fix_decisionlock_types.py`（含备份） | 复测 | **4/7 崩溃 → 7/7 正常返回四道关卡** |
| R83 | **output_integrity / self_check 接入真实现** | `wire_axiom_tools.py` + `fix_handler_fields.py` | MCP 端到端 4 用例 | **两工具由 prompt tool 升级为硬驱动；自检输出 14 项逐条 PASS/WARNING 与公理名** |
| R84 | **修复占位符检测过窄（DEF-018）** | `fix_placeholder_patterns.py` + `fix_placeholder_v2.py` | 9 用例 | **XXX/TODO/待补充/待填写/[待填]/此处省略 由全漏检→全部命中；正常文本仍 PASS** |
| R80 | **metago 工具性质盘点** | `mcp-tool-nature.cjs` | 55 个工具逐个调用判形态 | **硬驱动 3 / 软驱动 46；软驱动为合法 prompt tool 模式，已如实标注** |
| R81 | **修复 AxiomValidator 类型假设（DEF-017）** | `fix_validator_types.py` + `fix_validator_normalize.py` | 传对象/传字符串双测 | **14 项公理校验由不可用→全部可跑；对象输入不再崩溃** |
| R82 | **decision_lock 升级为硬驱动** | `wire_decision_lock.py`（含备份） | MCP 端到端调用 | **四道关卡真实执行并返回 PASS/FAIL 与逐关证据；硬驱动 3→4** |
| R78 | **MCP guide 质量评估** | `guide-quality.cjs` | 39 个 guide × 三要素 | **39/39 触发条件/执行流程/输出格式齐全，缺口 0** |
| R79 | **纠正一次误判（CORR-001）** | FACTS.corrections | 改用「三要素齐全」判据 | **「39 条不同源」是错误判据造成的误报，已撤回并记录教训** |
| R76 | **MCP 工具「可调用」验证** | `mcp-tools-callable.cjs`（按 schema 造参逐个调用） | 112 个工具真实调用 | **修复前 111/112；metago_memory_manage 报 isError** |
| R77 | **修复 KMWI explicitForm 未判空（DEF-016）** | `fix_kmwi_explicit.py`（含备份） | 修复后全量复测 | **getHealth/getDecayRates/getStrengthenSuggestions 由全崩→全部 OK；MCP 112/112 可调用** |
| R74 | **技能层可加载性审计** | `audit_skills.py` | 7 项检查 × 111 个 SKILL.md | **口径修正：116 文件 = 111 技能 + 5 附属；初次审计 7 个正文过短** |
| R75 | **7 个专家团技能方法论补全** | `upgrade_thin_skills.py`（含备份） | 补后复审 + K11 | **正文 762-879 → 2077-2499 字节；问题 7 → 0；K11 固化，包验收 28 → 29 项** |
| R72 | **全局 9 包版本口径对齐** | `align_versions.py`（含备份） | package.json 合法性 + MCP + 跨目录执行 | **9/9 包 rules_version 全部 V36.11.0；metago-lifeform 36.9.6→36.11.0；vendor 偏差 5→0** |
| R73 | **全局用户级生效核验** | `audit_global.py` | 全局安装 + 跨目录 + 命令可用性 | **注册表 927 条 / T3 227 条 / 从 C:\ 执行成功；MCP 6 组 162 工具正常** |
| R70 | **包 → 活系统安装一致性核对** | `audit_install.py` 33 项逐文件 SHA256 | 初查 + 补齐 + 复核 | **初查 27 一致 / 6 缺失 → 补齐 42 个脚本 → 33/33 一致** |
| R71 | **K10 断言守护安装一致性** | verify-package.cjs | 包验收 27 → 28 项 | **K10 17/17 PASS；28 项全绿** |
| R69 | **引用迁移全量清零** | `audit_refs.py` 全量扫描 116 个活文档 | 逐条核实 + 复扫 | **未迁移旧引用 0 处；最后 1 处（metago-action-plan）已改为指向 元构初始文档/附录卷** |
| R68 | **蓝本口径对照表** | 总索引新增「历史声称与技术实测对照」 | 5 类条目逐条计数复核 | **公理38/属性47/协议121/引擎161/原子597/算法927/技能116 全部实测一致；43公理与597 条原子已标注为编号空间/规划口径，不改写历史** |
| R66 | **法则同步现实：AGENTS.md 算法口径更新** | `fix_law_coverage.py` | 逐条核对表格与条款 | **927/927/927/0 表格 + 三种传参形态 + 四类标记说明 全部落卷；旧表述「约 95 个未通过」已清除** |
| R67 | **全系统 13 项回归** | `regress57.py`（改为动态判定） | 逐项复核 | **13/13 全绿；包 6032 文件 / 31.95 MB / VERSION 36.11.0** |
| R64 | **完整源码精读构造最后 11 条** | `fix-11-final.cjs` + `fix-5-last.cjs` + `fix-last2.cjs` | 逐条实跑 | **实跑成功 689 → 700/700（100%）** |
| R65 | **T1/T2 全量可调通达成** | FACTS.t12_coverage | K6/K7/位置多参/函数型 四项复验 | **700/700 实跑成功；474/474 位置多参；21/21 函数型；K6 0 冲突；K7 0 错配** |
| R62 | **属性链提取 + 精确构造** | `extract-chains.cjs` + `fix-22-exact.cjs` | 逐条实跑 | **实跑成功 678 → 689/700（98.4%）** |
| R63 | **甄别「输入问题」与「算法缺陷」** | `analyze-22.cjs` | 按错误特征分类 | **22 条全部判定为输入形态问题，0 条算法缺陷** |
| R60 | **继续构造剩余（逐步收敛）** | `fix-29.cjs` + `fix-batch-A.cjs` | 逐条实跑 | **实跑成功 671 → 678/700（96.9%）** |
| R61 | **剩余 22 条如实登记** | FACTS.t12_coverage | 未计入完成 | **其余全部指标（K2/K4/K6/K7/慢算法/T3）保持全绿** |
| R58 | **批量构造剩余 32 条** | `fix-38.cjs` + `fix-16-unwrapped.cjs` | 逐条实跑 | **实跑成功 662 → 671/700（95.9%）** |
| R59 | **固化「单参非位置型」规则** | FACTS.single_nonpositional_rule | 432 条算法验证 | **1 形参且 positional=false → 输入即参数值本身，不包裹** |
| R56 | **四类类型标记（Map/Set/RegExp/Function）** | `bind.cjs revive()` | 真 Map 直传 + `__fn__` 元素函数测试 | **JSON 调用方可传结构化输入；修复 revive 破坏原生实例（DEF-012）** |
| R57 | **逐族手工构造推理族/冲突族** | `fix-family-R.cjs` 等 4 个脚本 | 逐条实跑验证 | **实跑成功 647 → 662/700（94.6%）** |
| R54 | **领域语义词典批量构造** | `fix-semantic-dict.cjs`（39 类领域结构） | 逐条实跑 | **实跑成功 634 → 647/700（92.4%）** |
| R55 | **剩余 53 条如实登记** | FACTS.t12_coverage | 未计入完成 | **K6/K7/位置多参/函数型 全部保持 PASS** |
| R51 | **批量构造剩余 79 条结构** | `fix-79.cjs` + 手工 Map/RegExp 结构 | 逐条实跑 | **实跑成功 621 → 634/700（90.6%）** |
| R52 | **bind 支持 Map/Set/RegExp 标记** | `revive()` + `__map__`/`__regex__` | 真 Map 直传测试 | **JSON 调用方可传 Map 与正则；并修复 revive 破坏原生实例的缺陷（DEF-012）** |
| R53 | **登记 schema 声明不一致（DEF-013）** | `schema-vs-shape.cjs` 已知例外 | K6 复扫 | **K6 冲突 0、K7 错配 0、位置多参 474/474、函数型 21/21** |
| R49 | **批量求解 T1/T2 失败算法（两轮求解器）** | `fix-iterable.cjs` + `fix-struct-params.cjs` | 逐条实跑验证 | **实跑成功 495 → 621/700（88.7%）；两轮共修复 127 条** |
| R50 | **剩余 79 条如实登记** | FACTS.t12_coverage | 未计入完成 | **证明树/多方博弈/逻辑推理等需逐条读源码构造；K6/K7 仍全 PASS** |
| R46 | **发现 T1/T2 覆盖缺口** | `scripts/t12-full-scan.cjs` | 核查 700 条 T1/T2 全量 | **此前只验证 474 条位置多参型；324 条从未被任何测试覆盖** |
| R47 | **补齐 324 条样例** | 生成 + 结构修正 | 全量复跑 | **样例覆盖 376 → 700/700；实跑成功 304 → 494** |
| R48 | **发现并修复死循环（DEF-011）** | `ALG_T2_C_015` groupSize 校验缺失 | 慢算法探测（阈值 300ms） | **11,109ms → 1ms；全量慢算法 0 条；整数语义参数全局守卫修正 11 处** |
| R44 | **方法移植：空壳/响应性扫描用于原子层** | `atom-hollow-scan.cjs` + `atom-responsive-scan.cjs` | 三组差异输入 | **587 条原子空壳率 0%；586/587 随输入变化（1 条为解密器缺字段的正确报错）** |
| R45 | **K8/K9 断言固化** | verify-package.cjs | 包验收 25 → 27 项 | **27 项全绿** |
| R42 | **空壳行为求解器** | `scripts/hollow-scalar-solve.cjs` | 逐个把数组参数试换标量，以输出是否变非空为判据 | **修复 2 条（M_012 双参数标量化、T2_T_008 lag）；证明行为式判定比静态启发式可靠** |
| R43 | **17 条语义级样例构造** | shapes.json 手工构造 | 空壳复扫 + 四项回归 | **空壳 19 → 4 条（1.4%）；位置多参恢复 474/474；K6/K7 全 PASS** |
| R39 | **空壳输出扫描（47 条）** | `scripts/empty-output-scan.cjs` | 审计样例输入下所有业务字段皆空的算法 | **47 条空壳 → 回溯出矩阵结构错配（DEF-008）等根因** |
| R40 | **修复矩阵型/Map 型参数结构** | shapes.json 矩阵参数改 {size,matrix,labels} | 位置多参 + K7 复扫 | **位置多参恢复 474/474；K7 元素错配 0 处** |
| R41 | **自造回归并修复（DEF-009）** | heal-shapes.cjs 三信号求解器 | 修复后立即复跑三项扫描 | **首版误伤：474→472、K6 0→3、K7 0→74；改用求解器后全部恢复，空壳 47→18** |
| R37 | **样例形状校验：以声明 schema 为 ground truth** | `schema-vs-shape.cjs` | 逐形参比对类型 | **初次 39 处冲突 → 精修规则 8 处 → 修正后 0 处；修正后 474/474、21/21、227/227 全部保持** |
| R38 | **修复静默错答（DEF-006/DEF-007）** | shapes.json 49 处修正 | B_018 随输入变化 + B_007 告警触发 | **B_018：bias 0.1→green / 0.6→yellow / 1.5→red；B_007：超限 5 条 high / 过低 5 条 low / 正常 0 条** |
| R34 | **路径本地化：16 个脚本 23 处硬编码外部路径** | 全部改为 __pick 逐级回退 | 包内逐一实跑 + 三方 SHA 核对 | **T3 227/227、位置多参 474/474、原子 50/50、契约 50/0、工厂 583/583 全部从包内跑通；包内=构建区=npm 三方一致** |
| R35 | **修正变异测试递归复制缺陷** | mutation-test.cjs copyDir 加守卫 | 副本与源同级 + dst.startsWith(src+sep) 抛错 | **修复前产生 678,844 个临时文件；修复后正常清理，真实资产零损伤** |
| R31 | **变异测试：验证断言是否真的会失败** | `scripts/mutation-test.cjs` | 注入缺陷 → 检查对应断言 FAIL | **4/4 捕获；并借此发现 K1 为真空断言（删包内契约卷仍 PASS），已修** |
| R32 | **修正 K1 真空断言** | `contract-validator.cjs` IN_PACKAGE 判定 | 删包内契约卷 → K1 必须 FAIL | **修复前 K1 PASS（读外部副本）；修复后 K1 FAIL（CONTRACT_VOLUME_MISSING）** |
| R33 | **A3 断言：版本等于目标值** | `verify-package.cjs` | 负向测试：两处同时改为 36.10.0 | **A2 仍 PASS（两处一致），A3 FAIL —— 盲区已堵** |
| R28 | **原子语义精度升级：特化算子层** | `engine/atoms/specialized.cjs`（22 算子） | verify K1 + 工厂自测 | **特化覆盖 185/583 = 31.7%；契约符合 583/583 = 100%；算子自测 22/22，路由 6/6** |
| R29 | **蓝本卷版本口径统一** | 14 卷 frontmatter 增设 `collection_version: 36.11.0` | 逐卷核对 | **14 卷全部含 collection_version；原有 version 全部保留（不改写历史）** |
| R30 | **蓝本新增「语义特化算子」正式章节** | `附录卷-原子契约补全-V36.11.md`（100.8 KB） | 章节内容校验 | **22 个算子定义 + 22 条路由规则 + 覆盖上限论证全部落卷** |
| R25 | **输出守卫：拦截 NaN/Inf 静默污染** | `registry.js` OUTPUT-GUARD 段 + `bind.cjs` inspectOutput | `scripts/nan-scanner.cjs` 全量扫描 | **修复前 147 条可返回 NaN 却报 success → 修复后 0 条；53 条被明确拦截；正确输入未受影响** |
| R26 | **T1/T2 位置多参可调率 100%** | `t3impl/shapes.json`（376 条精确样例） | verify K2 | **可调通 474 / 474 = 100%，调不通 0** |
| R27 | **函数型形参桥接（元创造）** | `t3impl/fn-bridge.cjs` + `bind.cjs` hydrate | verify K4 | **21/21 可调（原本判定为结构性不可传）；安全边界 9/9（危险表达式全拒）** |
| R23 | **MCP 协议通道端到端可调用 T3** | `scripts/mcp-e2e.cjs` → spawn MCP 服务器走 stdio JSON-RPC | initialize → tools/list → tools/call(execute) → tools/call(get_algorithm_info) | **7/7 通过**：握手 OK，57 工具，execute 返回 {success:true,output:{phaseDiff:0.05,couplingScore:0.9841,…}} |
| R24 | MCP 通道无伪装成功 | 同上 | 检查返回文本不含 NOT_IMPLEMENTED | get_algorithm_info 对 ALG_T3_C_003 返回 success:true + 真实元信息 |
| R19 | **T3 实现装入 npm 生效路径（全局可用）** | `@metago-ai/algorithms/engine/algorithms/t3impl/` + `registry.js` 接线段 | 装后实跑：T3 handler 数 + executeAlgorithmSync | **装前 T3 handler=0 / 执行 NOT_IMPLEMENTED → 装后 handler=227/227，ALG_T3_C_001 返回 {phaseDiff:0.05,couplingScore:0.9841,…}** |
| R20 | 原子层装入 npm 生效路径 | `@metago-ai/engine/atoms/` | atoms/verify.cjs + contract-validator.cjs | compute 50/50；契约 592 条，compute 50/50 + 工厂 468/468 全过 |
| R21 | 引擎宪法/清单装入 npm 生效路径 | `@metago-ai/engine/{CONSTITUTION,CORE,INDEX}/` | 文件核对 | AXIOMS 2.9KB / ATTRIBUTES 3.4KB / PROTOCOLS 9.5KB / ATOMS 55.2KB / ENGINES 12.1KB |
| R22 | 装入后不破坏现有系统 | `$DSH_HOME/skills`、MCP 服务器 | 装后回归 | skills 116 项未变；MCP server 加载 OK，57 tools registered，Server started |
| R18 | UDGK 四重门禁在本机真实运行 | `$DSH_HOME/delivery.config.json + docs/rtm.md` | node scripts/verify-delivery.cjs | 6 项检查：4 通过 / 2 失败（门禁2/3 需 UI，元构非 Web 项目） |

## 已知未闭环项（如实登记）

| 项 | 原因 |
|---|---|
| UDGK 门禁 2（形态断言） | 元构是规则引擎 + MCP 工具集，无 DOM/UI 可断言 |
| UDGK 门禁 3（视觉 diff） | 同上，无可截图页面 |
| 原子 5 条（归无/如是/沉默/概念消融/无言之教） | 哲学族，存在形态待设计，未套计算契约 |
| 公理 A31-A33 | 蓝本 14 文件中无此编号 |
| T1/T2 难调算法 12 条 | 嵌套对象型入参，通用形态推不出 |
| 函数型形参算法 21 条 | MCP 为 JSON 协议，结构性不可传函数 |
| ~~版本口径~~ | ~~AGENTS V36.9.4 / npm rules V36.9.6 / 包 V36.10.0 / 蓝本 V36.11 尚未统一~~ → **已关闭（R10x）：9 包 rules_version 全部 V36.11.0，11 平台法则全部 V36.11.0** |


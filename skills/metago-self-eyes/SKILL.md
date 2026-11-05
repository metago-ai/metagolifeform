---
name: "metago-self-eyes"
description: "自见协议（交付前自验收）：任何产物交付前，必须先把产物渲染成'用户会看到的画面'，用我自己的眼睛看一遍并挑出问题，带着证据才允许说完成；改过审查脚本后还必须先跑自测、证明审计器本身可信。适用于网站/软件界面、文章文档、图片、视频等一切可见产物。当准备说'做好了/完成了/给你看'之前，或用户说'你自己去看看哪里有问题''证明这个审计器可信'时强制触发。"
version: "1.1.0"
author: "MetaGO"
category: "工程质量"
platforms: ["dsh","cursor","claude-code","codex","trae","codebuddy","qoder","zcode","workbuddy"]
trigger:
  - "交付前自验收"
  - "你自己去看哪里有问题"
  - "做好了/完成了/给你看"
  - "界面/排版/画面有没有问题"
  - "网站/软件/文章/图片/视频交付"
  - "证明这个审计器可信 / 刚改过 audit-web.mjs 的检查规则"
  - "视频里有没有黑场/空白段/重复结尾"
---

# 自见协议（Self-Eyes Protocol）

> 一句话铁律：**没看过产物，就没有资格说"完成"。**
> 第二条铁律：**没跑过自测，就没有资格说"审计器可信"。**

## 0. 为什么需要这份协议

我是作者，天然偏心。没有外部画面证据时，我会用"逻辑上应该没问题"替自己圆过去——
于是出现：需求听懂了、代码也按需求写了，交付出去仍然排版塌、文字截断、图文不符、手机上一团乱。

**测试通过 ≠ 看起来对。tsc 0 错误 ≠ 用户满意。HTTP 200 ≠ 页面没塌。**

## 1. 四步闭环（缺一不可）

```
① 渲染   把产物变成"用户会看到的像素"（截图/抽帧/页面照片）
② 看     用 read_image 真的把那张图读进来看（不是看 DOM、不是看代码）
③ 挑     对照本技能的分类型清单，逐项判定 PASS/FAIL，指出位置
④ 修+复看 改完必须重新渲染再看一次，直到清单全绿
```

**禁止跳过 ②。** 截了图不读图 = 没看。

**看不清就放大，不要靠猜。** 整图 `read_image` 会被缩放到 ~2600px 宽，局部细节全糊；先用 ffmpeg `crop` + `scale` 把局部放大 2 倍再 `read_image`（ffmpeg 用绝对路径，WinGet 装的形如 `C:\Users\<用户>\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_...\bin\ffmpeg.exe`）：

```powershell
& '<ffmpeg 绝对路径>' -y -v error -i D:\审计\full.png -vf "crop=470:1850:0:0,scale=940:-1" D:\审计\crop-sidebar.png
```

`crop=宽:高:x:y` 取局部，`scale=宽:-1` 等比放大。左栏、底部输入区、单张卡片看不清时都这么看。

## 2. 分类型：怎么看

> 下文所有命令都用**绝对路径**，可直接复制到任意工作目录执行。node 装在 `C:\Program Files\nodejs\node.exe`；没有 pwsh（PowerShell 7）时用 Windows PowerShell 5.1：`powershell -NoProfile -ExecutionPolicy Bypass -File <脚本>`。

### 2.1 网站 / 软件界面（最高频）

```powershell
# 本地页面 / 活界面（只读自审：不点按钮、不动用户窗口）
& 'C:\Program Files\nodejs\node.exe' $DSH_HOME\home\skills\metago-self-eyes\scripts\audit-web.mjs --url http://127.0.0.1:<端口> --out D:\审计\<名> --wait 4000 --widths 1440

# 本地 HTML 文件
& 'C:\Program Files\nodejs\node.exe' $DSH_HOME\home\skills\metago-self-eyes\scripts\audit-web.mjs --html D:\path\page.html --out D:\审计\<名>
```

产出：`shots/*.png`（1440 / 768 / 390 三个视口）+ `report.json`（客观问题清单）。
**然后必须 `read_image` 逐张看**，重点看：

| # | 看什么 | 失败长什么样 |
|---|---|---|
| 1 | 首屏有没有内容 | 大面积空白 / 只有一个标题孤零零 |
| 2 | 文字有没有被切 | 行尾断字、按钮文字溢出、卡片文字压边 |
| 3 | 对齐与栅格 | 左右边距不一致、卡片高度参差、基线不齐 |
| 4 | 层级与对比 | 次要文字抢主导、浅灰文字看不清、深色块上黑字 |
| 5 | 留白与密度 | 挤成一坨 / 空得发慌 |
| 6 | 遮挡与溢出 | 弹层被裁、下拉被容器切掉、横向滚动条 |
| 7 | 空状态与长文本 | 没数据时白板、长标题撑破布局 |
| 8 | 真实内容 vs 占位 | 还是 Lorem / 示例数字 / TODO |
| 9 | 与需求逐条对照 | 需求说 A，界面给 B |
| 10 | 破图与控制台报错 | 图片裂开、红色报错 |

**交互必须动手看**：hover / 点击 / 打开弹窗 / 提交空表单 / 滚动到底 —— 每个动作后再看一次截图。

### 2.2 文章 / 文档

HTML/Markdown 文档 → 先导出成 HTML，再按网页审计：

```powershell
& 'C:\Program Files\nodejs\node.exe' $DSH_HOME\home\skills\metago-self-eyes\scripts\audit-web.mjs --html D:\path\doc.html --out D:\审计\<名>
```

Word / PPT / 任意桌面软件 → 直接抓窗口画面（绝对路径 + `-ExecutionPolicy Bypass -File`）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File $DSH_HOME\home\skills\metago-self-eyes\scripts\capture-window.ps1 -Title "文档标题关键词" -Out D:\审计\<名>\doc.png
```

- 含中文的 `.ps1` **必须存成 UTF-8 with BOM**，否则 Windows PowerShell 5.1 会按 GBK 读，中文窗口标题匹配不上。
- 找不到窗口时脚本退化为整屏抓取；仍然失败就**如实报退出码/stderr**，不许假装看过。

看：标题层级是否成阶梯、行宽是否过宽（>90 字符难读）、段间距是否均匀、标点中英混排、错别字、编号是否连续、图表与正文是否对应、页面底部是否大片空白。

### 2.3 图片

```powershell
& 'C:\Program Files\nodejs\node.exe' $DSH_HOME\home\skills\metago-self-eyes\scripts\audit-image.mjs --input D:\path\a.png --out D:\审计\<名>
```

然后 `read_image` 看图本身。看：构图重心、主体是否被切边、文字是否压边/模糊、色偏、水印/伪影、与需求描述的内容是否一致。

### 2.4 视频

```powershell
& 'C:\Program Files\nodejs\node.exe' $DSH_HOME\home\skills\metago-self-eyes\scripts\audit-video.mjs --input D:\path\a.mp4 --out D:\审计\<名>
```

产出逐秒帧 + 联络表。看：黑场/空白段、长时间静止、切点是否踩在动作中间、字幕压边或被切、版面元素重叠、音画是否对得上、**结尾是不是重复了一个**（节目自带结尾又接一个落版 = 结构错）。

**亮度/黑帧告警一律先当候选，不当结论。** 黑底稀疏白字的宣传片每帧均值亮度本来就只有 0–15，按"均值 < 5 = 黑帧"会把整片报成一串黑场——实测就有这种大面积误判。判定顺序：

1. 脚本只负责出**候选段**：逐帧均值亮度 + 黑帧时间点 + 联络表。
2. 对每条候选段，抽该段**首/中/尾帧**拼成联络表图，`read_image` 真的看。
3. 逐条给判定：`真空白段` 或 `阈值误报`，并写依据（看到的是纯黑，还是稀疏字幕/静态画面）。
4. 结论必须指向**具体时间段 + 画面内容**（"12.5–25.0s 整段纯黑，无一帧有字"），不能只给数值。
5. 真空白段 / 重复结尾 → 给出**剔除或重剪决定**并复看，不许原样交付。
6. 亮度阈值在深色片上是不可靠判据，改了阈值要附**改前/改后对比数据**（误报段数 → 剩余段数）。

**阈值必须先用对照片校准**：一条正常深色片（阴性，应判"无空白"）+ 一条真空白片（阳性，应判"空白"，可从真实产物里切出已确认全黑的一段，或用 ffmpeg 生成纯黑片）。两片各跑一次、两边结论都对，这个阈值才算能用。只跑阳性片 = 只证明它会报警，不证明它不乱报。

## 3. 问题分级（决定是否允许交付）

| 级别 | 定义 | 处置 |
|---|---|---|
| **P0** | 看不见内容 / 文字被切 / 元素重叠遮挡 / 页面报错 / 图文不符 | **禁止交付**，必须修 |
| **P1** | 对齐混乱 / 留白失衡 / 层级不清 / 对比度低 / 明显不一致 | 修，或明确告知并给出理由 |
| **P2** | 微调级（2px 抖动、语气措辞） | 记录，可留待下轮 |

**P0 未清零 = 不许说"完成"。**

## 4. 交付时必须附的证据（缺一即视为没看）

```
## 自见审查
- 渲染方式：<URL 或 文件> → 截图 <绝对路径>
- 我看过的图：<列出 N 张的绝对路径>
- 发现并已修：P0 3 项 / P1 2 项
  - P0-1 位置(登录卡片右下)：按钮文字被裁 → 已改为自适应宽度
  - P1-1 位置(首屏中部)：留白过大 → 已收紧 40px
- 复看：<第二次截图绝对路径>，清单全绿
- 未修但需告知：P2 2 项（列表页表头 2px 抖动）
- 若本轮改过审查脚本：自测 <绝对路径> 逐条 PASS，退出码 0
```

## 5. 禁止话术（说了等于没验）

- "应该没问题" / "逻辑上是对的"
- "测试都通过了"（测试不是眼睛）
- "我检查了 DOM，元素都在"
- "代码是按需求写的"
- 只有截图路径、没有"我看到了什么"的描述
- "审计器跑过了"（而没跑过自测证明审计器可信）

## 6. 主动性铁律

**不等用户提醒。** 只要本轮产出了任何可见产物，交付前自动执行本协议；
用户说"你自己去看看"时，直接进入第 1 步，不要反问"看哪里"。

## 7. 已知边界（不吹）

- 眼睛能看：排版/对齐/留白/层级/遮挡/溢出/截断/配色/错别字/图文不符/空状态/与需求不符。
- 眼睛看不见：业务逻辑错、并发出错、权限越界、性能瓶颈 —— 这些必须靠测试，且要单独说明"已用测试覆盖"而不是"我看过了"。
- 审美主观：我的"顺眼"不必然是你的"顺眼"。因此凡是用户给过明确偏好的（品牌色、字号、密度），以用户标准为准；用户没给时，按"克制、留白、层级清晰"的通用审美执行，并在交付时说明我依据的判据。

## 8. 自测（先证明审计器可信，再用它审产物）

审计器本身也会坏：规则写错，它照样报"全绿"，我拿着绿报告去交付。所以**改过 `audit-web.mjs` 里任何判定规则之后，先跑自测**；跑不出退出码 0，就不许引用它的结论。

### 8.1 跑法（绝对路径，任意工作目录可跑）

```powershell
& 'C:\Program Files\nodejs\node.exe' '$DSH_HOME\home\skills\metago-self-eyes\scripts\selftest.mjs'
'退出码=' + $LASTEXITCODE
```

要求：**逐条打印 PASS/FAIL 断言，且退出码 = 0**。全 PASS 但退出码非 0，或退出码 0 但有一行 FAIL，都算没通过。

### 8.2 三份对照页（埋雷 + 阳性 + 阴性）

根目录 `$DSH_HOME\home\skills\metago-self-eyes\`：

| 角色 | 文件 | 期望 |
|---|---|---|
| 埋雷页（8 类问题） | `scripts\selftest-page.html` | 8 类全部命中：text-clipped / text-vert-clipped / horizontal-overflow / outside-viewport / broken-image / low-contrast / placeholder-content / tiny-target；P0 ≥ 4 |
| 空白页（阳性） | `fixtures\empty-page.html` | 命中 `near-empty` |
| **零问题页（阴性对照）** | `fixtures\clean-page.html` | **P0 = 0 且 P1 = 0**，退出码 0 |

断言合计 13 项，全绿才算审计器可信。**阴性对照是防误报的关键**：只有"埋雷页全中 + 干净页零报"，才说明这把尺子既灵敏又不乱报。只跑埋雷页 = 只证明它会报警，不证明它不乱报（和 §2.4 视频阈值一个道理）。

### 8.3 写 fixture 的硬约束

- **审计 fixture 不许放进 flex 容器**：整页塞进 `display:flex` 后，子元素的溢出/裁字会被 flex 收缩"合法"地吃掉，埋的雷量不出来，阴性页也会跟着假绿。fixture 一律用普通块级布局（body 直接排布）。
- fixture 里被断言的内容（类名、文案）要固定，不许随机。
- **新增一类检查 = 同步加一颗雷 + 一条断言**，否则新规则从来没被验证过。

## 9. 脚本引用自检（任意工作目录可用）

SKILL.md 里的脚本引用一律写**绝对路径**，绝不写 `<SKILL_DIR>` 之类占位符——占位符不会被运行时替换，新会话照着抄必然失败。改完文档跑一遍：

```powershell
$root = '$DSH_HOME\home\skills\metago-self-eyes'
$p    = Join-Path $root 'SKILL.md'
Select-String -Path $p -Pattern 'scripts\\[A-Za-z0-9\-]+\.(mjs|ps1)' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | Sort-Object -Unique |
  ForEach-Object {
    $f = Join-Path $root $_
    if (Test-Path $f) { "OK   $_" } else { "缺失 $_" }
  }
'未替换占位符:'
Select-String -Path $p -Pattern '<SKILL_DIR>|<技能目录>' | ForEach-Object { '  L' + $_.LineNumber + ': ' + $_.Line.Trim() }
```

每行都必须是 `OK`；任何 `缺失` 说明文档引用了不存在的脚本（历史上就出现过引用 `audit-doc.mjs` 这种根本不存在的东西），要么补脚本，要么把文档改成真实存在的分支。

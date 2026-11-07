window.__ModuleLoader__.load({
	id: "metago-lifeform-dsh",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
		
		// ../MetaGO-Atlas/console-plugin/src/client/index.js
		var index_exports = {};
		__export(index_exports, {
		  PANEL_ID: () => PANEL_ID,
		  apply: () => apply,
		  inject: () => inject
		});
		module.exports = __toCommonJS(index_exports);
		
		// ../MetaGO-Atlas/console-plugin/src/client/branding/branding.css
		var css = '.meta-brand-wordmark{object-fit:contain;pointer-events:none;user-select:none;width:auto;display:block}[class*=_railMark] .meta-brand-wordmark,._2H3hWW_railMark .meta-brand-wordmark{width:24px;height:24px}[class*=_brandMark] .meta-brand-wordmark,._2H3hWW_brandMark .meta-brand-wordmark{max-width:132px;height:22px}.meta-brand-hero{object-fit:contain;pointer-events:none;user-select:none;display:block}.meta-brand-name{letter-spacing:.04em;white-space:nowrap;height:24px;color:var(--dsw-alias-label-primary);align-items:center;font-size:18px;font-weight:600;line-height:24px;display:inline-flex}[class*=_titleGroup]>span:first-child,.Hqq-bq_titleGroup>span:first-child{font-size:0;line-height:0}[class*=_titleGroup]>span:first-child:after,.Hqq-bq_titleGroup>span:first-child:after{content:"\u5143\u667A\u80FD\uFF0C\u6784\u4E07\u8C61";font-size:26px;line-height:32px}[class*=_previewBadge],.Hqq-bq_previewBadge{justify-content:center;align-items:center;height:20px;margin-top:-5px;padding:0 7px;font-size:0;line-height:0;display:inline-flex}[class*=_previewBadge]:after,.Hqq-bq_previewBadge:after{content:"MetaGO Fabric";font-size:12px;line-height:1}';
		var tagId = "metago-lifeform-dsh/branding.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "metago-lifeform-dsh";
		  tag.dataset.pluginCss = tagId;
		  tag.textContent = css;
		  document.head.appendChild(tag);
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/PanelPage.js
		var import_react3 = require("react");
		
		// ../MetaGO-Atlas/console-plugin/src/client/panel.module.css
		var css2 = "._0Oh6Ia_root{box-sizing:border-box;width:100%;height:100%;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);flex-direction:column;gap:12px;padding:16px;display:flex;overflow-y:auto}._0Oh6Ia_header{justify-content:space-between;align-items:baseline;gap:12px;display:flex}._0Oh6Ia_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:600;line-height:24px}._0Oh6Ia_subtitle{color:var(--dsw-alias-label-tertiary);margin:2px 0 0;font-size:12px;line-height:18px}._0Oh6Ia_refresh{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-ghost-active-fill);border:.5px solid var(--dsw-alias-button-ghost-border);border-radius:var(--dsw-radius-sm);cursor:pointer;flex:none;padding:4px 12px;font-size:12px;line-height:20px}._0Oh6Ia_refresh:hover{background:var(--dsw-alias-interactive-bg-hover)}._0Oh6Ia_refresh:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}._0Oh6Ia_tabs{background:var(--dsw-alias-bg-layer-2);border-radius:var(--dsw-radius-md);gap:4px;padding:3px;display:flex}._0Oh6Ia_tab{color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-sm);cursor:pointer;background:0 0;border:0;flex:1;padding:5px 8px;font-size:12px;line-height:18px}._0Oh6Ia_tab[data-active]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}._0Oh6Ia_tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}._0Oh6Ia_card{border-radius:var(--dsw-radius-xl);border:.5px solid var(--dsw-alias-settings-card-stroke);background:var(--dsw-alias-settings-card-fill);padding:14px 16px}._0Oh6Ia_cardHead{justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;display:flex}._0Oh6Ia_cardTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;font-weight:600;line-height:20px}._0Oh6Ia_badge{border-radius:var(--dsw-radius-xs);border:.5px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);flex:none;padding:1px 8px;font-size:11px;line-height:18px}._0Oh6Ia_badge[data-tone=ok]{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-tertiary)}._0Oh6Ia_badge[data-tone=warn]{color:var(--dsw-alias-state-warn-label);border-color:var(--dsw-alias-state-warn-tertiary)}._0Oh6Ia_badge[data-tone=bad]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-secondary)}._0Oh6Ia_rows{flex-direction:column;gap:6px;margin:0;display:flex}._0Oh6Ia_row{justify-content:space-between;align-items:baseline;gap:12px;font-size:12px;line-height:20px;display:flex}._0Oh6Ia_rowKey{color:var(--dsw-alias-label-tertiary);flex:none}._0Oh6Ia_rowValue{text-align:right;min-width:0;color:var(--dsw-alias-label-primary);word-break:break-all}._0Oh6Ia_mono{font-family:var(--ds-font-family-code);font-size:11px}._0Oh6Ia_bar{background:var(--dsw-alias-bg-layer-3);border-radius:var(--dsw-radius-xs);height:6px;margin-top:8px;position:relative;overflow:hidden}._0Oh6Ia_barFill{border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-brand-primary);height:100%}._0Oh6Ia_barFill[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}._0Oh6Ia_barFill[data-tone=bad]{background:var(--dsw-alias-state-error-primary)}._0Oh6Ia_layers{flex-direction:column;gap:6px;display:flex}._0Oh6Ia_layer{align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}._0Oh6Ia_dot{corner-shape:round;background:var(--dsw-alias-label-tertiary);border-radius:50%;flex:none;width:6px;height:6px}._0Oh6Ia_dot[data-state=live]{background:var(--dsw-alias-state-success-primary)}._0Oh6Ia_dot[data-state=idle]{background:var(--dsw-alias-state-warn-primary)}._0Oh6Ia_layerLabel{color:var(--dsw-alias-label-secondary);flex:1}._0Oh6Ia_grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;display:grid}._0Oh6Ia_cell{border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-2);padding:6px 8px;font-size:12px;line-height:18px}._0Oh6Ia_cellKey{color:var(--dsw-alias-label-tertiary)}._0Oh6Ia_cellValue{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary)}._0Oh6Ia_memoryRow{align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}._0Oh6Ia_memoryName{width:84px;color:var(--dsw-alias-label-secondary);flex:none}._0Oh6Ia_memoryTrack{background:var(--dsw-alias-bg-layer-3);border-radius:var(--dsw-radius-xs);flex:1;height:6px;overflow:hidden}._0Oh6Ia_memoryFill{border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-brand-primary);height:100%}._0Oh6Ia_memoryCount{text-align:right;width:44px;font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);flex:none}._0Oh6Ia_error{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-state-error-secondary);border-radius:var(--dsw-radius-md);padding:10px 12px;font-size:12px;line-height:20px}._0Oh6Ia_empty{color:var(--dsw-alias-label-tertiary);padding:10px 0;font-size:12px;line-height:20px}._0Oh6Ia_footnote{color:var(--dsw-alias-label-caption);margin:0;font-size:11px;line-height:18px}";
		var tagId2 = "metago-lifeform-dsh/panel.module.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId2 + '"]') === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "metago-lifeform-dsh";
		  tag.dataset.pluginCss = tagId2;
		  tag.textContent = css2;
		  document.head.appendChild(tag);
		}
		var card = "_0Oh6Ia_card";
		var cardHead = "_0Oh6Ia_cardHead";
		var cardTitle = "_0Oh6Ia_cardTitle";
		var dot = "_0Oh6Ia_dot";
		var empty = "_0Oh6Ia_empty";
		var footnote = "_0Oh6Ia_footnote";
		var grid = "_0Oh6Ia_grid";
		var header = "_0Oh6Ia_header";
		var layer = "_0Oh6Ia_layer";
		var layerLabel = "_0Oh6Ia_layerLabel";
		var layers = "_0Oh6Ia_layers";
		var memoryCount = "_0Oh6Ia_memoryCount";
		var memoryFill = "_0Oh6Ia_memoryFill";
		var memoryName = "_0Oh6Ia_memoryName";
		var memoryRow = "_0Oh6Ia_memoryRow";
		var memoryTrack = "_0Oh6Ia_memoryTrack";
		var mono = "_0Oh6Ia_mono";
		var refresh = "_0Oh6Ia_refresh";
		var root = "_0Oh6Ia_root";
		var row = "_0Oh6Ia_row";
		var rowKey = "_0Oh6Ia_rowKey";
		var rows = "_0Oh6Ia_rows";
		var subtitle = "_0Oh6Ia_subtitle";
		var tab = "_0Oh6Ia_tab";
		var tabs = "_0Oh6Ia_tabs";
		var title = "_0Oh6Ia_title";
		
		// ../MetaGO-Atlas/console-plugin/src/client/ui.js
		var import_react = require("react");
		var import_jsx_runtime = require("react/jsx-runtime");
		function useMetago(route, reloadKey) {
		  const [state, setState] = (0, import_react.useState)("loading");
		  const [data, setData] = (0, import_react.useState)(null);
		  const [error, setError] = (0, import_react.useState)(null);
		  (0, import_react.useEffect)(() => {
		    const controller = new AbortController();
		    let live = true;
		    setState("loading");
		    fetch(`/api/metago/${route}`, { signal: controller.signal, headers: { accept: "application/json" } }).then(async (response) => {
		      const text = await response.text();
		      let payload;
		      try {
		        payload = JSON.parse(text);
		      } catch {
		        throw new Error(`\u54CD\u5E94\u4E0D\u662F JSON\uFF08HTTP ${response.status}\uFF09`);
		      }
		      if (!response.ok || payload.ok === false) throw new Error(payload && payload.error ? payload.error : `HTTP ${response.status}`);
		      return payload;
		    }).then((payload) => {
		      if (!live) return;
		      setData(payload);
		      setError(null);
		      setState("ready");
		    }).catch((caught) => {
		      if (!live || caught.name === "AbortError") return;
		      setError(String(caught && caught.message || caught));
		      setState("error");
		    });
		    return () => {
		      live = false;
		      controller.abort();
		    };
		  }, [route, reloadKey]);
		  return { state, data, error };
		}
		function Row({ label, value, mono: mono2 }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "row", style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rowKey", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: mono2 ? "rowValue mono" : "rowValue", children: value })
		  ] });
		}
		function Cell({ label, value }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "cell", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cellKey", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cellValue", children: value })
		  ] });
		}
		function Bar({ ratio, tone }) {
		  const width = `${Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0)) * 100}%`;
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "barFill", "data-tone": tone || "ok", style: { width } }) });
		}
		function Badge({ tone, children }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "badge", "data-tone": tone || "idle", children });
		}
		function ErrorBox({ message }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "error", children: [
		    "\u5143\u6784\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A",
		    message
		  ] });
		}
		function Loading() {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "empty", children: "\u6B63\u5728\u8BFB\u53D6\u5143\u6784\u8FD0\u884C\u65F6\u72B6\u6001\u2026" });
		}
		function stamp(iso) {
		  if (!iso) return "\u2014";
		  const date = new Date(iso);
		  if (Number.isNaN(date.getTime())) return String(iso);
		  const pad = (value) => String(value).padStart(2, "0");
		  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
		}
		function humanBytes(value) {
		  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
		  if (value < 1024) return `${value} B`;
		  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
		  return `${(value / 1024 / 1024).toFixed(2)} MiB`;
		}
		function humanNum(value) {
		  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "\u2014";
		}
		function healthBand(health, total = Number.POSITIVE_INFINITY) {
		  if (typeof health !== "number" || !Number.isFinite(health)) return { label: "\u672A\u77E5", tone: "idle" };
		  if (health <= 0) return { label: "\u7A7A\u4ED3", tone: "idle" };
		  if (health < 40 || total < 8) return { label: "\u7A00\u8584", tone: "warn" };
		  if (health < 70) return { label: "\u6210\u957F\u4E2D", tone: "ok" };
		  return { label: "\u5145\u76C8", tone: "ok" };
		}
		function serverLabel(server) {
		  if (server === "metago") return "\u5143\u6784\u5DE5\u5177\u96C6 metago";
		  if (server === "metago-algorithms") return "\u5143\u6784\u7B97\u6CD5\u96C6 metago-algorithms";
		  return server;
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/ConsoleViews.js
		var import_react2 = require("react");
		var import_jsx_runtime2 = require("react/jsx-runtime");
		async function callAction(actionId, params, needsConfirm) {
		  let confirmToken = "";
		  if (needsConfirm) {
		    const r = await fetch(`/api/metago/console/confirm?action=${encodeURIComponent(actionId)}`, { headers: { accept: "application/json" } });
		    const j = await r.json();
		    if (!j.ok) throw new Error(`\u53D6\u786E\u8BA4\u4EE4\u724C\u5931\u8D25\uFF1A${j.error || r.status}`);
		    confirmToken = j.token;
		  }
		  const r2 = await fetch("/api/metago/console/action", {
		    method: "POST",
		    headers: { "content-type": "application/json", accept: "application/json" },
		    body: JSON.stringify({ action: actionId, params: params || {}, confirmToken })
		  });
		  const out = await r2.json();
		  if (!r2.ok || out.ok === false) throw new Error(out.error || `HTTP ${r2.status}`);
		  return out;
		}
		function ActionBar({ consoleMeta, domain, onDone, presets }) {
		  const [busy, setBusy] = (0, import_react2.useState)("");
		  const [msg, setMsg] = (0, import_react2.useState)(null);
		  if (!consoleMeta) return null;
		  const actions = consoleMeta.actions.filter((a) => a.domain === domain);
		  if (!actions.length) return null;
		  const run = async (a) => {
		    setBusy(a.id);
		    setMsg(null);
		    try {
		      const builtin = {
		        "gate.toggleMode": { mode: consoleMeta && consoleMeta.currentMode || "shadow" },
		        "memory.recallTest": { query: "metago", limit: 5 },
        "memory.health": {},
        "memory.recall": { query: "metago", limit: 5 },
		        "tool.dryRun": { tool: "pwsh", args: {} },
		        "gate.explain": { tool: "pwsh" },
		        "audit.tail": { limit: 50 }
		      };
		      const params = presets && presets[a.id] ? presets[a.id]() : builtin[a.id] || {};
		      const out = await callAction(a.id, params, a.needsConfirm);
		      const brief = out.checks ? `${out.checks.filter((c) => c.pass).length}/${out.checks.length} \u9879\u901A\u8FC7` : out.hits ? `\u547D\u4E2D ${out.hits.length} \u6761` : out.mode || out.total || out.note || "\u6210\u529F";
		      setMsg({ ok: true, text: `${a.id} \u2192 ${brief}` });
		      if (onDone) onDone();
		    } catch (e) {
		      setMsg({ ok: false, text: `${a.id} \u5931\u8D25\uFF1A${String(e.message || e)}` });
		    } finally {
		      setBusy("");
		    }
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginTop: 12 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: actions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		      "button",
		      {
		        type: "button",
		        className: refresh,
		        disabled: busy === a.id,
		        onClick: () => run(a),
		        title: `${a.level}${a.needsConfirm ? " \xB7 \u9700\u4E00\u6B21\u6027\u786E\u8BA4\u4EE4\u724C" : ""} \u2014 ${a.desc}`,
		        children: [
		          busy === a.id ? "\u6267\u884C\u4E2D\u2026" : a.id,
		          a.needsConfirm ? " \u{1F512}" : ""
		        ]
		      },
		      a.id
		    )) }),
		    msg ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: msg.ok ? "ok" : "bad", children: msg.text }) }) : null
		  ] });
		}
		function GovernanceView({ data, consoleMeta, onDone }) {
		  const [tool, setTool] = (0, import_react2.useState)("pwsh");
		  const [explain, setExplain] = (0, import_react2.useState)(null);
		  const law = data.law || {};
		  const doExplain = async () => {
		    setExplain({ loading: true });
		    try {
		      const out = await callAction("gate.explain", { tool }, false);
		      setExplain(out);
		    } catch (e) {
		      setExplain({ ok: false, error: String(e.message || e) });
		    }
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: cardTitle, children: "\u95E8\u7981\u72B6\u6001" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: law.exists ? "ok" : "bad", children: law.exists ? `\u6CD5\u5219 V${law.version}` : "\u6CD5\u5219\u7F3A\u5931" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u6CD5\u5219\u7248\u672C", value: law.version ? `V${law.version}` : "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u6CD5\u5219\u4F53\u79EF", value: law.bytes == null ? "\u2014" : `${humanNum(law.bytes)} B`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u7AE0\u8282", value: law.chapterCount == null ? "\u2014" : `${law.chapterCount} \u7F16\u53F7 / ${law.headingCount == null ? "\u2014" : law.headingCount} \u6807\u9898`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u516C\u7406 / \u5C5E\u6027", value: `${(law.axioms || []).length} / ${(law.properties || []).length}`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "L4 \u9ED1\u540D\u5355", value: consoleMeta && consoleMeta.l4Blocked ? consoleMeta.l4Blocked.join(" \xB7 ") : "\u2014" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ActionBar, { consoleMeta, domain: "governance", onDone })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: cardTitle, children: "\u89E3\u91CA\u4E00\u4E2A\u5DE5\u5177\u7684\u98CE\u9669\u5224\u5B9A" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            type: "text",
		            value: tool,
		            onChange: (e) => setTool(e.target.value),
		            placeholder: "\u5DE5\u5177\u540D\uFF0C\u5982 pwsh / read / metago_atom",
		            style: { padding: "6px 10px", borderRadius: 6, border: "1px solid #30363d", background: "#0d1117", color: "#e6edf3", minWidth: 260 }
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: refresh, onClick: doExplain, children: "\u89E3\u91CA" })
		      ] }),
		      explain ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginTop: 10 }, children: explain.loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Loading, {}) : explain.ok === false ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ErrorBox, { message: explain.error }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u5DE5\u5177", value: explain.tool, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u7B49\u7EA7", value: explain.level, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u547D\u4E2D\u89C4\u5219", value: explain.matchedRule }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u5F53\u524D\u6A21\u5F0F", value: explain.mode, mono: true })
		      ] }) }) : null
		    ] })
		  ] });
		}
		function OpsView({ data, consoleMeta, onDone }) {
		  const mcp = data.mcp || {};
		  const skills = data.skills || {};
		  const packages = data.packages || {};
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: cardTitle, children: "MCP \u4E0E\u6280\u80FD" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: mcp.mounted ? "ok" : "warn", children: mcp.mounted ? "\u5DF2\u6302\u8F7D" : "\u672A\u6302\u8F7D" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "MCP \u5DE5\u5177", value: `${mcp.total || 0} \u4E2A`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u670D\u52A1\u5668", value: (mcp.servers || []).map((s) => `${s.server}=${s.count}`).join(" / ") || "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u6280\u80FD\uFF08\u5168\u90E8\uFF09", value: `${skills.total || 0} \u4E2A`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u6280\u80FD\uFF08metago-*\uFF09", value: `${skills.metago || 0} \u4E2A`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u89E6\u53D1\u8BCD", value: `${skills.triggerCount || 0} \u6761`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u5F15\u64CE", value: packages.engine && packages.engine.installed ? `v${packages.engine.version}` : "\u672A\u5B89\u88C5", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u7B97\u6CD5", value: packages.algorithms && packages.algorithms.installed ? `v${packages.algorithms.version}` : "\u672A\u5B89\u88C5", mono: true })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ActionBar, { consoleMeta, domain: "ops", onDone })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: cardTitle, children: "\u5BA1\u8BA1\u4E0E\u786E\u8BA4" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u5BA1\u8BA1\u6587\u4EF6", value: consoleMeta ? consoleMeta.auditPath : "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u786E\u8BA4\u4EE4\u724C\u6709\u6548\u671F", value: consoleMeta ? `${consoleMeta.confirmTtlMs} ms` : "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u52A8\u4F5C\u603B\u6570", value: consoleMeta ? `${consoleMeta.actions.length} \u4E2A` : "\u2014", mono: true })
		      ] })
		    ] })
		  ] });
		}
		function AuditView({ consoleMeta }) {
		  const [data, setData] = (0, import_react2.useState)(null);
		  const [err, setErr] = (0, import_react2.useState)(null);
		  const [loading, setLoading] = (0, import_react2.useState)(false);
		  const load = async () => {
		    setLoading(true);
		    setErr(null);
		    try {
		      const r = await fetch("/api/metago/console/audit?limit=200", { headers: { accept: "application/json" } });
		      const j = await r.json();
		      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
		      setData(j);
		    } catch (e) {
		      setErr(String(e.message || e));
		    } finally {
		      setLoading(false);
		    }
		  };
		  if (!data && !loading && !err) load();
		  const exportJsonl = () => {
		    const lines = (data && data.lines ? data.lines : []).map((l) => JSON.stringify(l)).join("\n");
		    const blob = new Blob([lines], { type: "application/x-ndjson" });
		    const a = document.createElement("a");
		    a.href = URL.createObjectURL(blob);
		    a.download = `console-audit-${Date.now()}.jsonl`;
		    a.click();
		    setTimeout(() => URL.revokeObjectURL(a.href), 3e3);
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: card, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cardHead, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: cardTitle, children: "\u64CD\u4F5C\u5BA1\u8BA1" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: "ok", children: data ? `${data.total} \u6761` : "\u2014" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: refresh, onClick: load, disabled: loading, children: loading ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: refresh, onClick: exportJsonl, disabled: !data || !data.lines.length, children: "\u5BFC\u51FA JSONL" })
		    ] }),
		    err ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ErrorBox, { message: err }) : null,
		    loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Loading, {}) : null,
		    data && data.lines && data.lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "#8b949e" }, children: "\u8FD8\u6CA1\u6709\u52A8\u4F5C\u8BB0\u5F55\u3002\u53BB\u300C\u6CBB\u7406\u4E0E\u95E8\u7981\u300D\u70B9\u51E0\u6B21\u52A8\u4F5C\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002" }) : null,
		    data && data.lines && data.lines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { maxHeight: 420, overflow: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: { textAlign: "left", color: "#8b949e" }, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { padding: "4px 6px" }, children: "\u65F6\u95F4" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { padding: "4px 6px" }, children: "\u52A8\u4F5C" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { padding: "4px 6px" }, children: "\u7EA7\u522B" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { padding: "4px 6px" }, children: "\u7ED3\u679C" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { padding: "4px 6px" }, children: "\u56DE\u6EDA\u70B9" })
		      ] }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: data.lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: { borderTop: "1px solid #21262d" }, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 6px", fontFamily: "monospace" }, children: stamp(l.ts) }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 6px", fontFamily: "monospace" }, children: l.action || "\u2014" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 6px", fontFamily: "monospace" }, children: l.level || "\u2014" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { style: { padding: "4px 6px" }, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: l.result === "ok" ? "ok" : "bad", children: l.result || (l.ok ? "ok" : "fail") }),
		          l.error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "#f85149", marginLeft: 6 }, children: String(l.error).slice(0, 40) }) : null
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 6px", fontFamily: "monospace", color: "#8b949e" }, children: l.rollbackPoint || "\u2014" })
		      ] }, i)) })
		    ] }) }) : null
		  ] });
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/PanelPage.js
		var import_jsx_runtime3 = require("react/jsx-runtime");
		var TABS = [
		  { id: "overview", label: "\u603B\u89C8 Live" },
		  { id: "capability", label: "\u80FD\u529B\u6D4F\u89C8\u5668" },
		  { id: "governance", label: "\u6CBB\u7406\u4E0E\u95E8\u7981" },
		  { id: "memory", label: "\u8BB0\u5FC6\u4E0E\u77E5\u8BC6" },
		  { id: "ops", label: "\u8FD0\u884C\u8FD0\u7EF4" },
		  { id: "audit", label: "\u64CD\u4F5C\u5BA1\u8BA1" }
		];
		function PanelPage() {
		  const [tab2, setTab] = (0, import_react3.useState)("overview");
		  const [reloadKey, setReloadKey] = (0, import_react3.useState)(0);
		  const snap = useMetago("console/snapshot", reloadKey);
		  const status = snap.data && snap.data.status ? { state: snap.state, data: snap.data.status, error: snap.error } : snap;
		  const consoleMeta = snap.data && snap.data.console || null;
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: root, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: header, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { className: title, children: "\u5143\u6784\u63A7\u5236\u53F0" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: subtitle, children: "MetaGO Intelligent Lifeform \xB7 \u5143\u6784\u8D85\u7EA7\u667A\u80FD\u751F\u547D\u4F53\u6A21\u5F0F\u5957\u4EF6 \xB7 \u9A6D\u667A\u5C42" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: refresh, onClick: () => setReloadKey((value) => value + 1), children: "\u91CD\u65B0\u4F53\u68C0" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("nav", { className: tabs, role: "tablist", children: TABS.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		      "button",
		      {
		        type: "button",
		        role: "tab",
		        "aria-selected": tab2 === entry.id,
		        className: tab,
		        "data-active": tab2 === entry.id ? "" : void 0,
		        onClick: () => setTab(entry.id),
		        children: entry.label
		      },
		      entry.id
		    )) }),
		    status.state === "loading" && status.data === null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Loading, {}) : null,
		    status.state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ErrorBox, { message: status.error }) : null,
		    status.data ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		      tab2 === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Overview, { data: status.data }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(LawView, { data: status.data })
		      ] }) : null,
		      tab2 === "capability" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CapabilityView, { data: status.data, consoleMeta, onDone: () => setReloadKey((v) => v + 1) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u80FD\u529B\u52A8\u4F5C" }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ActionBar, { consoleMeta, domain: "capability", onDone: () => setReloadKey((v) => v + 1) })
		        ] })
		      ] }) : null,
		      tab2 === "governance" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(GovernanceView, { data: status.data, consoleMeta, onDone: () => setReloadKey((v) => v + 1) }) : null,
		      tab2 === "memory" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MemoryView, { data: status.data, consoleMeta, onDone: () => setReloadKey((v) => v + 1) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u8BB0\u5FC6\u52A8\u4F5C" }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ActionBar, { consoleMeta, domain: "memory", onDone: () => setReloadKey((v) => v + 1) })
		        ] })
		      ] }) : null,
		      tab2 === "ops" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OpsView, { data: status.data, consoleMeta, onDone: () => setReloadKey((v) => v + 1) }) : null,
		      tab2 === "audit" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AuditView, { consoleMeta }) : null
		    ] }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: footnote, children: [
		      "\u6570\u636E\u6E90\uFF1A/api/metago/console/snapshot \xB7 \u91C7\u96C6\u65F6\u95F4 ",
		      stamp(snap.data && snap.data.ts),
		      " \xB7 \u52A8\u4F5C ",
		      consoleMeta ? consoleMeta.actions.length : 0,
		      " \u4E2A / 6 \u57DF \xB7 L4\uFF08\u5220\u8BB0\u5FC6\xB7\u6539\u6CD5\u5219\xB7\u5378\u63D2\u4EF6\xB7\u6E05\u5E93\uFF09\u4E00\u5F8B\u4E0D\u7ED9\u5165\u53E3"
		    ] })
		  ] });
		}
		function Overview({ data }) {
		  const lawTone = data.law.exists ? data.lawBudget.fits ? "ok" : "bad" : "bad";
		  const memory = data.memory || {};
		  const band = healthBand(memory.health, memory.total);
		  const algorithms = data.algorithms || {};
		  const executable = algorithms.executable ?? 0;
		  const registered = algorithms.registered ?? 0;
		  const ratio = registered > 0 ? executable / registered : 0;
		  const coverage = registered === 0 ? { label: "\u672A\u626B\u63CF", tone: "idle" } : ratio >= 0.95 ? { label: "\u57FA\u672C\u5B8C\u6574", tone: "ok" } : ratio >= 0.7 ? { label: "\u53EF\u7528", tone: "ok" } : { label: "\u5F85\u8865", tone: "warn" };
		  const tierLine = ["T1", "T2", "T3"].filter((tier) => algorithms.byTier && algorithms.byTier[tier]).map((tier) => `${tier} ${algorithms.byTier[tier].total}/${algorithms.byTier[tier].ok}`).join(" \xB7 ");
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u4E09\u5C42\u67B6\u6784 \xB7 \u4E94\u5C42\u95ED\u73AF" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: data.law.exists && data.mcp.mounted ? "ok" : "warn", children: data.law.exists && data.mcp.mounted ? "\u5728\u4F4D" : "\u5F85\u8865\u9F50" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: layers, children: [
		        { state: data.law.exists ? "live" : "idle", label: "\u9A71\u52A8\u5C42 \xB7 \u6CD5\u5219", detail: `${data.law.lines} \u884C \xB7 ${data.law.chapterCount} \u7AE0` },
		        { state: data.skills.metago > 0 ? "live" : "idle", label: "\u80FD\u529B\u5C42 \xB7 \u6280\u80FD", detail: `${data.skills.metago} \u6280\u80FD \xB7 ${data.skills.triggerCount} \u89E6\u53D1\u8BCD` },
		        { state: data.mcp.mounted ? "live" : "idle", label: "\u6267\u884C\u5C42 \xB7 \u5DE5\u5177", detail: `${data.mcp.total} \u4E2A MCP \u5DE5\u5177` },
		        { state: data.packages && data.packages.engine.installed ? "live" : "idle", label: "\u8FDB\u5316\u5C42 \xB7 \u5F15\u64CE", detail: data.packages && data.packages.engine.version ? `v${data.packages.engine.version}` : "\u672A\u5B89\u88C5" },
		        { state: memory.exists ? "live" : "idle", label: "\u8BB0\u5FC6\u5C42 \xB7 KMWI", detail: `H = ${memory.health === void 0 ? "\u2014" : memory.health} / 100 \xB7 ${humanNum(memory.total)} \u6761` }
		      ].map((layer2) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: layer, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: dot, "data-state": layer2.state }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: layerLabel, children: layer2.label }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: mono, children: layer2.detail })
		      ] }, layer2.label)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u6CD5\u5219\u52A0\u8F7D\u9884\u7B97" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: lawTone, children: data.lawBudget.fits ? "\u5168\u6587\u53EF\u52A0\u8F7D" : "\u5C06\u88AB\u622A\u65AD" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6CD5\u5219\u7248\u672C", value: data.law.version ? `V${data.law.version}` : "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6587\u4EF6\u5927\u5C0F", value: `${humanBytes(data.law.bytes)} / ${humanBytes(data.lawBudget.configured)}`, mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "SHA-256", value: data.law.sha256 ? data.law.sha256.slice(0, 16) + "\u2026" : "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u7AE0\u8282 / \u884C\u6570", value: `${data.law.chapterCount} / ${humanNum(data.law.lines)}`, mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Bar, { ratio: data.lawBudget.configured ? data.law.bytes / data.lawBudget.configured : 0, tone: lawTone }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: footnote, children: data.lawBudget.note })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u56DB\u5C42\u8BB0\u5FC6 KMWI" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: band.tone, children: band.label })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5B58\u50A8\u4F4D\u7F6E", value: memory.path || "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u72B6\u6001", value: memory.exists ? `\u5DF2\u843D\u76D8 \xB7 ${humanBytes(memory.bytes)}` : "\u672A\u843D\u76D8" }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u664B\u5347\u5386\u53F2", value: humanNum(memory.history), mono: true })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u8FD0\u884C\u65F6" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: grid, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "Node", value: data.runtime.node }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u5E73\u53F0", value: data.runtime.platform }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "MCP \u5DE5\u5177", value: humanNum(data.mcp.total) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u6280\u80FD", value: humanNum(data.skills.metago) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u89E6\u53D1\u8BCD", value: humanNum(data.skills.triggerCount) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u8C03\u7528\u53F0\u8D26", value: data.runtime.log && data.runtime.log.calls.exists ? humanNum(data.runtime.log.calls.records) : "\u2014" })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u7B97\u6CD5\u5E93" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: coverage.tone, children: coverage.label })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: grid, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u6CE8\u518C\u603B\u6570", value: humanNum(algorithms.registered) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u5B9E\u6D4B\u53EF\u6267\u884C", value: humanNum(algorithms.executable) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u672A\u5B9E\u73B0", value: humanNum(algorithms.notImplemented) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u5F85\u4FEE\uFF08\u8F93\u5165/\u63A5\u53E3\uFF09", value: humanNum(algorithms.errors + algorithms.invalid) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5206\u5C42\uFF1A\u6CE8\u518C / \u53EF\u6267\u884C", value: tierLine, mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u8986\u76D6\u6570\u636E\u6765\u6E90", value: algorithms.source === "absent" ? "\u672A\u626B\u63CF" : "verify-algorithms-all.mjs", mono: true }),
		      (algorithms.topFailureReasons || []).slice(0, 3).map((row2) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: row2.reason.slice(0, 42), value: `${row2.count} \u4E2A`, mono: true }, row2.reason))
		    ] })
		  ] });
		}
		function LawView({ data }) {
		  const axioms = data.law.axioms || [];
		  const properties = data.law.properties || [];
		  const chapters = data.law.chapters || [];
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { className: cardTitle, children: [
		          "\u6838\u5FC3\u516C\u7406\uFF08\u6709\u6B63\u6587 ",
		          axioms.length,
		          " \u6761\uFF09"
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: "ok", children: "A \u7CFB" })
		      ] }),
		      axioms.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: empty, children: "\u672A\u4ECE\u6CD5\u5219\u6587\u4EF6\u4E2D\u89E3\u6790\u5230\u516C\u7406\u8868\u3002" }) : null,
		      axioms.map((axiom) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: `${axiom.id} \xB7 ${axiom.title}`, value: axiom.constraint || "\u2014" }, axiom.id))
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { className: cardTitle, children: [
		          "\u6839\u672C\u5C5E\u6027\uFF08\u6709\u6B63\u6587 ",
		          properties.length,
		          " \u6761\uFF09"
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: "ok", children: "D \u7CFB" })
		      ] }),
		      properties.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: empty, children: "\u672A\u4ECE\u6CD5\u5219\u6587\u4EF6\u4E2D\u89E3\u6790\u5230\u5C5E\u6027\u8868\u3002" }) : null,
		      properties.map((property) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: `${property.id} \xB7 ${property.title}`, value: property.behaviour || "\u2014" }, property.id))
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { className: cardTitle, children: [
		        "\u7AE0\u8282\u76EE\u5F55\uFF08",
		        chapters.length,
		        "\uFF09"
		      ] }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: rows, children: chapters.map((chapter) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: row, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: rowKey, children: chapter.title }) }, chapter.title)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u6CBB\u7406\u6807\u8BB0" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: grid, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "UDGK \u4EA4\u4ED8\u95E8\u7981", value: data.law.markers.udgk ? "\u5728\u4F4D" : "\u7F3A" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u67B6\u6784\u6CBB\u7406\u6761\u6B3E", value: data.law.markers.archGovernance ? "\u5728\u4F4D" : "\u7F3A" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u5B8C\u6574\u6027\u6CBB\u7406\u6761\u6B3E", value: data.law.markers.completeness ? "\u5728\u4F4D" : "\u7F3A" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u7B2C\u5341\u516B\u7AE0 MCP", value: data.law.markers.mcpChapter ? "\u5728\u4F4D" : "\u7F3A" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u7B2C\u5341\u4E5D\u7AE0 \u6D4F\u89C8\u5668", value: data.law.markers.browserChapter ? "\u5728\u4F4D" : "\u7F3A" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: "\u7B2C\u4E8C\u5341\u7AE0 \u8FDB\u7A0B\u94C1\u5F8B", value: data.law.markers.processLaw ? "\u5728\u4F4D" : "\u7F3A" })
		      ] })
		    ] })
		  ] });
		}
		function CapabilityView({ data, consoleMeta, onDone }) {
		  const families = data.skills.families || [];
		  const servers = data.mcp.servers || [];
		  const packages = data.packages || {};
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { className: cardTitle, children: [
		          "MCP \u5DE5\u5177\uFF08",
		          humanNum(data.mcp.total),
		          "\uFF09"
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: data.mcp.mounted ? "ok" : "bad", children: data.mcp.mounted ? "\u5DF2\u6302\u8F7D" : "\u672A\u6302\u8F7D" })
		      ] }),
		      servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: empty, children: "\u5F53\u524D\u7EC4\u5408\u6CA1\u6709\u6302\u8F7D\u4EFB\u4F55 MCP \u670D\u52A1\u5668\u3002" }) : null,
		      servers.map((server) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: serverLabel(server.server), value: humanNum(server.count), mono: true }, server.server))
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u6280\u80FD\u76EE\u5F55" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Badge, { tone: data.skills.metago > 0 ? "ok" : "bad", children: [
		          data.skills.metago,
		          " / ",
		          data.skills.total
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5E26\u89E6\u53D1\u7684\u6280\u80FD", value: `${data.skills.withTrigger} / ${data.skills.metago}`, mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u53BB\u91CD\u89E6\u53D1\u8BCD", value: humanNum(data.skills.triggerCount), mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u76EE\u5F55", value: data.skills.dir, mono: true })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u80FD\u529B\u65CF\u5206\u5E03" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: grid, children: families.slice(0, 24).map((family) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Cell, { label: family.name, value: family.count }, family.name)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "@metago-ai \u5F15\u64CE\u5305" }) }),
		      [
		        ["\u5F15\u64CE engine", packages.engine],
		        ["MCP \u670D\u52A1\u5668 mcp-server", packages.mcpServer],
		        ["\u7B97\u6CD5\u96C6 algorithms", packages.algorithms],
		        ["\u9A8C\u8BC1\u5957\u4EF6 verify-kit", packages.verifyKit],
		        ["\u5F00\u53D1\u5957\u4EF6 dev-kit", packages.devKit]
		      ].map(([label, info]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		        Row,
		        {
		          label,
		          value: info && info.installed ? `v${info.version}` : "\u672A\u5B89\u88C5",
		          mono: true
		        },
		        label
		      ))
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "MCP \u8C03\u7528\u53F0\u8D26" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u65E5\u5FD7\u76EE\u5F55", value: data.runtime.log && data.runtime.log.dir || "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "calls.jsonl", value: data.runtime.log && data.runtime.log.calls.exists ? `${humanNum(data.runtime.log.calls.records)} \u6761 \xB7 ${humanBytes(data.runtime.log.calls.bytes)}` : "\u672A\u751F\u6210", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u9519\u8BEF\u8BB0\u5F55", value: data.runtime.log ? humanNum(data.runtime.log.calls.errors) : "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6700\u8FD1\u65F6\u95F4", value: stamp(data.runtime.log && data.runtime.log.lastTs), mono: true })
		    ] })
		  ] });
		}
		function MemoryView({ data, consoleMeta, onDone }) {
		  const memory = data.memory || {};
		  const layers2 = memory.layers || { K: 0, M: 0, W: 0, I: 0 };
		  const max = Math.max(1, layers2.K, layers2.M, layers2.W, layers2.I);
		  const band = healthBand(memory.health, memory.total);
		  const flow = [
		    ["K \xB7 \u77E5\u8BC6 Knowledge", layers2.K],
		    ["M \xB7 \u8BB0\u5FC6 Memory", layers2.M],
		    ["W \xB7 \u667A\u6167 Wisdom", layers2.W],
		    ["I \xB7 \u76F4\u89C9 Intuition", layers2.I]
		  ];
		  const scores = memory.layerScores || null;
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cardHead, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "KMWI \u56DB\u5C42" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: band.tone, children: band.label })
		      ] }),
		      flow.map(([label, count]) => {
		        const score = scores ? scores[label.slice(0, 1)] : void 0;
		        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: memoryRow, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: memoryName, children: label }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: memoryTrack, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: memoryFill, style: { width: `${count / max * 100}%` } }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: memoryCount, children: score === void 0 ? humanNum(count) : `${score}\u5206` })
		        ] }, label);
		      }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6761\u76EE\u603B\u6570", value: humanNum(memory.total), mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u7EFC\u5408\u5065\u5EB7\u5EA6 H", value: `${memory.health === void 0 ? "\u2014" : memory.health} / 100`, mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5065\u5EB7\u5EA6\u6765\u6E90", value: memory.healthSource || "\u2014", mono: true })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u5B58\u50A8\u4E8B\u5B9E" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u8DEF\u5F84", value: memory.path || "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5B58\u5728", value: memory.exists ? "\u662F" : "\u5426" }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5927\u5C0F", value: humanBytes(memory.bytes), mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5FEB\u7167\u7248\u672C", value: memory.version || "\u2014", mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5FEB\u7167\u65F6\u95F4", value: stamp(memory.timestamp), mono: true }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u664B\u5347\u5386\u53F2", value: humanNum(memory.history), mono: true }),
		      memory.note ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: footnote, children: memory.note }) : null,
		      memory.parseError ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: footnote, children: [
		        "\u89E3\u6790\u5931\u8D25\uFF1A",
		        memory.parseError
		      ] }) : null
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: card, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: cardHead, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: cardTitle, children: "\u53CC\u6D41\u8BF4\u660E" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: footnote, children: "\u8F6C\u5316\u6D41 K \u2192 M \u2192 W \u2192 I\uFF1A\u77E5\u8BC6\u7ECF\u53CD\u590D\u4F7F\u7528\u6C89\u6DC0\u4E3A\u8BB0\u5FC6\uFF0C\u8BB0\u5FC6\u5F52\u7EB3\u4E3A\u667A\u6167\uFF0C\u667A\u6167\u5185\u5316\u4E3A\u76F4\u89C9\u3002 \u53CD\u54FA\u6D41 I \u2192 W \u2192 M \u2192 K\uFF1A\u76F4\u89C9\u88AB\u9A8C\u8BC1\u540E\u56DE\u5199\u667A\u6167\uFF0C\u667A\u6167\u5931\u8D25\u540E\u56DE\u9000\u4E3A\u8BB0\u5FC6\uFF0C\u8BB0\u5FC6\u5931\u6548\u540E\u56DE\u9000\u4E3A\u77E5\u8BC6\u3002 \u5F15\u64CE\u7684\u5B58\u50A8\u8DEF\u5F84\u9ED8\u8BA4\u8DDF\u968F\u8FDB\u7A0B\u5DE5\u4F5C\u76EE\u5F55\uFF0C\u672C\u63D2\u4EF6\u628A\u672C\u673A\u6743\u5A01\u8DEF\u5F84\u56FA\u5B9A\u5230 $DSH_HOME \u4E0B\u5E76\u5728\u6B64\u5982\u5B9E\u5448\u73B0\u3002" })
		    ] })
		  ] });
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/icon.module.css
		var css3 = ".IW4ypW_icon{color:var(--dsw-alias-label-secondary);justify-content:center;align-items:center;display:inline-flex}.IW4ypW_icon[data-active]{color:var(--dsw-alias-label-primary)}";
		var tagId3 = "metago-lifeform-dsh/icon.module.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId3 + '"]') === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "metago-lifeform-dsh";
		  tag.dataset.pluginCss = tagId3;
		  tag.textContent = css3;
		  document.head.appendChild(tag);
		}
		var icon = "IW4ypW_icon";
		
		// ../MetaGO-Atlas/console-plugin/src/client/PanelIcon.js
		var import_jsx_runtime4 = require("react/jsx-runtime");
		function PanelIcon({ size = 16, active = false }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		    "span",
		    {
		      className: icon,
		      "data-active": active ? "" : void 0,
		      style: { width: size, height: size },
		      "aria-hidden": "true",
		      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 16 16", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M8 1.6 14 4.6 8 7.6 2 4.6Z" }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M2 8.1 8 11.1 14 8.1" }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M2 11.4 8 14.4 14 11.4" })
		      ] })
		    }
		  );
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/SettingsSection.js
		var import_react4 = require("react");
		
		// ../MetaGO-Atlas/console-plugin/src/client/surface.module.css
		var css4 = ".SvJb1a_stack{color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;padding:4px 0 24px;display:flex}.SvJb1a_card{border-radius:var(--dsw-radius-xl);border:.5px solid var(--dsw-alias-settings-card-stroke);background:var(--dsw-alias-settings-card-fill);padding:16px}.SvJb1a_cardHead{justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;display:flex}.SvJb1a_cardTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;font-weight:600;line-height:22px}.SvJb1a_cardBody{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.SvJb1a_badge{border-radius:var(--dsw-radius-xs);border:.5px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);flex:none;padding:1px 8px;font-size:11px;line-height:18px}.SvJb1a_badge[data-tone=ok]{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-tertiary)}.SvJb1a_badge[data-tone=warn]{color:var(--dsw-alias-state-warn-label);border-color:var(--dsw-alias-state-warn-tertiary)}.SvJb1a_badge[data-tone=bad]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-secondary)}.SvJb1a_rows{flex-direction:column;gap:6px;margin:0;display:flex}.SvJb1a_row{justify-content:space-between;align-items:baseline;gap:12px;font-size:13px;line-height:20px;display:flex}.SvJb1a_rowKey{color:var(--dsw-alias-label-tertiary);flex:none}.SvJb1a_rowValue{text-align:right;min-width:0;color:var(--dsw-alias-label-primary);word-break:break-all}.SvJb1a_mono{font-family:var(--ds-font-family-code);font-size:12px}.SvJb1a_grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;display:grid}.SvJb1a_cell{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);padding:8px 10px;font-size:13px;line-height:20px}.SvJb1a_cellKey{color:var(--dsw-alias-label-tertiary);font-size:12px}.SvJb1a_cellValue{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary)}.SvJb1a_table{border-collapse:collapse;width:100%;font-size:13px;line-height:20px}.SvJb1a_table th{text-align:left;color:var(--dsw-alias-label-tertiary);border-bottom:.5px solid var(--dsw-alias-border-l3);padding:6px 8px;font-weight:600}.SvJb1a_table td{vertical-align:top;color:var(--dsw-alias-label-secondary);border-bottom:.5px solid var(--dsw-alias-border-l2);padding:6px 8px}.SvJb1a_idCell{width:56px;font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);white-space:nowrap}.SvJb1a_empty{color:var(--dsw-alias-label-tertiary);padding:8px 0;font-size:13px;line-height:20px}.SvJb1a_footnote{color:var(--dsw-alias-label-caption);margin:8px 0 0;font-size:12px;line-height:18px}.SvJb1a_error{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-state-error-secondary);border-radius:var(--dsw-radius-md);margin-bottom:12px;padding:10px 12px;font-size:13px;line-height:20px}";
		var tagId4 = "metago-lifeform-dsh/surface.module.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId4 + '"]') === null) {
		  const tag = document.createElement("style");
		  tag.dataset.plugin = "metago-lifeform-dsh";
		  tag.dataset.pluginCss = tagId4;
		  tag.textContent = css4;
		  document.head.appendChild(tag);
		}
		var badge = "SvJb1a_badge";
		var card2 = "SvJb1a_card";
		var cardBody = "SvJb1a_cardBody";
		var cardHead2 = "SvJb1a_cardHead";
		var cardTitle2 = "SvJb1a_cardTitle";
		var empty2 = "SvJb1a_empty";
		var footnote2 = "SvJb1a_footnote";
		var grid2 = "SvJb1a_grid";
		var idCell = "SvJb1a_idCell";
		var rows2 = "SvJb1a_rows";
		var stack = "SvJb1a_stack";
		var table = "SvJb1a_table";
		
		// ../MetaGO-Atlas/console-plugin/src/client/SettingsSection.js
		var import_jsx_runtime5 = require("react/jsx-runtime");
		function SettingsSection() {
		  const [reloadKey, setReloadKey] = (0, import_react4.useState)(0);
		  const status = useMetago("status", reloadKey);
		  const data = status.data;
		  const band = data ? healthBand(data.memory && data.memory.health, data.memory && data.memory.total) : { label: "", tone: "idle" };
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: stack, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: card2, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: cardHead2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: cardTitle2, children: "\u5143\u6784\u751F\u547D\u4F53 \xB7 \u672C\u673A\u4F53\u68C0" }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { tone: data && data.law.exists && data.mcp.mounted ? "ok" : "warn", children: data && data.law.exists && data.mcp.mounted ? "\u5728\u4F4D" : status.state === "loading" ? "\u8BFB\u53D6\u4E2D" : "\u5F85\u8865\u9F50" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: cardBody, children: "MetaGO Intelligent Lifeform\uFF08\u5143\u6784\u8D85\u7EA7\u667A\u80FD\u751F\u547D\u4F53\u6A21\u5F0F\u5957\u4EF6 \xB7 \u9A6D\u667A\u5C42\uFF09\u628A\u6CD5\u5219\u3001\u6280\u80FD\u3001\u5DE5\u5177\u4E0E\u8BB0\u5FC6\u5408\u6210\u4E00\u6761\u95ED\u73AF\u3002 \u672C\u9875\u53EA\u8BFB\u5C55\u793A\u672C\u673A\u5B9E\u9645\u88C5\u914D\u4E86\u4EC0\u4E48\uFF1B\u6240\u6709\u6570\u5B57\u90FD\u7531\u63D2\u4EF6\u5BBF\u4E3B\u534A\u5728\u6BCF\u6B21\u6253\u5F00\u65F6\u5B9E\u8BFB\u78C1\u76D8\u4E0E\u8FD0\u884C\u65F6\u5F97\u5230\u3002" }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: rows2, style: { marginTop: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		        "button",
		        {
		          type: "button",
		          className: badge,
		          onClick: () => setReloadKey((value) => value + 1),
		          style: { alignSelf: "flex-start", cursor: "pointer" },
		          children: "\u91CD\u65B0\u4F53\u68C0"
		        }
		      ) })
		    ] }),
		    status.state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ErrorBox, { message: status.error }) : null,
		    status.state === "loading" && data === null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Loading, {}) : null,
		    data ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: cardHead2, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: cardTitle2, children: "\u6CD5\u5219" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { tone: data.lawBudget.fits ? "ok" : "bad", children: data.lawBudget.fits ? "\u5168\u6587\u53EF\u52A0\u8F7D" : `\u5C06\u622A\u65AD ${humanBytes(data.lawBudget.truncatedBy)}` })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u8DEF\u5F84", value: data.law.path, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u7248\u672C", value: data.law.version ? `V${data.law.version}` : "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u5927\u5C0F / \u9884\u7B97", value: `${humanBytes(data.law.bytes)} / ${humanBytes(data.lawBudget.configured)}`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u884C\u6570 / \u7AE0\u8282", value: `${humanNum(data.law.lines)} / ${data.law.chapterCount}`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u516C\u7406 / \u5C5E\u6027\uFF08\u6709\u6B63\u6587\uFF09", value: `${data.law.axioms.length} / ${data.law.properties.length}`, mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "SHA-256", value: data.law.sha256 || "\u2014", mono: true }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: footnote2, children: data.lawBudget.note })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: cardHead2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: cardTitle2, children: "\u80FD\u529B\u9762" }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: grid2, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u5143\u6784\u6280\u80FD", value: humanNum(data.skills.metago) }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u6280\u80FD\u603B\u6570", value: humanNum(data.skills.total) }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u53BB\u91CD\u89E6\u53D1\u8BCD", value: humanNum(data.skills.triggerCount) }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "MCP \u5DE5\u5177", value: humanNum(data.mcp.total) }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u5F15\u64CE", value: data.packages.engine.installed ? `v${data.packages.engine.version}` : "\u672A\u5B89\u88C5" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u8BB0\u5FC6\u5065\u5EB7 H", value: data.memory.health === void 0 ? "\u2014" : `${data.memory.health} / 100` }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Cell, { label: "\u8BB0\u5FC6\u6761\u76EE", value: humanNum(data.memory.total) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: rows2, style: { marginTop: 12 }, children: [
		          (data.mcp.servers || []).map((server) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: serverLabel(server.server), value: humanNum(server.count), mono: true }, server.server)),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Row, { label: "\u8BB0\u5FC6\u72B6\u6001", value: data.memory.exists ? `\u5DF2\u843D\u76D8 \xB7 ${band.label}` : "\u672A\u843D\u76D8" })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: cardHead2, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: cardTitle2, children: "\u63D2\u4EF6\u8FB9\u754C\uFF08\u8BDA\u5B9E\u58F0\u660E\uFF09" }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: cardBody, children: "\u672C\u63D2\u4EF6\u662F\u53EA\u8BFB\u89C2\u6D4B\u9762 + \u4E00\u6761\u72B6\u6001\u5DE5\u5177\uFF0C\u4E0D\u4EE3\u7406\u4EFB\u4F55\u5143\u6784\u6267\u884C\u3002\u5B83\u4E0D\u4F1A\uFF1A \u66FF\u6A21\u578B\u51B3\u5B9A\u4F55\u65F6\u8C03\u7528\u5143\u6784\u5DE5\u5177\uFF08\u7531\u6CD5\u5219\u4E0E\u89E6\u53D1\u534F\u8BAE\u51B3\u5B9A\uFF09\u3001\u4FEE\u6539\u6CD5\u5219\u6216\u6280\u80FD\u6587\u4EF6\u3001 \u5199\u5165 KMWI \u5B58\u50A8\u3001\u6216\u4EE3\u66FF MCP \u670D\u52A1\u5668\u6267\u884C\u7B97\u6CD5\u3002 \u5B83\u53EA\u505A\u4E09\u4EF6\u4E8B\uFF1A\u628A\u672C\u673A\u771F\u5B9E\u88C5\u914D\u72B6\u6001\u8BFB\u51FA\u6765\u3001\u628A\u6CD5\u5219\u8868\u683C\u89E3\u6790\u6210\u53EF\u8BFB\u9875\u9762\u3001\u628A 112 \u4E2A\u5DE5\u5177\u548C 100 \u4E2A\u6280\u80FD\u7684\u5B58\u5728\u6027\u53D8\u6210\u53EF\u6838\u5BF9\u7684\u4E8B\u5B9E\u3002" }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: footnote2, children: [
		          "\u63D2\u4EF6\u6839\u76EE\u5F55 ",
		          data.plugin.root,
		          " \xB7 \u7248\u672C ",
		          data.plugin.version,
		          " \xB7 Node ",
		          data.runtime.node,
		          " \xB7 ",
		          data.runtime.platform
		        ] })
		      ] })
		    ] }) : null
		  ] });
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/CodexSection.js
		var import_jsx_runtime6 = require("react/jsx-runtime");
		function CodexSection() {
		  const status = useMetago("law", 0);
		  const data = status.data;
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: stack, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: card2, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cardHead2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: cardTitle2, children: "\u5143\u6784\u6CD5\u5178" }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Badge, { tone: data ? "ok" : "idle", children: data ? `V${data.version}` : "\u8BFB\u53D6\u4E2D" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: cardBody, children: "\u4E0B\u8868\u9010\u884C\u53D6\u81EA $DSH_HOME/AGENTS.md \u6B63\u6587\u3002\u4E0A\u6E38\u300A\u5143\u6784\u5168\u606F\u667A\u80FD\u5F15\u64CE\u300B\u84DD\u672C\u672A\u516C\u5F00\uFF0C \u56E0\u6B64 A6\u2013A33 \u4E0E D1\u2013D36 \u53EA\u6709\u8303\u56F4\u5360\u4F4D\u3001\u6CA1\u6709\u6B63\u6587\uFF1B\u8FD9\u91CC\u53EA\u5448\u73B0\u6709\u6B63\u6587\u7684\u6761\u76EE\uFF0C \u4E0D\u628A\u5360\u4F4D\u5F53\u6210\u6761\u6B3E\u3002" })
		    ] }),
		    status.state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ErrorBox, { message: status.error }) : null,
		    status.state === "loading" && data === null ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Loading, {}) : null,
		    data ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cardHead2, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("h2", { className: cardTitle2, children: [
		          "\u6838\u5FC3\u516C\u7406 \xB7 ",
		          data.axioms.length,
		          " \u6761\u6709\u6B63\u6587"
		        ] }) }),
		        data.axioms.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: empty2, children: "\u672A\u89E3\u6790\u5230\u516C\u7406\u8868\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { className: table, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u7F16\u53F7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u516C\u7406" }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u8FD0\u884C\u7EA6\u675F" })
		          ] }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tbody", { children: data.axioms.map((axiom) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { className: idCell, children: axiom.id }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: axiom.title }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: axiom.constraint })
		          ] }, axiom.id)) })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cardHead2, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("h2", { className: cardTitle2, children: [
		          "\u6839\u672C\u5C5E\u6027 \xB7 ",
		          data.properties.length,
		          " \u6761\u6709\u6B63\u6587"
		        ] }) }),
		        data.properties.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: empty2, children: "\u672A\u89E3\u6790\u5230\u5C5E\u6027\u8868\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { className: table, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u7F16\u53F7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u5C5E\u6027" }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u5F3A\u5236\u884C\u4E3A" })
		          ] }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tbody", { children: data.properties.map((property) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { className: idCell, children: property.id }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: property.title }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: property.behaviour })
		          ] }, property.id)) })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: card2, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cardHead2, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: cardTitle2, children: "\u8FD0\u884C\u534F\u8BAE\u4E0E\u95E8\u7981" }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: rows2, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "UDGK \u4EA4\u4ED8\u95E8\u7981", value: data.markers.udgk ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u7B2C\u4E00\u6027\u539F\u7406\u516C\u7406 A37 / D44", value: data.axioms.some((item) => item.id === "A37") ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u5BF9\u6297\u5F0F\u5BA1\u67E5\u516C\u7406 A38 / D45", value: data.axioms.some((item) => item.id === "A38") ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u67B6\u6784\u6CBB\u7406\u5F3A\u5236\u89C4\u5219", value: data.markers.archGovernance ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u5B8C\u6574\u6027\u6CBB\u7406\u6761\u6B3E", value: data.markers.completeness ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u7B2C\u5341\u516B\u7AE0 MCP \u89E6\u53D1\u534F\u8BAE", value: data.markers.mcpChapter ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u7B2C\u5341\u4E5D\u7AE0 \u6D4F\u89C8\u5668\u81EA\u52A8\u5316", value: data.markers.browserChapter ? "\u5728\u4F4D" : "\u7F3A" }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Row, { label: "\u7B2C\u4E8C\u5341\u7AE0 \u8FDB\u7A0B\u6E05\u7406\u94C1\u5F8B", value: data.markers.processLaw ? "\u5728\u4F4D" : "\u7F3A" })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: footnote2, children: '\u5982\u67D0\u4E00\u7AE0\u663E\u793A"\u7F3A"\uFF0C\u8BF4\u660E\u5F53\u524D\u52A0\u8F7D\u7684\u6CD5\u5219\u88AB\u6307\u4EE4\u9884\u7B97\u622A\u65AD\u6216\u8BE5\u7248\u672C\u5C1A\u672A\u5305\u542B\u8BE5\u7AE0\u3002 \u5143\u6784\u751F\u547D\u4F53\u6A21\u5F0F\u7684 Agent preset \u628A\u9884\u7B97\u63D0\u5230 262144 B\uFF0C\u4F7F\u5B8C\u6574\u6CD5\u5219\u8FDB\u5165\u4E0A\u4E0B\u6587\u3002' })
		      ] })
		    ] }) : null
		  ] });
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/branding/brand-assets.js
		var WORDMARK_DATA_URI = "data:image/png;base64,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";
		var HERO_DATA_URI = "data:image/webp;base64,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";
		
		// ../MetaGO-Atlas/console-plugin/src/client/branding/BrandMark.js
		var import_jsx_runtime7 = require("react/jsx-runtime");
		function SidebarBrandMark({ size = 24 }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		    "img",
		    {
		      className: "meta-brand-wordmark",
		      src: WORDMARK_DATA_URI,
		      alt: "",
		      "aria-hidden": "true",
		      draggable: false,
		      "data-brand-size": size
		    }
		  );
		}
		function HeroBrandMark({ size = 34, className }) {
		  const edge = size * 3;
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		    "img",
		    {
		      className: className === void 0 ? "meta-brand-hero" : `meta-brand-hero ${className}`,
		      src: HERO_DATA_URI,
		      alt: "",
		      "aria-hidden": "true",
		      draggable: false,
		      width: edge,
		      height: edge,
		      "data-host-size": size
		    }
		  );
		}
		function SidebarBrandName() {
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "meta-brand-name", children: "MetaGO Fabric" });
		}
		
		// ../MetaGO-Atlas/console-plugin/src/client/locales.js
		var NS = "metago";
		var zh = {
		  panel: "\u5143\u6784\u63A7\u5236\u53F0",
		  nav: "\u5143\u6784\u751F\u547D\u4F53",
		  codex: "\u5143\u6784\u6CD5\u5178",
		  hint: "MetaGO Intelligent Lifeform\uFF08\u5143\u6784\u8D85\u7EA7\u667A\u80FD\u751F\u547D\u4F53\u6A21\u5F0F\u5957\u4EF6 \xB7 \u9A6D\u667A\u5C42\uFF09\u5728\u672C\u673A\u7684\u5B9E\u65F6\u4F53\u68C0\u9762\u3002"
		};
		var en = {
		  panel: "MetaGO Console",
		  nav: "MetaGO Lifeform",
		  codex: "MetaGO Codex",
		  hint: "Live inspection surface for the MetaGO Intelligent Lifeform installation on this host."
		};
		
		// ../MetaGO-Atlas/console-plugin/src/client/index.js
		var PANEL_ID = "metago-lifeform";
		var inject = ["slots", "layout", "locale"];
		function apply(ctx) {
		  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "metago: dictionaries");
		  const t = ctx.locale.bind(NS);
		  const SHADOW = -1;
		  ctx.slots.inject("sidebar.brand.mark", () => ctx.slots.register({
		    name: "sidebar.brand.mark",
		    priority: SHADOW
		  }, SidebarBrandMark));
		  ctx.slots.inject("sidebar.brand.name", () => ctx.slots.register({
		    name: "sidebar.brand.name",
		    priority: SHADOW
		  }, SidebarBrandName));
		  ctx.slots.inject("conversation.hero.brand.mark", () => ctx.slots.register({
		    name: "conversation.hero.brand.mark",
		    priority: SHADOW
		  }, HeroBrandMark));
		  ctx.slots.inject("main", () => ctx.slots.register({
		    name: "main",
		    key: PANEL_ID,
		    locale: NS
		  }, PanelPage));
		  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
		    name: "sidebar.panellist",
		    id: PANEL_ID,
		    order: 2,
		    label: () => t("panel"),
		    locale: NS
		  }, PanelIcon));
		  ctx.slots.inject("settings.section", () => ctx.slots.register({
		    name: "settings.section",
		    id: "metago-lifeform",
		    order: 40,
		    label: () => t("nav"),
		    locale: NS
		  }, SettingsSection));
		  ctx.slots.inject("settings.section", () => ctx.slots.register({
		    name: "settings.section",
		    id: "metago-codex",
		    order: 41,
		    label: () => t("codex"),
		    locale: NS
		  }, CodexSection));
		}
		//# sourceMappingURL=client.bundle.cjs.map
		
		return module.exports;
	}
});
//# sourceMappingURL=client.js.map

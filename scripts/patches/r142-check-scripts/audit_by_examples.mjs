// audit_by_examples.mjs — 直接用 schema 里的 examples 传参，验能否跑通
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const TR = createRequire(A + '/') (A + '/tool-registry.js')
const L3 = Object.keys(TR.L3_ID_MAP || {})
function runServer(script){return new Promise(res=>{const c=spawn(process.execPath,[script],{stdio:['pipe','pipe','pipe']});let b='',i=0;const p=new Map();let s=false;const done=v=>{if(s)return;s=true;res(v)};const tm=setTimeout(()=>done({error:'timeout'}),180000);const send=o=>{try{c.stdin.write(JSON.stringify(o)+'\n')}catch(e){}};const call=(m,pa)=>new Promise(r=>{const id=++i;p.set(id,r);send({jsonrpc:'2.0',id,method:m,params:pa})});c.stdout.on('data',d=>{b+=d;let k;while((k=b.indexOf('\n'))>=0){const l=b.slice(0,k).trim();b=b.slice(k+1);if(!l)continue;let m;try{m=JSON.parse(l)}catch(e){continue}if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id)}}});c.on('error',e=>done({error:e.message}));(async()=>{await call('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'a',version:'1'}});send({jsonrpc:'2.0',method:'notifications/initialized'});clearTimeout(tm);s=true;res({call:async(n,a)=>{const r=await call('tools/call',{name:n,arguments:a});let t='';try{t=(r.result.content||[]).map(x=>x.text||'').join('')}catch(e){};try{return JSON.parse(t)}catch(e){return{raw:t.slice(0,150)}}},kill:()=>{try{c.kill()}catch(e){}}})})().catch(e=>{clearTimeout(tm);done({error:e.message})})})}
/* 判据修正：不能只认「有数值」。
   有两类工具的合法产出本来就没有数字：
     · 聚类类（coupling_clustering）→ {clusters:[[标签...]]}，是分组不是数值
     · 记录类（record_symmetric）  → 返回存储对象，是写入确认不是计算
   正确判据：有数值 **或** 有非空且有内容的数组/对象（排除纯 provenance）。 */
const hasNum=v=>{if(typeof v==='number')return isFinite(v);if(Array.isArray(v))return v.some(hasNum);if(v&&typeof v==='object')return Object.values(v).some(hasNum);return false}
const hasPayload=v=>{
  if(v===null||v===undefined)return false
  if(Array.isArray(v))return v.length>0
  if(typeof v!=='object')return false
  const ks=Object.keys(v).filter(k=>k!=='provenance')
  if(!ks.length)return false
  return ks.some(k=>{
    const x=v[k]
    if(x===null||x===undefined)return false
    if(Array.isArray(x))return x.length>0
    if(typeof x==='string')return x.trim().length>0
    if(typeof x==='number')return isFinite(x)
    if(typeof x==='object')return Object.keys(x).length>0
    return true
  })
}
const meaningful=(r)=>r&&r.success===true&&(hasNum(r.output)||hasPayload(r.output))
const srv=await runServer(A+'/index.js')
if(srv.error){console.log('服务器失败:',srv.error);process.exit(1)}
let ok=0,bad=[]
for(const nm of L3.sort()){
  let ex=null
  try{const d=JSON.parse(readFileSync(A+'/tools/'+nm+'.json','utf8'));const a=d.arguments||d.inputSchema||{};if(a.examples&&a.examples[0])ex=a.examples[0]}catch(e){}
  if(!ex){bad.push([nm,'无 examples']);console.log('  ⊘ '+nm.padEnd(28)+'无 examples');continue}
  let r;try{r=await srv.call(nm,ex)}catch(e){r={error:e.message}}
  const good=meaningful(r)
  if(good)ok++;else bad.push([nm,(r&&r.error)||'无数值'])
  console.log('  '+(good?'✓':'✗')+' '+nm.padEnd(28)+'success='+(r&&r.success)+' 有实质='+(r&&r.success===true&&(hasNum(r.output)||hasPayload(r.output)))+((r&&r.error)?'  '+String(r.error).slice(0,44):''))
}
srv.kill()
console.log('\n'+'-'.repeat(90))
console.log('按 examples 传参可跑通：'+ok+' / '+L3.length)
if(bad.length){console.log('\n仍不可用：');for(const [n,e] of bad)console.log('  '+n+': '+e)}
console.log(bad.length===0?'\n总判定：PASS':'\n总判定：FAIL')
process.exit(bad.length===0?0:1)

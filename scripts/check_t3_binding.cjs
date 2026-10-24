// check_t3_binding.cjs — 检查 T3 族实现是否全部绑定成功
//
// 为什么需要这个检查：
//   registry.js 里 t3impl/families/*.js 的加载是逐族 try/catch 的——
//   单族失败合理（不拖垮其它族），但「全部失败」时只有 __t3Binding 这个统计对象能反映，
//   而之前没有任何检查读它。若某次重装后族文件全丢，bound 会从 227 掉到 0，
//   而 T3 自测（走 shapes.json 样例）仍会显示 227/227 通过。
const R = require('C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js')
const b = R.__t3Binding || null
if (!b) {
  console.log('T3 绑定统计：__t3Binding 未暴露（说明绑定段未执行）')
  console.log('总判定：FAIL')
  process.exit(1)
}
console.log('T3 绑定统计：bound ' + b.bound + ' / total ' + b.total + ' / families ' + b.families)
const ok = (b.bound === 227 && b.total === 227 && b.families === 16)
console.log(ok ? '总判定：PASS' : '总判定：FAIL（期望 227/227/16）')
process.exit(ok ? 0 : 1)

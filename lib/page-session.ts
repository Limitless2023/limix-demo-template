/**
 * [INPUT]: 无依赖（浏览器里用 crypto.randomUUID）
 * [OUTPUT]: 导出 PAGE_SESSION
 * [POS]: 页面会话号：打开一次页面生成一个，随每次调用发给服务端，留痕时把同一场演示的调用串起来。
 *        即时预估（hooks/use-instant.ts）与时序预测（components/forecast/forecast-demo.tsx）共用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const PAGE_SESSION =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : ""

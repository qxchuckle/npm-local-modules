/**
 * 兼容 ESM default 与 CJS require 得到的 { default } 形态。
 * 用于 @inquirer/* 等可能以 default 导出的模块，避免 "xxx is not a function"。
 */
export function resolveInquirerExport<T>(mod: T | { default: T }): T {
  return (
    typeof mod === 'function' ? mod : (mod as { default: T }).default
  ) as T;
}

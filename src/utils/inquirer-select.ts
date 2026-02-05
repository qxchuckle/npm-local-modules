import inquirerSelect from '@inquirer/select';

// 兼容 ESM default 与 CJS require 得到的 { default } 形态，避免 "select is not a function"
export const select =
  typeof inquirerSelect === 'function'
    ? inquirerSelect
    : (inquirerSelect as { default: typeof inquirerSelect }).default;

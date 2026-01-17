export default {
  // 对于 js、ts 脚本文件，应用 eslint
  'src/**/*.{js,jsx,tsx,ts,mjs,cjs,mts,cts}': ['eslint --fix'],
  // 用 prettier 修复所有支持的文件格式
  '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts,json,md,html,css,scss,yaml,yml}': [
    'prettier --write',
  ],
};

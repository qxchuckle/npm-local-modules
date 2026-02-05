import chalk from 'chalk';
import type { SelectTheme } from './types';

export function createDefaultTheme(multiple: boolean): SelectTheme {
  return {
    icon: {
      checked: multiple ? chalk.green('[✓]') : '',
      unchecked: multiple ? '[ ]' : '',
      cursor: chalk.cyan('>'),
      inputCursor: chalk.cyan('>>'),
    },
    style: {
      highlight: (text: string) => chalk.cyan(text),
      disabled: (text: string) => chalk.dim(`-[x] ${text}`),
      selected: (text: string) => text,
      placeholder: (text: string) => chalk.dim(text),
      error: (text: string) => chalk.red(text),
      help: (text: string) => chalk.dim(text),
      emptyText: (text: string) => chalk.blue(`ℹ ${chalk.bold(text)}`),
    },
  };
}

export function mergeTheme(
  multiple: boolean,
  userTheme?: Partial<SelectTheme>,
): SelectTheme {
  const defaultTheme = createDefaultTheme(multiple);
  return {
    icon: { ...defaultTheme.icon, ...userTheme?.icon },
    style: { ...defaultTheme.style, ...userTheme?.style },
  };
}

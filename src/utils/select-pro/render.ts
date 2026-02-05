import { Separator } from '@inquirer/core';
import chalk from 'chalk';
import { t } from '../i18n';
import { isSelectable } from './utils';
import { ansiEscapes } from './utils';
import type { SelectOption, SelectTheme } from './types';
import { SelectStatus } from './types';
import type { SelectState, SelectRefs } from './hooks/useSelectState';

export interface RenderConfig {
  pageSize: number;
  emptyText: string;
  placeholder: string;
  confirmDelete: boolean;
  enableFilter: boolean;
  multiple: boolean;
  canToggleAll: boolean;
}

export function renderPage<Value>(
  state: SelectState<Value>,
  theme: SelectTheme,
  emptyText: string,
  pageSize: number,
): string {
  const { displayItems, status, cursor } = state;

  if (displayItems.length <= 0) {
    if (status === SelectStatus.UNLOADED) {
      return '';
    }
    return theme.style.emptyText(emptyText);
  }

  const total = displayItems.length;
  const effectivePageSize = Math.min(pageSize, total);

  let start = 0;
  if (cursor >= 0) {
    const halfPage = Math.floor(effectivePageSize / 2);
    if (cursor < halfPage) {
      start = 0;
    } else if (cursor >= total - halfPage) {
      start = Math.max(0, total - effectivePageSize);
    } else {
      start = cursor - halfPage;
    }
  }

  const end = Math.min(start + effectivePageSize, total);
  const visibleItems = displayItems.slice(start, end);

  const lines: string[] = [];
  visibleItems.forEach((item, index) => {
    const actualIndex = start + index;
    const isActive = actualIndex === cursor;

    if (Separator.isSeparator(item as any)) {
      lines.push(`  ${(item as Separator).separator}`);
      return;
    }

    const opt = item as SelectOption<Value> & { checked?: boolean };
    const line = opt.name || String(opt.value);
    if (opt.disabled) {
      const disabledLabel =
        typeof opt.disabled === 'string' ? opt.disabled : '(disabled)';
      lines.push(theme.style.disabled(`${line} ${disabledLabel}`));
      return;
    }

    const checkbox = opt.checked ? theme.icon.checked : theme.icon.unchecked;
    const cursorIcon = isActive ? theme.icon.cursor : ' ';
    const text = `${cursorIcon}${checkbox ? checkbox + ' ' : ''}${line}`;
    lines.push(isActive ? theme.style.highlight(text) : text);
  });

  return lines.join('\n');
}

export function renderSelectedOptions<Value>(refs: SelectRefs<Value>): string {
  return refs.selections.current
    .map((option) =>
      option.focused
        ? chalk.inverse(option.name || String(option.value))
        : option.name || String(option.value),
    )
    .join(', ');
}

export function renderHelp<Value>(
  state: SelectState<Value>,
  theme: SelectTheme,
  config: RenderConfig,
): { top: string; bottom: string } {
  const { displayItems, focusedSelection } = state;
  const { pageSize, multiple, canToggleAll } = config;

  const keys: string[] = [];

  if (multiple) {
    keys.push(t('selectProHelpTabSelect'));
    if (canToggleAll) {
      keys.push(t('selectProHelpCtrlAToggleAll'));
    }
  }
  keys.push(t('selectProHelpEnterConfirm'));

  if (focusedSelection >= 0) {
    keys.push(t('selectProHelpBackspaceAgainToRemove'));
  }

  const top = keys.length > 0 ? ` (${keys.join(', ')})` : '';

  const bottom =
    displayItems.length > pageSize
      ? `\n${theme.style.help(`(${t('selectProHelpArrowKeys')})`)}`
      : '';

  return { top, bottom };
}

export function renderInput<Value>(
  state: SelectState<Value>,
  theme: SelectTheme,
  placeholder: string,
  confirmDelete: boolean,
  answer: string,
): string {
  const { status, filterInput, focusedSelection } = state;

  if (status === SelectStatus.UNLOADED) return '';

  let input = `\n${theme.icon.inputCursor} `;
  if (!answer && !filterInput) {
    input += theme.style.placeholder(placeholder);
  } else {
    input += `${answer ? `${answer} ` : ''}${filterInput}`;
  }

  if (confirmDelete) {
    input +=
      focusedSelection >= 0 ? ansiEscapes.cursorHide : ansiEscapes.cursorShow;
  }

  return input;
}

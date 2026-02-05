import { Separator } from '@inquirer/core';
import type { KeypressEvent } from '@inquirer/core';
import type { InternalSelectItem, SelectOption, SelectTheme } from './types';

/** ANSI 转义序列 */
export const ansiEscapes = {
  cursorHide: '\x1B[?25l',
  cursorShow: '\x1B[?25h',
};

export function isSelectable<Value>(
  item: InternalSelectItem<Value>,
): item is SelectOption<Value> & { checked?: boolean } {
  return (
    !Separator.isSeparator(item as any) &&
    !(item as SelectOption<Value>).disabled
  );
}

export function toggle<Value>(
  item: InternalSelectItem<Value>,
): InternalSelectItem<Value> {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

export function check<Value>(
  item: InternalSelectItem<Value>,
  checked = true,
): InternalSelectItem<Value> {
  return isSelectable(item) && item.checked !== checked
    ? { ...item, checked }
    : item;
}

export function value2Name(value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return value.toString();
  }
  return '';
}

export function isTabKey(key: KeypressEvent): boolean {
  return key.name === 'tab';
}

export function isSelectAllKey(key: KeypressEvent): boolean {
  return key.name === 'a' && key.ctrl === true;
}

export function isEscKey(key: KeypressEvent): boolean {
  return key.name === 'escape';
}

export function isDirectionKey(key: KeypressEvent): boolean {
  return (
    key.name === 'up' ||
    key.name === 'down' ||
    key.name === 'left' ||
    key.name === 'right'
  );
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

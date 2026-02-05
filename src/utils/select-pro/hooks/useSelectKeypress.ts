import {
  useKeypress,
  isEnterKey,
  isBackspaceKey,
  isUpKey,
  isDownKey,
} from '@inquirer/core';
import {
  isTabKey,
  isSelectAllKey,
  isEscKey,
  isDirectionKey,
  isSelectable,
} from '../utils';
import type { SelectValue } from '../types';
import { SelectStatus } from '../types';
import type { SelectState, SelectRefs } from './useSelectState';
import type { SelectActions } from './useSelectActions';

export interface UseSelectKeypressConfig<Value, Multiple extends boolean> {
  multiple: boolean;
  enableFilter: boolean;
  canToggleAll?: boolean;
  selectFocusedOnSubmit?: boolean;
  loop?: boolean;
}

export function useSelectKeypress<Value, Multiple extends boolean>(
  config: UseSelectKeypressConfig<Value, Multiple>,
  state: SelectState<Value>,
  refs: SelectRefs<Value>,
  setters: {
    setFilterInput: (s: string) => void;
    setError: (s: string) => void;
    setCursor: (n: number) => void;
    setFocusedSelection: (n: number) => void;
  },
  actions: SelectActions<Value, Multiple>,
  done: (value: SelectValue<Value, Multiple>) => void,
): void {
  const { displayItems, cursor, filterInput, status, focusedSelection } = state;
  const {
    multiple,
    enableFilter,
    canToggleAll = false,
    selectFocusedOnSubmit = false,
    loop = false,
  } = config;

  useKeypress((key, rl) => {
    if (focusedSelection >= 0) {
      if (isBackspaceKey(key)) {
        actions.removeLastSelection();
        setters.setFilterInput('');
        rl.clearLine(0);
      } else if (isDirectionKey(key) || isEscKey(key)) {
        const focusedItem = refs.selections.current[focusedSelection];
        if (focusedItem) {
          focusedItem.focused = false;
        }
        setters.setFocusedSelection(-1);
        // 退出焦点模式时清空输入行，与 readline 保持一致
        setters.setFilterInput('');
        rl.clearLine(0);
      }
      return;
    }

    if (isEnterKey(key)) {
      if (status !== SelectStatus.LOADED) return;

      if (
        !multiple ||
        (selectFocusedOnSubmit && refs.selections.current.length === 0)
      ) {
        actions.handleSelect(rl);
      }

      actions.submit(done);
      return;
    }

    // Backspace: 仅当输入为空时删除最后一项；否则由 readline 处理，下面用 rl.line 同步
    if (isBackspaceKey(key) && !filterInput) {
      setters.setFilterInput('');
      actions.removeLastSelection();
      return;
    }

    const isNavUp = enableFilter ? key.name === 'up' : isUpKey(key);
    const isNavDown = enableFilter ? key.name === 'down' : isDownKey(key);
    if (isNavUp || isNavDown) {
      const bounds = actions.getBounds();
      if (bounds.first < 0 || status !== SelectStatus.LOADED) return;

      if (
        loop ||
        (isNavUp && cursor !== bounds.first) ||
        (isNavDown && cursor !== bounds.last)
      ) {
        const offset = isNavUp ? -1 : 1;
        let next = cursor;
        do {
          next = (next + offset + displayItems.length) % displayItems.length;
        } while (!isSelectable(displayItems[next]));
        setters.setCursor(next);
      }
      return;
    }

    if (canToggleAll && multiple && isSelectAllKey(key)) {
      actions.toggleAll();
      return;
    }

    if (multiple && isTabKey(key)) {
      actions.handleSelect(rl);
      return;
    }

    // 过滤模式：用 readline 的 rl.line 同步，支持光标移动、退格等完整行编辑
    if (enableFilter && status !== SelectStatus.UNLOADED) {
      const line = typeof rl.line === 'string' ? rl.line : '';
      setters.setFilterInput(line);
      setters.setError('');
    }
  });
}

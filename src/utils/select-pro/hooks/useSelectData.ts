import { useEffect } from '@inquirer/core';
import { isSelectable } from '../utils';
import { debounce } from '../utils';
import type { InternalSelectItem, SelectOption } from '../types';
import { SelectStatus } from '../types';
import type { SelectRefs, SelectSetters } from './useSelectState';

export interface UseSelectDataConfig<Value> {
  options:
    | ReadonlyArray<InternalSelectItem<Value>>
    | ((
        input?: string,
      ) =>
        | Promise<ReadonlyArray<InternalSelectItem<Value>>>
        | ReadonlyArray<InternalSelectItem<Value>>);
  filter?: boolean;
  inputDelay?: number;
  multiple: boolean;
  equals: (a: Value, b: Value) => boolean;
}

export function useSelectData<Value>(
  config: UseSelectDataConfig<Value>,
  refs: SelectRefs<Value>,
  setters: SelectSetters<Value>,
  filterInput: string,
  status: SelectStatus,
  statusRef: { current: SelectStatus },
): { loadData: () => Promise<void> } {
  const { options, filter = true, inputDelay = 200, multiple, equals } = config;

  const enableFilter = Array.isArray(options) ? false : filter;
  statusRef.current = status;

  function handleItems(items: ReadonlyArray<InternalSelectItem<Value>>) {
    if (items.length <= 0) {
      setters.setDisplayItems([]);
      setters.setCursor(-1);
      return;
    }

    const ss = [...refs.selections.current];
    let firstChecked = -1;
    let firstSelectable = -1;

    const finalItems = items.map((item, index) => {
      const finalItem = { ...item };
      if (isSelectable(finalItem)) {
        if (firstSelectable < 0) {
          firstSelectable = index;
        }
        ss.forEach((op) => {
          if (equals(op.value, finalItem.value)) {
            (
              finalItem as InternalSelectItem<Value> & { checked: boolean }
            ).checked = true;
            op.name = finalItem.name;
            if (firstChecked < 0) {
              firstChecked = index;
            }
          }
        });
      }
      return finalItem;
    });

    setters.setDisplayItems(finalItems);
    refs.selections.current = ss;

    if (multiple) {
      setters.setCursor(firstSelectable);
    } else {
      setters.setCursor(firstChecked < 0 ? firstSelectable : firstChecked);
    }
  }

  async function loadData() {
    if (statusRef.current !== SelectStatus.UNLOADED) {
      setters.setStatus(SelectStatus.FILTERING);
    }
    setters.setError('');

    if (refs.loader.current) {
      await refs.loader.current;
    }

    try {
      const currentFilter = enableFilter ? refs.filterInput.current : '';
      const result =
        options instanceof Function
          ? enableFilter
            ? options(currentFilter)
            : (
                options as () =>
                  | Promise<ReadonlyArray<InternalSelectItem<Value>>>
                  | ReadonlyArray<InternalSelectItem<Value>>
              )()
          : options;

      const items = result instanceof Promise ? await result : result;
      handleItems(items);
      setters.setStatus(SelectStatus.LOADED);
    } catch (err) {
      setters.setError(err instanceof Error ? err.message : String(err));
      setters.setStatus(SelectStatus.LOADED);
    }
  }

  if (!refs.debouncedLoad.current) {
    refs.debouncedLoad.current = debounce(() => {
      loadData();
    }, inputDelay);
  }

  // 有过滤：随 filterInput 防抖加载
  useEffect(() => {
    if (enableFilter) {
      refs.debouncedLoad.current?.();
    }
  }, [filterInput]);

  // 无过滤：仅首次加载一次
  useEffect(() => {
    if (!enableFilter) {
      loadData();
    }
  }, [enableFilter]);

  return { loadData };
}

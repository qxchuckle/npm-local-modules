import type { InquirerReadline } from '@inquirer/core';
import { isSelectable, toggle, check } from '../utils';
import type { InternalSelectItem, SelectOption, SelectValue } from '../types';
import { SelectStatus } from '../types';
import type { SelectState, SelectRefs, SelectSetters } from './useSelectState';

export interface UseSelectActionsConfig<Value, Multiple extends boolean> {
  multiple: boolean;
  clearInputWhenSelected?: boolean;
  confirmDelete?: boolean;
  required?: boolean;
  selectFocusedOnSubmit?: boolean;
  equals: (a: Value, b: Value) => boolean;
  validate?: (
    options: ReadonlyArray<SelectOption<Value>>,
  ) => boolean | string | Promise<boolean | string>;
}

export interface SelectActions<Value, Multiple extends boolean> {
  getBounds: () => { first: number; last: number };
  handleSelect: (rl: InquirerReadline, clearInput?: boolean) => void;
  toggleAll: () => void;
  removeLastSelection: () => void;
  submit: (
    done: (value: SelectValue<Value, Multiple>) => void,
  ) => Promise<void>;
}

export function useSelectActions<Value, Multiple extends boolean>(
  config: UseSelectActionsConfig<Value, Multiple>,
  state: SelectState<Value>,
  refs: SelectRefs<Value>,
  setters: SelectSetters<Value>,
  enableFilter: boolean,
  transformSelectionsForSubmit: (
    sels: { value: Value; name?: string }[],
  ) => SelectValue<Value, Multiple>,
): SelectActions<Value, Multiple> {
  const { displayItems, cursor, focusedSelection } = state;
  const {
    multiple,
    clearInputWhenSelected = false,
    confirmDelete = false,
    required = false,
    selectFocusedOnSubmit = false,
    equals,
    validate = () => true,
  } = config;

  function getBounds(): { first: number; last: number } {
    const first = displayItems.findIndex(isSelectable);
    let last = -1;
    for (let i = displayItems.length - 1; i >= 0; i--) {
      if (isSelectable(displayItems[i])) {
        last = i;
        break;
      }
    }
    return { first, last };
  }

  function handleSelect(
    rl: InquirerReadline,
    clearInput = clearInputWhenSelected,
  ): void {
    if (cursor < 0 || displayItems.length <= 0) {
      if (enableFilter) {
        rl.clearLine(0);
        rl.write(state.filterInput);
      }
      return;
    }

    const targetOption = displayItems[cursor];
    if (isSelectable(targetOption)) {
      if (multiple) {
        const checked = (
          targetOption as InternalSelectItem<Value> & { checked?: boolean }
        ).checked;
        if (checked) {
          refs.selections.current = refs.selections.current.filter(
            (op) => !equals(targetOption.value, op.value),
          );
        } else {
          refs.selections.current = [
            ...refs.selections.current,
            { ...targetOption },
          ];
        }
      } else {
        refs.selections.current = [{ ...targetOption }];
      }

      setters.setDisplayItems(
        displayItems.map((item, i) => (i === cursor ? toggle(item) : item)),
      );

      if (
        enableFilter &&
        !(targetOption as InternalSelectItem<Value> & { checked?: boolean })
          .checked &&
        clearInput
      ) {
        setters.setFilterInput('');
        rl.clearLine(0);
      } else if (enableFilter) {
        rl.clearLine(0);
        rl.write(state.filterInput);
      }
    }
  }

  function toggleAll(): void {
    if (cursor < 0 || displayItems.length <= 0) {
      return;
    }

    const hasSelectAll = !displayItems.find(
      (item) =>
        isSelectable(item) &&
        !(item as InternalSelectItem<Value> & { checked?: boolean }).checked,
    );

    if (hasSelectAll) {
      refs.selections.current = [];
      setters.setDisplayItems(displayItems.map((item) => check(item, false)));
    } else {
      const newSelections: {
        value: Value;
        name?: string;
        focused?: boolean;
      }[] = [];
      displayItems.forEach((item) => {
        if (isSelectable(item)) {
          newSelections.push({ ...item });
        }
      });
      refs.selections.current = newSelections;
      setters.setDisplayItems(displayItems.map((item) => check(item, true)));
    }
  }

  function removeLastSelection(): void {
    if (refs.selections.current.length <= 0) return;

    const lastIndex = refs.selections.current.length - 1;
    const lastSelection = refs.selections.current[lastIndex];

    if (confirmDelete && focusedSelection < 0) {
      lastSelection.focused = true;
      setters.setFocusedSelection(lastIndex);
      return;
    }

    refs.selections.current = refs.selections.current.slice(0, lastIndex);
    setters.setFocusedSelection(-1);

    setters.setDisplayItems(
      displayItems.map((item) =>
        isSelectable(item) && equals(item.value, lastSelection.value)
          ? toggle(item)
          : item,
      ),
    );
  }

  async function submit(
    done: (value: SelectValue<Value, Multiple>) => void,
  ): Promise<void> {
    const isValid = await validate([...refs.selections.current]);

    if (required && refs.selections.current.length <= 0) {
      setters.setError('At least one option must be selected');
      return;
    }

    if (isValid === true) {
      setters.setStatus(SelectStatus.SUBMITTED);
      done(transformSelectionsForSubmit(refs.selections.current));
    } else {
      setters.setError(
        typeof isValid === 'string' ? isValid : 'You must select a valid value',
      );
    }
  }

  return {
    getBounds,
    handleSelect,
    toggleAll,
    removeLastSelection,
    submit,
  };
}

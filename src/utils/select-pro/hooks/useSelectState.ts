import { useState, useRef } from '@inquirer/core';
import { value2Name } from '../utils';
import { mergeTheme } from '../theme';
import type {
  InternalSelectItem,
  SelectOption,
  SelectTheme,
  SelectValue,
  SelectedOption,
} from '../types';
import { SelectStatus } from '../types';

export interface UseSelectStateConfig<Value, Multiple extends boolean> {
  options: unknown;
  filter?: boolean;
  defaultValue?: SelectValue<Value, Multiple>;
  multiple: boolean;
  theme?: Partial<SelectTheme>;
}

export interface SelectState<Value> {
  status: SelectStatus;
  displayItems: ReadonlyArray<InternalSelectItem<Value>>;
  cursor: number;
  filterInput: string;
  error: string;
  focusedSelection: number;
}

export interface SelectRefs<Value> {
  selections: { current: SelectedOption<Value>[] };
  loader: { current: Promise<void> | null };
  debouncedLoad: { current: (() => void) | null };
  filterInput: { current: string };
}

export interface SelectSetters<Value> {
  setStatus: (s: SelectStatus) => void;
  setDisplayItems: (items: ReadonlyArray<InternalSelectItem<Value>>) => void;
  setCursor: (c: number) => void;
  setFilterInput: (s: string) => void;
  setError: (s: string) => void;
  setFocusedSelection: (n: number) => void;
}

function transformDefaultValue<Value, Multiple extends boolean>(
  values: SelectValue<Value, Multiple> | undefined,
  isMultiple: boolean,
): SelectedOption<Value>[] {
  if (!values) return [];
  if (isMultiple) {
    if (!Array.isArray(values)) {
      return [];
    }
    return values.map((value) => ({
      name: value2Name(value),
      value,
      focused: false,
    }));
  }
  return [
    {
      name: value2Name(values),
      value: values as Value,
    },
  ];
}

export function transformSelections<Value, Multiple extends boolean>(
  sels: SelectOption<Value>[],
  isMultiple: boolean,
): SelectValue<Value, Multiple> {
  if (isMultiple) {
    return sels.map((s) => s.value) as SelectValue<Value, Multiple>;
  }
  return (sels.length > 0 ? sels[0].value : null) as SelectValue<
    Value,
    Multiple
  >;
}

export function useSelectState<Value, Multiple extends boolean>(
  config: UseSelectStateConfig<Value, Multiple>,
): {
  state: SelectState<Value>;
  refs: SelectRefs<Value>;
  setters: SelectSetters<Value>;
  theme: SelectTheme;
  transformSelectionsForSubmit: (
    sels: SelectedOption<Value>[],
  ) => SelectValue<Value, Multiple>;
} {
  const {
    options,
    filter = true,
    defaultValue,
    multiple,
    theme: userTheme,
  } = config;

  const [status, setStatus] = useState<SelectStatus>(SelectStatus.UNLOADED);
  const [displayItems, setDisplayItems] = useState<
    ReadonlyArray<InternalSelectItem<Value>>
  >([]);
  const [cursor, setCursor] = useState(-1);
  const [filterInput, setFilterInput] = useState('');
  const [error, setError] = useState('');
  const [focusedSelection, setFocusedSelection] = useState(-1);

  const selectionsRef = useRef<SelectedOption<Value>[]>(
    transformDefaultValue(defaultValue, multiple),
  );
  const loaderRef = useRef<Promise<void> | null>(null);
  const debouncedLoadDataRef = useRef<(() => void) | null>(null);
  const filterInputRef = useRef(filterInput);
  filterInputRef.current = filterInput;

  const theme = mergeTheme(multiple, userTheme);

  const state: SelectState<Value> = {
    status,
    displayItems,
    cursor,
    filterInput,
    error,
    focusedSelection,
  };

  const refs: SelectRefs<Value> = {
    selections: selectionsRef,
    loader: loaderRef,
    debouncedLoad: debouncedLoadDataRef,
    filterInput: filterInputRef,
  };

  const setters: SelectSetters<Value> = {
    setStatus,
    setDisplayItems,
    setCursor,
    setFilterInput,
    setError,
    setFocusedSelection,
  };

  const transformSelectionsForSubmit = (
    sels: SelectedOption<Value>[],
  ): SelectValue<Value, Multiple> =>
    transformSelections(
      sels.map((s) => ({ name: s.name, value: s.value })),
      multiple,
    );

  return {
    state,
    refs,
    setters,
    theme,
    transformSelectionsForSubmit,
  };
}

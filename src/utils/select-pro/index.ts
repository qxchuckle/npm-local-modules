import { createPrompt, useRef } from '@inquirer/core';
import chalk from 'chalk';
import { t } from '../i18n';
import type { SelectProps, SelectTheme, SelectValue } from './types';
import { SelectStatus } from './types';
import { mergeTheme } from './theme';
import { ansiEscapes } from './utils';
import {
  useSelectState,
  useSelectData,
  useSelectActions,
  useSelectKeypress,
} from './hooks';
import {
  renderPage,
  renderSelectedOptions,
  renderHelp,
  renderInput,
} from './render';
import type { RenderConfig } from './render';

/** 内部配置类型（含 message） */
interface InternalConfig<Value, Multiple extends boolean> extends SelectProps<
  Value,
  Multiple
> {
  message: string;
}

/** createPrompt 要求的 view 参数类型（可返回两段式 [顶部, 底部]） */
type CreatePromptView = (
  config: import('@inquirer/core').AsyncPromptConfig &
    import('@inquirer/core').ResolvedPromptConfig,
  done: (value: SelectValue<unknown, boolean>) => void,
) => string | [string, string];

/**
 * 交互式选择组件 - 基于 @inquirer/core v1
 * 逻辑已拆分为 hooks，便于阅读与维护
 */
export const select = createPrompt((<Value, Multiple extends boolean = true>(
  config: InternalConfig<Value, Multiple>,
  done: (value: SelectValue<Value, Multiple>) => void,
): string | [string, string] => {
  const {
    message,
    options,
    filter = true,
    clearInputWhenSelected = false,
    confirmDelete = false,
    canToggleAll = false,
    inputDelay = 200,
    loop = false,
    equals = (a: Value, b: Value) => a === b,
    defaultValue,
    required = false,
    multiple = true as Multiple,
    selectFocusedOnSubmit = false,
    validate = () => true,
    pageSize = 10,
    emptyText = t('selectProEmptyText'),
    placeholder = t('selectProPlaceholder'),
    theme: userTheme,
  } = config;

  const enableFilter = Array.isArray(options) ? false : filter;

  // 状态与 refs
  const { state, refs, setters, theme, transformSelectionsForSubmit } =
    useSelectState<Value, Multiple>({
      options,
      filter,
      defaultValue,
      multiple,
      theme: userTheme,
    });

  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  // 数据加载（防抖 + 初始/过滤触发）
  useSelectData<Value>(
    {
      options,
      filter,
      inputDelay,
      multiple,
      equals,
    },
    refs,
    setters,
    state.filterInput,
    state.status,
    statusRef,
  );

  // 选择相关操作
  const actions = useSelectActions<Value, Multiple>(
    {
      multiple,
      clearInputWhenSelected,
      confirmDelete,
      required,
      selectFocusedOnSubmit,
      equals,
      validate,
    },
    state,
    refs,
    setters,
    enableFilter,
    transformSelectionsForSubmit,
  );

  // 按键处理
  useSelectKeypress<Value, Multiple>(
    {
      multiple,
      enableFilter,
      canToggleAll,
      selectFocusedOnSubmit,
      loop,
    },
    state,
    refs,
    setters,
    actions,
    done,
  );

  // 渲染
  const renderConfig: RenderConfig = {
    pageSize,
    emptyText,
    placeholder,
    confirmDelete,
    enableFilter,
    multiple,
    canToggleAll,
  };

  const isLoading =
    state.status === SelectStatus.UNLOADED ||
    state.status === SelectStatus.FILTERING;
  const prefix = isLoading ? chalk.yellow('?') : chalk.green('?');
  const msg = chalk.bold(message);
  const answer = theme.style.selected(renderSelectedOptions(refs));

  if (state.status === SelectStatus.SUBMITTED) {
    return `${prefix} ${msg} ${answer}`;
  }

  const page = renderPage(state, theme, emptyText, pageSize);
  const help = renderHelp(state, theme, renderConfig);
  const errorLine = state.error ? `\n${theme.style.error(state.error)}` : '';

  const input = enableFilter
    ? renderInput(state, theme, placeholder, confirmDelete, answer)
    : ` ${answer}${ansiEscapes.cursorHide}`;

  // 两段式输出：顶部为 message + 输入行，底部为列表，便于 readline 与光标处理
  return [
    `${prefix} ${msg}${help.top}${input}`,
    `${page}${help.bottom}${errorLine}`,
  ];
}) as unknown as CreatePromptView) as <
  Value = string,
  Multiple extends boolean = true,
>(
  config: SelectProps<Value, Multiple>,
) => Promise<SelectValue<Value, Multiple>>;

export { Separator } from '@inquirer/core';
export type {
  SelectOption,
  SelectProps,
  SelectTheme,
  SelectValue,
  SelectItem,
} from './types';

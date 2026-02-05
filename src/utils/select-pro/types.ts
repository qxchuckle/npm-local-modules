import type { Separator } from '@inquirer/core';

/**
 * 选项定义
 */
export interface SelectOption<Value = string> {
  name?: string;
  value: Value;
  disabled?: boolean | string;
}

/**
 * 内部选项（带选中状态）
 */
export interface InternalSelectOption<
  Value = string,
> extends SelectOption<Value> {
  checked?: boolean;
}

/**
 * 已选中的选项
 */
export interface SelectedOption<Value = string> extends SelectOption<Value> {
  focused?: boolean;
}

/**
 * 选择状态
 */
export enum SelectStatus {
  UNLOADED = 'unloaded',
  FILTERING = 'filtering',
  LOADED = 'loaded',
  SUBMITTED = 'submitted',
}

/**
 * 选择项类型
 */
export type SelectItem<Value = string> = Separator | SelectOption<Value>;

/**
 * 内部选择项类型
 */
export type InternalSelectItem<Value = string> =
  | Separator
  | InternalSelectOption<Value>;

/**
 * 选择值类型
 */
export type SelectValue<Value, Multiple extends boolean> = Multiple extends true
  ? Value[]
  : Value | null;

/**
 * 过滤选项函数
 */
export type SelectFilterOptions<Value = string> = (
  input?: string,
) =>
  | Promise<ReadonlyArray<SelectItem<Value>>>
  | ReadonlyArray<SelectItem<Value>>;

/**
 * 选择配置
 */
export interface SelectProps<Value = string, Multiple extends boolean = true> {
  /**
   * 提示消息
   */
  message: string;

  /**
   * 选项列表或异步获取函数
   */
  options: ReadonlyArray<SelectItem<Value>> | SelectFilterOptions<Value>;

  /**
   * 是否启用过滤功能
   * @default true
   */
  filter?: boolean;

  /**
   * 选中后是否清空输入
   * @default false
   */
  clearInputWhenSelected?: boolean;

  /**
   * 删除时是否需要确认
   * @default false
   */
  confirmDelete?: boolean;

  /**
   * 是否允许全选切换
   * @default false
   */
  canToggleAll?: boolean;

  /**
   * 输入防抖延迟（毫秒）
   * @default 200
   */
  inputDelay?: number;

  /**
   * 是否循环显示选项
   * @default false
   */
  loop?: boolean;

  /**
   * 判断两个选项是否相等
   * @default (a, b) => a === b
   */
  equals?: (a: Value, b: Value) => boolean;

  /**
   * 默认选中的值
   */
  defaultValue?: SelectValue<Value, Multiple>;

  /**
   * 是否必选
   * @default false
   */
  required?: boolean;

  /**
   * 是否多选
   * @default true
   */
  multiple?: Multiple;

  /**
   * 提交时是否选中当前聚焦项
   * @default false
   */
  selectFocusedOnSubmit?: boolean;

  /**
   * 验证函数
   * @default () => true
   */
  validate?: (
    options: ReadonlyArray<SelectOption<Value>>,
  ) => boolean | string | Promise<boolean | string>;

  /**
   * 每页显示数量
   * @default 10
   */
  pageSize?: number;

  /**
   * 空结果提示文本
   * @default "No results."
   */
  emptyText?: string;

  /**
   * 输入框占位符
   * @default "Type to search"
   */
  placeholder?: string;

  /**
   * 主题配置
   */
  theme?: Partial<SelectTheme>;
}

/**
 * 主题配置
 */
export interface SelectTheme {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
    inputCursor: string;
  };
  style: {
    highlight: (text: string) => string;
    disabled: (text: string) => string;
    selected: (text: string) => string;
    placeholder: (text: string) => string;
    error: (text: string) => string;
    help: (text: string) => string;
    emptyText: (text: string) => string;
  };
}

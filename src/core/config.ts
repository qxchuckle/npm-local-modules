import { NlmConfig } from '../types';
import { getConfigPath, getProjectNlmDir } from '../constants';
import {
  readJsonSync,
  writeJsonSync,
  ensureDirSync,
  pathExistsSync,
} from '../utils/file';
import logger from '@/utils/logger';

/**
 * 默认配置
 */
const defaultConfig: NlmConfig = {
  packageManager: 'npm',
};

/**
 * 初始化配置文件（如果不存在）
 */
export const initConfigIfNotExists = (workingDir: string): void => {
  const configPath = getConfigPath(workingDir);
  if (!pathExistsSync(configPath)) {
    ensureDirSync(getProjectNlmDir(workingDir));
    writeJsonSync(configPath, {});
  }
};

/**
 * 读取项目配置
 */
export const readConfig = (workingDir: string): NlmConfig => {
  initConfigIfNotExists(workingDir);
  const configPath = getConfigPath(workingDir);
  const config = readJsonSync<NlmConfig>(configPath);
  logger.debug(`读取项目配置: ${logger.path(configPath)}`);
  logger.debug(`读取项目配置内容: ${JSON.stringify(config)}`);
  const result = { ...defaultConfig, ...config };
  logger.debug(`配置合并结果: ${JSON.stringify(result)}`);
  return result;
};

/**
 * 写入项目配置
 */
export const writeConfig = (workingDir: string, config: NlmConfig): void => {
  ensureDirSync(getProjectNlmDir(workingDir));
  const configPath = getConfigPath(workingDir);
  writeJsonSync(configPath, config);
};

/**
 * 检查配置文件是否存在
 */
export const configExists = (workingDir: string): boolean => {
  const configPath = getConfigPath(workingDir);
  return pathExistsSync(configPath);
};

/**
 * 获取配置的包管理器
 */
export const getConfiguredPackageManager = (
  workingDir: string,
): 'npm' | 'yarn' | 'pnpm' => {
  const config = readConfig(workingDir);
  return config.packageManager || 'npm';
};

/**
 * 更新配置
 */
export const updateConfig = (
  workingDir: string,
  updates: Partial<NlmConfig>,
): void => {
  const config = readConfig(workingDir);
  const newConfig = { ...config, ...updates };
  writeConfig(workingDir, newConfig);
};

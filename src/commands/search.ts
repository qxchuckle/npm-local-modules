import chalk from 'chalk';
import {
  getAllPackagesInStore,
  getPackageVersionsInStore,
  readStoreConfig,
} from '../core/store';
import logger from '../utils/logger';
import { t } from '../utils/i18n';

/**
 * 执行 search 命令
 * @param keyword 搜索关键词
 */
export const search = async (keyword: string): Promise<void> => {
  const allPackages = getAllPackagesInStore();

  if (allPackages.length === 0) {
    logger.info(t('searchStoreEmpty'));
    return;
  }

  // 模糊匹配包名
  const matchedPackages = keyword
    ? allPackages.filter((name) =>
        name.toLowerCase().includes(keyword.toLowerCase()),
      )
    : allPackages;

  if (matchedPackages.length === 0) {
    logger.info(t('searchNoMatch', { keyword }));
    return;
  }

  const storeConfig = readStoreConfig();

  logger.log(t('searchResults', { count: matchedPackages.length, keyword }));
  console.log();

  for (const name of matchedPackages) {
    const versions = getPackageVersionsInStore(name);
    const entry = storeConfig[name];

    // 高亮匹配的关键词
    const highlightedName = keyword
      ? name.replace(
          new RegExp(`(${escapeRegExp(keyword)})`, 'gi'),
          chalk.yellow('$1'),
        )
      : name;

    console.log(chalk.cyan.bold(highlightedName));
    console.log(
      `  ${chalk.gray(t('searchVersions'))} ${logger.version(versions.join(', '))}`,
    );

    // 源路径信息
    console.log(
      `  ${chalk.gray(t('searchSourcePath'))} ${logger.path(entry?.target ?? '-')}`,
    );

    // 使用项目列表
    if (entry?.usedBy && entry.usedBy.length > 0) {
      console.log(
        `  ${chalk.gray(t('searchUsedBy'))} ${chalk.yellow(t('searchUsedByCount', { count: entry.usedBy.length }))}`,
      );
      for (const project of entry.usedBy) {
        console.log(`    ${logger.path(project)}`);
      }
    } else {
      console.log(`  ${chalk.gray(t('searchUsedBy'))} ${chalk.gray('-')}`);
    }

    console.log();
  }

  logger.log(t('searchTotal', { count: matchedPackages.length }));
};

/**
 * 转义正则表达式特殊字符
 */
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default search;

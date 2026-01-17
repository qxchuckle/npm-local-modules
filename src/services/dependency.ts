import { spawn, execSync } from 'child_process';
import { join } from 'path';
import { DependencyConflict, Dependencies, PackageManifest } from '../types';
import { readPackageManifest } from '../utils/package';
import { isSameMajorVersion } from '../utils/version';
import { getConfiguredPackageManager } from '../core/config';
import { ensureDirSync, pathExistsSync } from '../utils/file';
import { getProjectNlmDir } from '../constants';
import logger from '../utils/logger';

/**
 * 检测依赖冲突
 * 比较 nlm 包的依赖和项目的依赖，找出版本不兼容的依赖
 */
export const detectDependencyConflicts = (
  nlmPkg: PackageManifest,
  projectPkg: PackageManifest,
): DependencyConflict[] => {
  const conflicts: DependencyConflict[] = [];

  const nlmDeps: Dependencies = {
    ...nlmPkg.dependencies,
    ...nlmPkg.peerDependencies,
  };

  const projectDeps: Dependencies = {
    ...projectPkg.dependencies,
    ...projectPkg.devDependencies,
  };

  for (const [name, requiredVersion] of Object.entries(nlmDeps)) {
    const installedVersion = projectDeps[name];

    if (!installedVersion) {
      // 项目中没有安装此依赖，可能需要警告
      continue;
    }

    // 检查主版本号是否相同
    if (!isSameMajorVersion(requiredVersion, installedVersion)) {
      conflicts.push({
        name,
        requiredVersion,
        installedVersion,
      });
    }
  }

  return conflicts;
};

/**
 * 处理依赖冲突
 * 在 .nlm/包名/node_modules 中安装冲突版本的依赖
 */
export const handleDependencyConflicts = async (
  packageName: string,
  conflicts: DependencyConflict[],
  workingDir: string,
): Promise<void> => {
  if (conflicts.length === 0) {
    return;
  }

  logger.warn(`检测到 ${conflicts.length} 个依赖冲突:`);
  conflicts.forEach((conflict) => {
    logger.log(
      `  - ${logger.pkg(conflict.name)}: ` +
        `需要 ${logger.version(conflict.requiredVersion)}, ` +
        `项目中是 ${logger.version(conflict.installedVersion)}`,
    );
  });

  // 创建冲突依赖安装目录
  const conflictDir = join(
    getProjectNlmDir(workingDir),
    packageName,
    'node_modules',
  );
  ensureDirSync(conflictDir);

  // 获取配置的包管理器
  const pm = getConfiguredPackageManager(workingDir);

  // 收集所有需要安装的依赖
  const depSpecs = conflicts.map(
    (conflict) => `${conflict.name}@${conflict.requiredVersion}`,
  );

  logger.info(`安装冲突依赖: ${depSpecs.join(', ')}`);

  try {
    await runInstallCommand(pm, depSpecs, conflictDir);
  } catch (error) {
    logger.error(`安装冲突依赖失败`);
    throw error;
  }
};

/**
 * 执行安装命令并等待完成
 */
const runInstallCommand = (
  pm: 'npm' | 'yarn' | 'pnpm' | string,
  packageSpecs: string[],
  cwd: string,
): Promise<void> => {
  const { cmd, args } = getInstallCommand(pm, packageSpecs);
  const command = `${cmd} ${args.join(' ')}`;
  logger.debug(`执行安装命令: ${logger.cmd(command)}`);
  execSync(command, {
    cwd,
    stdio: 'inherit',
    encoding: 'utf-8',
  });
  return Promise.resolve();
  // return new Promise((resolve, reject) => {
  //   const child = spawn(cmd, args, {
  //     cwd,
  //     stdio: 'inherit',
  //     shell: true,
  //   });

  //   child.on('close', (code) => {
  //     if (code === 0) {
  //       resolve();
  //     } else {
  //       reject(new Error(`Command exited with code ${code}`));
  //     }
  //   });

  //   child.on('error', (err) => {
  //     reject(err);
  //   });
  // });
};

/**
 * 获取包管理器的安装命令
 * 添加 --legacy-peer-deps 等标志跳过 peer dependency 检查
 */
const getInstallCommand = (
  pm: 'npm' | 'yarn' | 'pnpm' | string,
  packageSpecs: string[],
): { cmd: string; args: string[] } => {
  return {
    cmd: pm,
    args: ['install', ...packageSpecs, '--legacy-peer-deps'],
  };
};

/**
 * 检查项目中是否存在 nlm 包需要的依赖
 */
export const checkMissingDependencies = (
  nlmPkg: PackageManifest,
  projectPkg: PackageManifest,
): string[] => {
  const missing: string[] = [];

  const nlmDeps: Dependencies = {
    ...nlmPkg.dependencies,
    ...nlmPkg.peerDependencies,
  };

  const projectDeps: Dependencies = {
    ...projectPkg.dependencies,
    ...projectPkg.devDependencies,
  };

  for (const name of Object.keys(nlmDeps)) {
    if (!projectDeps[name]) {
      missing.push(name);
    }
  }

  return missing;
};

/**
 * 获取包在 node_modules 中的 package.json
 */
export const getInstalledPackageManifest = (
  workingDir: string,
  packageName: string,
): PackageManifest | null => {
  const pkgPath = join(workingDir, 'node_modules', packageName);
  if (!pathExistsSync(pkgPath)) {
    return null;
  }
  return readPackageManifest(pkgPath);
};

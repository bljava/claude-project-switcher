import fs from 'fs/promises';
import path from 'path';

export async function pathExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export function normalizePath(dirPath: string): string {
  return path.resolve(dirPath);
}

export function expandTilde(dirPath: string): string {
  if (dirPath.startsWith('~/') || dirPath === '~') {
    return dirPath.replace('~', process.env.HOME || '');
  }
  return dirPath;
}

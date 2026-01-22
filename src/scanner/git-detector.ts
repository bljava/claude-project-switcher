import fs from 'fs/promises';
import path from 'path';

export interface GitInfo {
  root: string;
  remote?: string;
  branch?: string;
}

export class GitDetector {
  async isGitRepo(dirPath: string): Promise<boolean> {
    try {
      const gitPath = path.join(dirPath, '.git');
      const stat = await fs.stat(gitPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    const root = path.parse(currentPath).root;

    while (currentPath !== root && currentPath !== path.join(root, '..')) {
      if (await this.isGitRepo(currentPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return null;
  }

  async getGitRemote(dirPath: string): Promise<string | undefined> {
    try {
      const configPath = path.join(dirPath, '.git', 'config');
      const content = await fs.readFile(configPath, 'utf-8');

      const urlMatch = content.match(/url\s*=\s*(.+)/);
      if (urlMatch) {
        return urlMatch[1].trim();
      }
    } catch {
      // Ignore errors reading git config
    }
    return undefined;
  }

  async detect(dirPath: string): Promise<GitInfo | null> {
    const root = await this.findGitRoot(dirPath);
    if (!root) return null;

    const remote = await this.getGitRemote(root);

    return { root, remote };
  }
}

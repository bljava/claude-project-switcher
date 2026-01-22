import fs from 'fs/promises';
import path from 'path';
import { Project } from '../types';
import { GitDetector } from './git-detector';
import { createId } from '../utils/id';

export interface ScanOptions {
  includeHidden?: boolean;
  maxDepth?: number;
  followSymlinks?: boolean;
}

export class ProjectScanner {
  private gitDetector: GitDetector;

  constructor() {
    this.gitDetector = new GitDetector();
  }

  async scanCurrentDirectory(): Promise<Project | null> {
    const cwd = process.cwd();
    const gitInfo = await this.gitDetector.detect(cwd);

    if (!gitInfo) {
      return null;
    }

    const dirName = path.basename(gitInfo.root);

    return {
      id: createId(gitInfo.root),
      name: dirName,
      path: gitInfo.root,
      description: '',
      tags: [],
      group: undefined,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      metadata: {
        gitRemote: gitInfo.remote
      }
    };
  }

  async scanDirectory(dirPath: string, options: ScanOptions = {}): Promise<Project[]> {
    const projects: Project[] = [];
    const maxDepth = options.maxDepth ?? 2;

    await this.scanRecursive(dirPath, projects, 0, maxDepth, options);

    return projects;
  }

  private async scanRecursive(
    dirPath: string,
    projects: Project[],
    currentDepth: number,
    maxDepth: number,
    options: ScanOptions
  ): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden directories unless explicitly included
        if (!options.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Check if this is a git repo
          const gitInfo = await this.gitDetector.detect(fullPath);
          if (gitInfo) {
            projects.push({
              id: createId(gitInfo.root),
              name: entry.name,
              path: gitInfo.root,
              description: '',
              tags: [],
              group: undefined,
              createdAt: Date.now(),
              lastAccessed: Date.now(),
              accessCount: 0,
              metadata: {
                gitRemote: gitInfo.remote
              }
            });
          } else {
            // Recursively scan subdirectories
            await this.scanRecursive(fullPath, projects, currentDepth + 1, maxDepth, options);
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }
}

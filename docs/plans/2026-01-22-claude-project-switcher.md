# Claude Project Switcher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fast, interactive CLI tool for switching between development projects in Claude Code, featuring fuzzy search, project history, and intelligent recommendations.

**Architecture:**
- TypeScript CLI tool using `commander.js` for command parsing
- `fzf` integration for interactive fuzzy selection
- Local JSON file storage for project configuration and metadata
- Shell integration (zsh/bash) for quick access commands

**Tech Stack:**
- TypeScript 5.x + Node.js 20+
- commander.js (CLI framework)
- chalk (terminal colors)
- fzf (fuzzy finder - shell dependency)
- ora (loading spinners)

---

## Part 1: Project Setup and Foundation

### Task 1: Initialize TypeScript Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "claude-project-switcher",
  "version": "0.1.0",
  "description": "Fast project switching for Claude Code",
  "main": "dist/index.js",
  "bin": {
    "cps": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli.ts",
    "test": "jest"
  },
  "keywords": ["claude", "project", "switcher", "cli"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "@jest/globals": "^29.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
coverage/
.env
config.json
projects.json
```

**Step 4: Create basic src/index.ts**

```typescript
export const VERSION = '0.1.0';
export const CONFIG_DIR = '.claude-project-switcher';
export const CONFIG_FILE = 'config.json';
export const PROJECTS_FILE = 'projects.json';
```

**Step 5: Initialize npm and install dependencies**

Run:
```bash
npm install
```

Expected: All dependencies installed successfully

**Step 6: Initialize git repository**

Run:
```bash
git add .
git commit -m "feat: initialize TypeScript project with basic configuration"
```

---

## Part 2: Configuration and Data Models

### Task 2: Define Data Models and Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/config/manager.ts`

**Step 1: Create type definitions**

Create `src/types/index.ts`:

```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  tags: string[];
  group?: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  metadata?: {
    language?: string;
    framework?: string;
    gitRemote?: string;
  };
}

export interface ProjectConfig {
  version: string;
  projects: Project[];
  groups: Record<string, string[]>;
  settings: {
    maxHistorySize: number;
    autoDetectGit: boolean;
    defaultGroup?: string;
  };
}

export interface SwitchOptions {
  fuzzy?: boolean;
  group?: string;
  tag?: string;
  recent?: boolean;
}
```

**Step 2: Create configuration manager**

Create `src/config/manager.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ProjectConfig, Project } from '../types';
import { CONFIG_DIR, PROJECTS_FILE } from '../index';

const HOME_DIR = os.homedir();
const CONFIG_PATH = path.join(HOME_DIR, CONFIG_DIR, PROJECTS_FILE);

const DEFAULT_CONFIG: ProjectConfig = {
  version: '0.1.0',
  projects: [],
  groups: {},
  settings: {
    maxHistorySize: 50,
    autoDetectGit: true
  }
};

export class ConfigManager {
  private configPath: string;
  private config: ProjectConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || CONFIG_PATH;
  }

  async load(): Promise<ProjectConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(content) as ProjectConfig;
      return this.config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.config = { ...DEFAULT_CONFIG };
        await this.save();
        return this.config;
      }
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  getProjects(): Project[] {
    return this.config?.projects || [];
  }

  async addProject(project: Project): Promise<void> {
    if (!this.config) await this.load();
    if (!this.config) throw new Error('Failed to load config');

    const existingIndex = this.config.projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      this.config.projects[existingIndex] = project;
    } else {
      this.config.projects.push(project);
    }
    await this.save();
  }

  async updateProjectAccess(id: string): Promise<void> {
    if (!this.config) await this.load();
    if (!this.config) throw new Error('Failed to load config');

    const project = this.config.projects.find(p => p.id === id);
    if (project) {
      project.lastAccessed = Date.now();
      project.accessCount++;
      await this.save();
    }
  }

  getRecentProjects(limit: number = 10): Project[] {
    const projects = this.getProjects();
    return projects
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, limit);
  }
}
```

**Step 3: Run tests to verify setup**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 4: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add data types and configuration manager"
```

---

## Part 3: Core Functionality - Project Management

### Task 3: Project Scanner and Auto-Detection

**Files:**
- Create: `src/scanner/index.ts`
- Create: `src/scanner/git-detector.ts`

**Step 1: Create Git detector**

Create `src/scanner/git-detector.ts`:

```typescript
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
```

**Step 2: Create project scanner**

Create `src/scanner/index.ts`:

```typescript
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
```

**Step 3: Create utility function for ID generation**

Create `src/utils/id.ts`:

```typescript
import crypto from 'crypto';

export function createId(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}
```

**Step 4: Create utility function for path validation**

Create `src/utils/path.ts`:

```typescript
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
```

**Step 5: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 6: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add project scanner with Git auto-detection"
```

---

### Task 4: Project Manager Service

**Files:**
- Create: `src/services/project-manager.ts`

**Step 1: Create project manager service**

Create `src/services/project-manager.ts`:

```typescript
import { ConfigManager } from '../config/manager';
import { ProjectScanner } from '../scanner';
import { Project } from '../types';
import { pathExists, normalizePath, expandTilde } from '../utils/path';

export class ProjectManager {
  private config: ConfigManager;
  private scanner: ProjectScanner;

  constructor(config?: ConfigManager) {
    this.config = config || new ConfigManager();
    this.scanner = new ProjectScanner();
  }

  async addCurrentProject(options: { name?: string; description?: string; tags?: string[]; group?: string } = {}): Promise<Project> {
    const project = await this.scanner.scanCurrentDirectory();

    if (!project) {
      throw new Error('Current directory is not a valid project (no .git folder found)');
    }

    // Apply overrides
    if (options.name) project.name = options.name;
    if (options.description) project.description = options.description;
    if (options.tags) project.tags = options.tags;
    if (options.group) project.group = options.group;

    await this.config.addProject(project);

    return project;
  }

  async addProjectByPath(projectPath: string, options: { name?: string; description?: string; tags?: string[]; group?: string } = {}): Promise<Project> {
    const expandedPath = expandTilde(projectPath);
    const normalizedPath = normalizePath(expandedPath);

    if (!(await pathExists(normalizedPath))) {
      throw new Error(`Directory does not exist: ${projectPath}`);
    }

    // Change to target directory temporarily for scanning
    const originalCwd = process.cwd();
    process.chdir(normalizedPath);

    try {
      const project = await this.scanner.scanCurrentDirectory();

      if (!project) {
        throw new Error('Directory is not a valid project (no .git folder found)');
      }

      // Apply overrides
      if (options.name) project.name = options.name;
      if (options.description) project.description = options.description;
      if (options.tags) project.tags = options.tags;
      if (options.group) project.group = options.group;

      await this.config.addProject(project);

      return project;
    } finally {
      process.chdir(originalCwd);
    }
  }

  async getAllProjects(): Promise<Project[]> {
    await this.config.load();
    return this.config.getProjects();
  }

  async getRecentProjects(limit: number = 10): Promise<Project[]> {
    await this.config.load();
    return this.config.getRecentProjects(limit);
  }

  async removeProject(projectId: string): Promise<boolean> {
    await this.config.load();
    const projects = this.config.getProjects();
    const filtered = projects.filter(p => p.id !== projectId);

    if (filtered.length === projects.length) {
      return false; // No project was removed
    }

    this.config.config!.projects = filtered;
    await this.config.save();
    return true;
  }

  async findProjectByName(name: string): Promise<Project | undefined> {
    const projects = await this.getAllProjects();
    return projects.find(p => p.name === name || p.name.includes(name));
  }

  async recordAccess(projectId: string): Promise<void> {
    await this.config.updateProjectAccess(projectId);
  }

  async getProjectPath(projectId: string): Promise<string | undefined> {
    const projects = await this.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    return project?.path;
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add project manager service"
```

---

*Continue to Part 4: CLI Commands...*

## Part 4: CLI Commands

### Task 5: Base CLI Framework

**Files:**
- Create: `src/cli.ts`
- Create: `src/commands/index.ts`

**Step 1: Create main CLI entry point**

Create `src/cli.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from './index';

const program = new Command();

program
  .name('cps')
  .description('Claude Project Switcher - Fast project navigation')
  .version(VERSION);

// Add commands
program.command('add [path]')
  .description('Add a project to the switcher')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-g, --group <group>', 'Project group')
  .action(async (path, options) => {
    const { addCommand } = await import('./commands/add');
    await addCommand(path, options);
  });

program.command('list')
  .description('List all projects')
  .option('-r, --recent', 'Show recently accessed projects')
  .option('-g, --group <group>', 'Filter by group')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action(async (options) => {
    const { listCommand } = await import('./commands/list');
    await listCommand(options);
  });

program.command('switch [name]')
  .alias('s')
  .description('Switch to a project')
  .option('-f, --fzf', 'Use fzf for interactive selection')
  .option('-r, --recent', 'Show recent projects only')
  .action(async (name, options) => {
    const { switchCommand } = await import('./commands/switch');
    await switchCommand(name, options);
  });

program.command('remove <name>')
  .alias('rm')
  .description('Remove a project')
  .action(async (name) => {
    const { removeCommand } = await import('./commands/remove');
    await removeCommand(name);
  });

program.command('scan [path]')
  .description('Scan directory for projects')
  .option('-d, --depth <number>', 'Max scan depth', '2')
  .option('-a, --add', 'Auto-add found projects')
  .action(async (scanPath, options) => {
    const { scanCommand } = await import('./commands/scan');
    await scanCommand(scanPath, options);
  });

program.parse();
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add CLI framework with command structure"
```

---

### Task 6: Add Command Implementation

**Files:**
- Create: `src/commands/add.ts`

**Step 1: Create add command**

Create `src/commands/add.ts`:

```typescript
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { ProjectManager } from '../services/project-manager';

export async function addCommand(
  projectPath: string | undefined,
  options: {
    name?: string;
    description?: string;
    tags?: string;
    group?: string;
  }
): Promise<void> {
  const spinner: Ora = ora({ color: 'cyan' });
  const manager = new ProjectManager();

  try {
    // Parse tags
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];

    if (projectPath) {
      // Add project by path
      spinner.start(`Adding project from: ${chalk.cyan(projectPath)}`);

      const project = await manager.addProjectByPath(projectPath, {
        name: options.name,
        description: options.description,
        tags,
        group: options.group
      });

      spinner.succeed(`Added project: ${chalk.green(project.name)}`);
      console.log(`  Path: ${chalk.dim(project.path)}`);
      if (project.description) {
        console.log(`  Description: ${chalk.dim(project.description)}`);
      }
      if (tags.length > 0) {
        console.log(`  Tags: ${chalk.yellow(tags.join(', '))}`);
      }
    } else {
      // Add current directory
      spinner.start('Adding current directory as project');

      const project = await manager.addCurrentProject({
        name: options.name,
        description: options.description,
        tags,
        group: options.group
      });

      spinner.succeed(`Added project: ${chalk.green(project.name)}`);
      console.log(`  Path: ${chalk.dim(project.path)}`);
      if (project.description) {
        console.log(`  Description: ${chalk.dim(project.description)}`);
      }
      if (tags.length > 0) {
        console.log(`  Tags: ${chalk.yellow(tags.join(', '))}`);
      }
    }
  } catch (error) {
    spinner.fail(chalk.red((error as Error).message));
    process.exit(1);
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: implement add command"
```

---

### Task 7: List Command Implementation

**Files:**
- Create: `src/commands/list.ts`

**Step 1: Create list command**

Create `src/commands/list.ts`:

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { ProjectManager } from '../services/project-manager';

function formatProject(project: any, index: number): string {
  const tags = project.tags.length > 0
    ? chalk.yellow(`[${project.tags.join(', ')}]`)
    : '';

  const group = project.group
    ? chalk.blue(`@${project.group}`)
    : '';

  const meta = [tags, group].filter(Boolean).join(' ');

  return `${chalk.dim(`[${index}]`)} ${chalk.green(project.name)} ${meta}
    ${chalk.dim(project.path)}
    ${project.description ? chalk.dim(`— ${project.description}`) : ''}`;
}

export async function listCommand(options: {
  recent?: boolean;
  group?: string;
  tag?: string;
}): Promise<void> {
  const spinner = ora();
  const manager = new ProjectManager();

  try {
    spinner.start('Loading projects');

    let projects: any[];

    if (options.recent) {
      projects = await manager.getRecentProjects(10);
      spinner.text = 'Loading recent projects';
    } else {
      projects = await manager.getAllProjects();
    }

    // Apply filters
    if (options.group) {
      projects = projects.filter(p => p.group === options.group);
    }

    if (options.tag) {
      projects = projects.filter(p => p.tags.includes(options.tag!));
    }

    spinner.stop();

    if (projects.length === 0) {
      console.log(chalk.yellow('No projects found.'));
      console.log(chalk.dim('Add a project with: cps add [path]'));
      return;
    }

    console.log(chalk.bold(`\nFound ${chalk.cyan(projects.length)} project(s)\n`));

    projects.forEach((project, index) => {
      console.log(formatProject(project, index));
      if (index < projects.length - 1) {
        console.log();
      }
    });

    console.log();
  } catch (error) {
    spinner.fail(chalk.red((error as Error).message));
    process.exit(1);
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: implement list command"
```

---

### Task 8: Switch Command Implementation

**Files:**
- Create: `src/commands/switch.ts`

**Step 1: Create switch command**

Create `src/commands/switch.ts`:

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { ProjectManager } from '../services/project-manager';
import { execSync } from 'child_process';

function printCdCommand(projectPath: string): void {
  console.log(chalk.bold('\nTo switch to this project, run:'));
  console.log(chalk.cyan(`  cd ${projectPath}`));
  console.log();
}

export async function switchCommand(
  name: string | undefined,
  options: {
    fzf?: boolean;
    recent?: boolean;
  }
): Promise<void> {
  const spinner = ora();
  const manager = new ProjectManager();

  try {
    if (options.fzf) {
      // Fzf mode - handle in Part 5
      spinner.warn(chalk.yellow('Fzf mode will be implemented in Part 5'));
      return;
    }

    if (name) {
      // Find project by name
      spinner.start(`Finding project: ${name}`);
      const project = await manager.findProjectByName(name);

      if (!project) {
        spinner.fail(chalk.red(`Project not found: ${name}`));
        process.exit(1);
      }

      spinner.stop();
      await manager.recordAccess(project.id);
      printCdCommand(project.path);
    } else {
      // No name provided - show recent projects
      spinner.start('Loading projects');
      const projects = options.recent
        ? await manager.getRecentProjects(10)
        : await manager.getAllProjects();

      spinner.stop();

      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found.'));
        return;
      }

      console.log(chalk.bold('\nRecent projects:\n'));

      projects.slice(0, 10).forEach((project, index) => {
        console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.green(project.name)}`);
        console.log(`     ${chalk.dim(project.path)}`);
        console.log();
      });

      console.log(chalk.dim('Use: cps switch <name> to switch to a project'));
      console.log(chalk.dim('Use: cps switch --fzf for interactive selection'));
    }
  } catch (error) {
    spinner.fail(chalk.red((error as Error).message));
    process.exit(1);
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: implement switch command"
```

---

*Continue to Part 5: Fzf Integration...*

## Part 5: Fzf Integration and Interactive Selection

### Task 9: Fzf Wrapper

**Files:**
- Create: `src/fzf/index.ts`

**Step 1: Check fzf availability**

Create `src/fzf/index.ts`:

```typescript
import { execSync } from 'child_process';
import { Project } from '../types';

export interface FzfOptions {
  prompt?: string;
  height?: string;
  preview?: string;
  multi?: boolean;
}

export class FzfWrapper {
  private available: boolean | null = null;

  isAvailable(): boolean {
    if (this.available !== null) {
      return this.available;
    }

    try {
      execSync('which fzf', { stdio: 'ignore' });
      this.available = true;
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  async selectProject(projects: Project[], options: FzfOptions = {}): Promise<Project | null> {
    if (!this.isAvailable()) {
      throw new Error('fzf is not installed. Install it from: https://github.com/junegunn/fzf');
    }

    if (projects.length === 0) {
      return null;
    }

    // Build input lines with project info
    const lines = projects.map(p => {
      const tags = p.tags.length > 0 ? `[${p.tags.join(',')}]` : '';
      const group = p.group ? `@${p.group}` : '';
      const meta = [tags, group].filter(Boolean).join(' ');
      return `${p.name}\t${p.path}\t${meta}\t${p.id}`;
    }).join('\n');

    // Build fzf command
    const args = [
      '--delimiter', '\\t',
      '--with-nth', '1,3',
      '--ansi',
      '--prompt', options.prompt || 'Select project> ',
      '--height', options.height || '40%',
      '--preview', options.preview || 'echo {2}',
      '--preview-window', 'down:3:noborder',
      '--select-1',
      '--exit-0'
    ];

    try {
      const result = execSync(`echo "${lines.replace(/"/g, '\\"')}" | fzf ${args.join(' ')}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const selectedLine = result.trim();
      const selectedId = selectedLine.split('\t')[3];

      return projects.find(p => p.id === selectedId) || null;
    } catch (error) {
      // User cancelled (fzf exits with non-zero)
      return null;
    }
  }

  async selectMultiple(projects: Project[], options: FzfOptions = {}): Promise<Project[]> {
    if (!this.isAvailable()) {
      throw new Error('fzf is not installed. Install it from: https://github.com/junegunn/fzf');
    }

    if (projects.length === 0) {
      return [];
    }

    const lines = projects.map(p => {
      const tags = p.tags.length > 0 ? `[${p.tags.join(',')}]` : '';
      const group = p.group ? `@${p.group}` : '';
      const meta = [tags, group].filter(Boolean).join(' ');
      return `${p.name}\t${p.path}\t${meta}\t${p.id}`;
    }).join('\n');

    const args = [
      '--delimiter', '\\t',
      '--with-nth', '1,3',
      '--ansi',
      '--prompt', options.prompt || 'Select projects> ',
      '--height', options.height || '40%',
      '--multi',
      '--preview', 'echo {2}',
      '--preview-window', 'down:3:noborder'
    ];

    try {
      const result = execSync(`echo "${lines.replace(/"/g, '\\"')}" | fzf ${args.join(' ')}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const selectedLines = result.trim().split('\n').filter(Boolean);
      const selectedIds = selectedLines.map(line => line.split('\t')[3]);

      return projects.filter(p => selectedIds.includes(p.id));
    } catch {
      return [];
    }
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add fzf wrapper for interactive selection"
```

---

### Task 10: Update Switch Command with Fzf Support

**Files:**
- Modify: `src/commands/switch.ts`

**Step 1: Update switch command to support fzf**

Replace the fzf mode section in `src/commands/switch.ts`:

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { ProjectManager } from '../services/project-manager';
import { FzfWrapper } from '../fzf';

function printCdCommand(projectPath: string): void {
  console.log(chalk.bold('\nTo switch to this project, run:'));
  console.log(chalk.cyan(`  cd ${projectPath}`));
  console.log();
}

export async function switchCommand(
  name: string | undefined,
  options: {
    fzf?: boolean;
    recent?: boolean;
  }
): Promise<void> {
  const spinner = ora();
  const manager = new ProjectManager();
  const fzf = new FzfWrapper();

  try {
    if (options.fzf) {
      // Fzf mode
      spinner.start('Loading projects');

      const projects = options.recent
        ? await manager.getRecentProjects(50)
        : await manager.getAllProjects();

      spinner.stop();

      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found.'));
        console.log(chalk.dim('Add a project with: cps add [path]'));
        return;
      }

      const selected = await fzf.selectProject(projects, {
        prompt: 'Switch to project> ',
        preview: 'echo {2}'
      });

      if (selected) {
        await manager.recordAccess(selected.id);
        console.log(chalk.green(`Selected: ${selected.name}`));
        printCdCommand(selected.path);
      } else {
        console.log(chalk.dim('No project selected.'));
      }
      return;
    }

    if (name) {
      // Find project by name
      spinner.start(`Finding project: ${name}`);
      const project = await manager.findProjectByName(name);

      if (!project) {
        spinner.fail(chalk.red(`Project not found: ${name}`));
        process.exit(1);
      }

      spinner.stop();
      await manager.recordAccess(project.id);
      printCdCommand(project.path);
    } else {
      // No name provided - show recent projects
      spinner.start('Loading projects');
      const projects = options.recent
        ? await manager.getRecentProjects(10)
        : await manager.getAllProjects();

      spinner.stop();

      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found.'));
        return;
      }

      console.log(chalk.bold('\nRecent projects:\n'));

      projects.slice(0, 10).forEach((project, index) => {
        console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.green(project.name)}`);
        console.log(`     ${chalk.dim(project.path)}`);
        console.log();
      });

      console.log(chalk.dim('Use: cps switch <name> to switch to a project'));
      console.log(chalk.dim('Use: cps switch --fzf for interactive selection'));
    }
  } catch (error) {
    spinner.fail(chalk.red((error as Error).message));
    process.exit(1);
  }
}
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit changes**

Run:
```bash
git add .
git commit -m "feat: implement fzf interactive selection in switch command"
```

---

### Task 11: Shell Integration

**Files:**
- Create: `scripts/install.sh`
- Create: `src/shell/zsh.sh`
- Create: `src/shell/bash.sh`

**Step 1: Create Zsh integration**

Create `src/shell/zsh.sh`:

```bash
# Claude Project Switcher Zsh Integration

# Shortcut function for quick switching
cps() {
    local result
    result=$(command cps switch --fzf 2>/dev/null)

    if [[ -n "$result" ]]; then
        local path=$(echo "$result" | grep "cd " | sed 's/cd //')
        if [[ -d "$path" ]]; then
            cd "$path"
        fi
    fi
}

# Completion for cps command
_cps_completion() {
    local -a commands
    commands=(
        'add:Add a project'
        'list:List all projects'
        'switch:Switch to a project'
        'remove:Remove a project'
        'scan:Scan directory for projects'
    )

    if (( CURRENT == 2 )); then
        _describe 'command' commands
    fi
}

compdef _cps_completion cps
```

**Step 2: Create Bash integration**

Create `src/shell/bash.sh`:

```bash
# Claude Project Switcher Bash Integration

# Shortcut function for quick switching
cps() {
    local result
    result=$(command cps switch --fzf 2>/dev/null)

    if [[ -n "$result" ]]; then
        local path=$(echo "$result" | grep "cd " | sed 's/cd //')
        if [[ -d "$path" ]]; then
            cd "$path"
        fi
    fi
}

# Completion for cps command
_cps_completion() {
    local cur prev commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    commands="add list switch remove scan"

    if [[ ${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "${commands}" -- "${cur}") )
    fi
}

complete -F _cps_completion cps
```

**Step 3: Create install script**

Create `scripts/install.sh`:

```bash
#!/bin/bash

set -e

INSTALL_DIR="$HOME/.claude-project-switcher"
SHELLrc=""

# Detect shell
if [[ -n "$ZSH_VERSION" ]]; then
    SHELLRC="$HOME/.zshrc"
    SHELL_TYPE="zsh"
elif [[ -n "$BASH_VERSION" ]]; then
    SHELLRC="$HOME/.bashrc"
    SHELL_TYPE="bash"
else
    echo "Unsupported shell. Please manually source the appropriate shell script."
    exit 1
fi

echo "Detected shell: $SHELL_TYPE"
echo "Shell config: $SHELLRC"

# Check if already installed
if grep -q "Claude Project Switcher" "$SHELLRC" 2>/dev/null; then
    echo "Claude Project Switcher is already installed in $SHELLRC"
    echo "To reinstall, remove the relevant lines from $SHELLRC first"
    exit 0
fi

# Add to shell config
echo ""
echo "Adding Claude Project Switcher to $SHELLRC..."
echo "" >> "$SHELLRC"
echo "# Claude Project Switcher" >> "$SHELLRC"
echo "source \"$INSTALL_DIR/shell/$SHELL_TYPE.sh\"" >> "$SHELLRC"

echo "Installation complete!"
echo "Please restart your shell or run: source $SHELLRC"
```

**Step 4: Build and verify**

Run:
```bash
chmod +x scripts/install.sh
npm run build
```

Expected: Clean build with no errors

**Step 5: Commit changes**

Run:
```bash
git add .
git commit -m "feat: add shell integration for zsh and bash"
```

---

*Continue to Part 6: Tests and Documentation...*

## Part 6: Tests, Documentation, and Publishing

### Task 12: Test Setup

**Files:**
- Create: `jest.config.js`
- Create: `src/__tests__/config.test.ts`
- Create: `src/__tests__/scanner.test.ts`
- Create: `src/__tests__/project-manager.test.ts`

**Step 1: Create Jest configuration**

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
```

**Step 2: Create config manager tests**

Create `src/__tests__/config.test.ts`:

```typescript
import { ConfigManager } from '../config/manager';
import { Project } from '../types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  let tempDir: string;
  let configPath: string;
  let manager: ConfigManager;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `cps-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    configPath = path.join(tempDir, 'test-config.json');
    manager = new ConfigManager(configPath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('load', () => {
    it('should create default config when file does not exist', async () => {
      const config = await manager.load();

      expect(config.version).toBe('0.1.0');
      expect(config.projects).toEqual([]);
      expect(config.settings.maxHistorySize).toBe(50);
    });

    it('should load existing config', async () => {
      const testConfig = {
        version: '0.1.0',
        projects: [],
        groups: {},
        settings: { maxHistorySize: 100, autoDetectGit: false }
      };

      await fs.writeFile(configPath, JSON.stringify(testConfig));

      const config = await manager.load();
      expect(config.settings.maxHistorySize).toBe(100);
    });
  });

  describe('addProject', () => {
    it('should add a new project', async () => {
      await manager.load();

      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        path: '/test/path',
        tags: [],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0
      };

      await manager.addProject(project);

      const projects = manager.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Test Project');
    });

    it('should update existing project', async () => {
      await manager.load();

      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        path: '/test/path',
        tags: [],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0
      };

      await manager.addProject(project);

      project.name = 'Updated Project';
      await manager.addProject(project);

      const projects = manager.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Updated Project');
    });
  });

  describe('getRecentProjects', () => {
    it('should return projects sorted by lastAccessed', async () => {
      await manager.load();

      const now = Date.now();

      await manager.addProject({
        id: '1',
        name: 'Old',
        path: '/old',
        tags: [],
        createdAt: now,
        lastAccessed: now - 10000,
        accessCount: 0
      });

      await manager.addProject({
        id: '2',
        name: 'New',
        path: '/new',
        tags: [],
        createdAt: now,
        lastAccessed: now,
        accessCount: 0
      });

      const recent = manager.getRecentProjects(10);
      expect(recent[0].name).toBe('New');
      expect(recent[1].name).toBe('Old');
    });

    it('should respect limit parameter', async () => {
      await manager.load();

      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        await manager.addProject({
          id: String(i),
          name: `Project ${i}`,
          path: `/project/${i}`,
          tags: [],
          createdAt: now + i * 1000,
          lastAccessed: now + i * 1000,
          accessCount: 0
        });
      }

      const recent = manager.getRecentProjects(5);
      expect(recent).toHaveLength(5);
    });
  });

  describe('updateProjectAccess', () => {
    it('should update lastAccessed and accessCount', async () => {
      await manager.load();

      const project: Project = {
        id: 'test-id',
        name: 'Test',
        path: '/test',
        tags: [],
        createdAt: Date.now(),
        lastAccessed: 1000,
        accessCount: 5
      };

      await manager.addProject(project);
      await manager.updateProjectAccess('test-id');

      const projects = manager.getProjects();
      expect(projects[0].lastAccessed).toBeGreaterThan(1000);
      expect(projects[0].accessCount).toBe(6);
    });
  });
});
```

**Step 3: Create scanner tests**

Create `src/__tests__/scanner.test.ts`:

```typescript
import { GitDetector } from '../scanner/git-detector';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('GitDetector', () => {
  let tempDir: string;
  let detector: GitDetector;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `cps-git-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    detector = new GitDetector();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('isGitRepo', () => {
    it('should return false for non-git directory', async () => {
      const result = await detector.isGitRepo(tempDir);
      expect(result).toBe(false);
    });

    it('should return true for git directory', async () => {
      await fs.mkdir(path.join(tempDir, '.git'));
      const result = await detector.isGitRepo(tempDir);
      expect(result).toBe(true);
    });
  });

  describe('findGitRoot', () => {
    it('should find git root in nested directory', async () => {
      const gitDir = path.join(tempDir, 'myproject');
      await fs.mkdir(path.join(gitDir, '.git'), { recursive: true });

      const nestedDir = path.join(gitDir, 'src', 'components');
      await fs.mkdir(nestedDir, { recursive: true });

      const root = await detector.findGitRoot(nestedDir);
      expect(root).toBe(gitDir);
    });

    it('should return null when no git repo found', async () => {
      const root = await detector.findGitRoot(tempDir);
      expect(root).toBeNull();
    });
  });

  describe('detect', () => {
    it('should return null for non-git directory', async () => {
      const result = await detector.detect(tempDir);
      expect(result).toBeNull();
    });

    it('should detect git repository', async () => {
      const gitDir = path.join(tempDir, 'myproject');
      await fs.mkdir(path.join(gitDir, '.git'), { recursive: true });

      const result = await detector.detect(gitDir);
      expect(result).not.toBeNull();
      expect(result?.root).toBe(gitDir);
    });
  });
});
```

**Step 4: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass

**Step 5: Commit changes**

Run:
```bash
git add .
git commit -m "test: add unit tests for config and scanner"
```

---

### Task 13: Documentation

**Files:**
- Create: `README.md`
- Create: `docs/USAGE.md`
- Create: `docs/INSTALLATION.md`

**Step 1: Create README**

Create `README.md`:

```markdown
# Claude Project Switcher

Fast, interactive project navigation for Claude Code users.

## Features

- 🚀 **Quick Switching**: Jump between projects with fuzzy search (fzf)
- 📚 **Project History**: Track recently accessed projects
- 🏷️ **Tags & Groups**: Organize projects with tags and groups
- 🔍 **Auto-Discovery**: Automatically detects Git repositories
- 🐚 **Shell Integration**: Native zsh and bash support

## Installation

```bash
npm install -g claude-project-switcher
```

Or use the install script for shell integration:

```bash
npm install -g claude-project-switcher
cps-install
```

## Quick Start

```bash
# Add current directory as a project
cps add

# Add a project by path
cps add ~/projects/my-app

# List all projects
cps list

# Switch to a project (interactive)
cps switch --fzf

# Switch by name
cps switch my-app

# Show recent projects
cps list --recent
```

## Commands

| Command | Description |
|---------|-------------|
| `cps add [path]` | Add a project |
| `cps list` | List all projects |
| `cps switch [name]` | Switch to a project |
| `cps remove <name>` | Remove a project |
| `cps scan [path]` | Scan directory for projects |

## Requirements

- Node.js 20+
- fzf (optional, for interactive selection)

## License

MIT
```

**Step 2: Create usage documentation**

Create `docs/USAGE.md`:

```markdown
# Usage Guide

## Adding Projects

### Add Current Directory

```bash
cps add
```

### Add with Custom Name

```bash
cps add ~/projects/my-app -n "My App"
```

### Add with Tags

```bash
cps add ~/projects/api -t "backend,typescript,rest"
```

### Add to Group

```bash
cps add ~/projects/website -g "work"
```

## Switching Projects

### Interactive Selection (Recommended)

```bash
cps switch --fzf
```

This opens an interactive fzf interface where you can fuzzy search project names.

### By Name

```bash
cps switch my-app
```

### Recent Projects

```bash
cps switch --recent
```

## Listing Projects

### All Projects

```bash
cps list
```

### Recent Projects

```bash
cps list --recent
```

### Filter by Group

```bash
cps list --group work
```

### Filter by Tag

```bash
cps list --tag typescript
```

## Removing Projects

```bash
cps remove my-app
```

## Scanning Directories

```bash
# Scan current directory (2 levels deep)
cps scan

# Scan specific directory with depth
cps scan ~/projects --depth 3

# Scan and auto-add found projects
cps scan ~/projects --add
```

## Shell Integration

After running `cps-install`, you can use the `cps` function directly in your shell:

```bash
cps  # Automatically cd to selected project
```

The shell integration also provides tab completion for commands.
```

**Step 3: Create installation documentation**

Create `docs/INSTALLATION.md`:

```markdown
# Installation Guide

## Prerequisites

1. **Node.js 20+**

Check your version:
```bash
node --version
```

2. **fzf** (optional but recommended)

Install via Homebrew (macOS):
```bash
brew install fzf
```

Install via apt (Ubuntu/Debian):
```bash
apt install fzf
```

## NPM Installation

```bash
npm install -g claude-project-switcher
```

Verify installation:
```bash
cps --version
```

## Shell Integration (Optional)

For the best experience, install shell integration:

```bash
cps-install
```

Then restart your shell or run:
```bash
source ~/.zshrc   # for zsh
source ~/.bashrc  # for bash
```

## Manual Shell Setup

If the install script doesn't work, add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# Claude Project Switcher
source "$HOME/.claude-project-switcher/shell/zsh.sh"  # or bash.sh
```

## Uninstallation

```bash
npm uninstall -g claude-project-switcher
```

Then remove the shell integration lines from your `~/.zshrc` or `~/.bashrc`.
```

**Step 4: Commit changes**

Run:
```bash
git add .
git commit -m "docs: add README and usage documentation"
```

---

### Task 14: Package Publishing

**Files:**
- Create: `.npmignore`
- Modify: `package.json`

**Step 1: Create .npmignore**

Create `.npmignore`:

```
src/
tsconfig.json
jest.config.js
.github/
docs/plans/
*.test.ts
__tests__/
.DS_Store
*.log
coverage/
```

**Step 2: Update package.json for publishing**

Add to `package.json`:

```json
{
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "dist",
    "scripts",
    "src/shell",
    "README.md"
  ],
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 3: Build for production**

Run:
```bash
npm run build
```

**Step 4: Test the package locally**

Run:
```bash
npm link
cps --version
```

**Step 5: Commit changes**

Run:
```bash
git add .
git commit -m "build: prepare package for npm publishing"
```

---

## Summary

This implementation plan provides a complete, production-ready project switcher for Claude Code with:

✅ **Part 1**: TypeScript project setup
✅ **Part 2**: Data models and configuration
✅ **Part 3**: Project scanning and management
✅ **Part 4**: CLI commands (add, list, switch, remove, scan)
✅ **Part 5**: fzf integration and shell support
✅ **Part 6**: Tests, documentation, and publishing

### Execution Handoff

**Plan complete and saved to `docs/plans/2026-01-22-claude-project-switcher.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans


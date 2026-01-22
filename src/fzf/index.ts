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

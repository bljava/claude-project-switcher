import { spawn, spawnSync } from 'child_process';
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

    const result = spawnSync('which', ['fzf'], { stdio: 'ignore' });
    this.available = result.status === 0;
    return this.available;
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

    // Build fzf command args
    const args = [
      '--delimiter', '\t',
      '--with-nth', '1,3',
      '--ansi',
      '--prompt', options.prompt || 'Select project> ',
      '--height', options.height || '40%',
      '--preview', options.preview || 'echo {2}',
      '--preview-window', 'down:3:noborder',
      '--select-1',
      '--exit-0'
    ];

    return new Promise((resolve) => {
      const fzf = spawn('fzf', args, {
        stdio: ['pipe', 'pipe', process.stderr]
      });

      let output = '';

      fzf.stdout.on('data', (data) => {
        output += data.toString();
      });

      fzf.on('close', (code) => {
        if (code === 0 && output.trim()) {
          const selectedId = output.trim().split('\t')[3];
          const project = projects.find(p => p.id === selectedId);
          resolve(project || null);
        } else {
          resolve(null);
        }
      });

      fzf.on('error', () => {
        resolve(null);
      });

      // Write input to fzf
      fzf.stdin.write(lines);
      fzf.stdin.end();
    });
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
      '--delimiter', '\t',
      '--with-nth', '1,3',
      '--ansi',
      '--prompt', options.prompt || 'Select projects> ',
      '--height', options.height || '40%',
      '--multi',
      '--preview', 'echo {2}',
      '--preview-window', 'down:3:noborder'
    ];

    return new Promise((resolve) => {
      const fzf = spawn('fzf', args, {
        stdio: ['pipe', 'pipe', process.stderr]
      });

      let output = '';

      fzf.stdout.on('data', (data) => {
        output += data.toString();
      });

      fzf.on('close', (code) => {
        if (code === 0 && output.trim()) {
          const selectedLines = output.trim().split('\n').filter(Boolean);
          const selectedIds = selectedLines.map(line => line.split('\t')[3]);
          resolve(projects.filter(p => selectedIds.includes(p.id)));
        } else {
          resolve([]);
        }
      });

      fzf.on('error', () => {
        resolve([]);
      });

      // Write input to fzf
      fzf.stdin.write(lines);
      fzf.stdin.end();
    });
  }
}

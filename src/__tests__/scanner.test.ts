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

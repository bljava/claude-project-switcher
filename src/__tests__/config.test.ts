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
    tempDir = path.join(os.tmpdir(), `cps-test-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tempDir, { recursive: true });
    configPath = path.join(tempDir, 'test-config.json');
    manager = new ConfigManager(configPath);
    await manager.load(); // Initialize with fresh config
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
      const timestamp = Date.now();

      await manager.addProject({
        id: `recent-test-${timestamp}-1`,
        name: 'Old',
        path: '/old',
        tags: [],
        createdAt: now,
        lastAccessed: now - 10000,
        accessCount: 0
      });

      await manager.addProject({
        id: `recent-test-${timestamp}-2`,
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
      const timestamp = Date.now();
      for (let i = 0; i < 20; i++) {
        await manager.addProject({
          id: `limit-test-${timestamp}-${i}`,
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

      const timestamp = Date.now();
      const projectId = `update-test-${timestamp}`;
      const project: Project = {
        id: projectId,
        name: 'Test',
        path: '/test',
        tags: [],
        createdAt: Date.now(),
        lastAccessed: 1000,
        accessCount: 5
      };

      await manager.addProject(project);
      await manager.updateProjectAccess(projectId);

      const projects = manager.getProjects();
      const updated = projects.find(p => p.id === projectId);
      expect(updated?.lastAccessed).toBeGreaterThan(1000);
      expect(updated?.accessCount).toBe(6);
    });
  });
});

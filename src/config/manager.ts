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

  async setProjects(projects: Project[]): Promise<void> {
    if (!this.config) await this.load();
    if (!this.config) throw new Error('Failed to load config');
    this.config.projects = projects;
    await this.save();
  }
}

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

    await this.config.setProjects(filtered);
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

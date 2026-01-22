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

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

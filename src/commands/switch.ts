import chalk from 'chalk';
import ora from 'ora';
import { ProjectManager } from '../services/project-manager';

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

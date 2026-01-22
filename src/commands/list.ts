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

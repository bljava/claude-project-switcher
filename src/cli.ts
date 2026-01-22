#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from './index';

const program = new Command();

program
  .name('cps')
  .description('Claude Project Switcher - Fast project navigation')
  .version(VERSION);

// Add commands
program.command('add [path]')
  .description('Add a project to the switcher')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-g, --group <group>', 'Project group')
  .action(async (path, options) => {
    const { addCommand } = await import('./commands/add');
    await addCommand(path, options);
  });

program.command('list')
  .description('List all projects')
  .option('-r, --recent', 'Show recently accessed projects')
  .option('-g, --group <group>', 'Filter by group')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action(async (options) => {
    const { listCommand } = await import('./commands/list');
    await listCommand(options);
  });

program.command('switch [name]')
  .alias('s')
  .description('Switch to a project')
  .option('-f, --fzf', 'Use fzf for interactive selection')
  .option('-r, --recent', 'Show recent projects only')
  .option('-c, --claude', 'Output pure cd command for shell integration (with Claude)')
  .action(async (name, options) => {
    const { switchCommand } = await import('./commands/switch');
    await switchCommand(name, options);
  });

program.command('remove <name>')
  .alias('rm')
  .description('Remove a project')
  .action(async (name) => {
    const { removeCommand } = await import('./commands/remove');
    await removeCommand(name);
  });

program.command('scan [path]')
  .description('Scan directory for projects')
  .option('-d, --depth <number>', 'Max scan depth', '2')
  .option('-a, --add', 'Auto-add found projects')
  .action(async (scanPath, options) => {
    const { scanCommand } = await import('./commands/scan');
    await scanCommand(scanPath, options);
  });

program.parse();

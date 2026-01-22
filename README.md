# Claude Project Switcher

Fast, interactive project navigation for Claude Code users.

## Features

- Quick Switching: Jump between projects with fuzzy search (fzf)
- Project History: Track recently accessed projects
- Tags & Groups: Organize projects with tags and groups
- Auto-Discovery: Automatically detects Git repositories
- Shell Integration: Native zsh and bash support
- Claude Code Launcher: Fast project switching with automatic Claude Code startup

## Installation

```bash
npm install -g claude-project-switcher
```

Or use the install script for shell integration:

```bash
npm install -g claude-project-switcher
cps-install
```

## Quick Start

```bash
# Add current directory as a project
command cps add

# Add a project by path
command cps add ~/projects/my-app

# List all projects
command cps list

# Switch to a project (interactive)
command cps switch --fzf

# Switch by name
command cps switch my-app

# Show recent projects
command cps list --recent

# Use shell shortcuts (after running cps-install)
cc           # Quick switch AND start Claude Code
```

## Shell Integration

Run `cps-install` after installation to enable shell shortcuts:

```bash
cps-install
# Restart your shell or run: source ~/.bashrc or source ~/.zshrc
```

### Shell Shortcuts

| Shortcut | Description |
|----------|-------------|
| `cc` | Interactive project switch AND start Claude Code |

The `cc` command is the fastest way to jump between projects and start working with Claude Code:

```bash
# Press cc, select your project, and Claude Code starts automatically
cc
# → fzf opens → select project → cd to project → claude . runs
```

## Commands

| Command                     | Description |
|-----------------------------|-------------|
| `command cps add [path]`    | Add a project |
| `command cps list`          | List all projects |
| `command cps switch [name]` | Switch to a project |
| `command cps remove <name>` | Remove a project |
| `command cps scan [path]`   | Scan directory for projects |

## Requirements

- Node.js 20+
- fzf (optional, for interactive selection)

## License

MIT

# Claude Project Switcher

Fast, interactive project navigation for Claude Code users.

## Features

- Quick Switching: Jump between projects with fuzzy search (fzf)
- Project History: Track recently accessed projects
- Tags & Groups: Organize projects with tags and groups
- Auto-Discovery: Automatically detects Git repositories
- Shell Integration: Native zsh and bash support

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
cps add

# Add a project by path
cps add ~/projects/my-app

# List all projects
cps list

# Switch to a project (interactive)
cps switch --fzf

# Switch by name
cps switch my-app

# Show recent projects
cps list --recent
```

## Commands

| Command | Description |
|---------|-------------|
| `cps add [path]` | Add a project |
| `cps list` | List all projects |
| `cps switch [name]` | Switch to a project |
| `cps remove <name>` | Remove a project |
| `cps scan [path]` | Scan directory for projects |

## Requirements

- Node.js 20+
- fzf (optional, for interactive selection)

## License

MIT

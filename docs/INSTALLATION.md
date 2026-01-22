# Installation Guide

## Prerequisites

1. **Node.js 20+**

Check your version:
```bash
node --version
```

2. **fzf** (optional but recommended)

Install via Homebrew (macOS):
```bash
brew install fzf
```

Install via apt (Ubuntu/Debian):
```bash
apt install fzf
```

## NPM Installation

```bash
npm install -g claude-project-switcher
```

Verify installation:
```bash
cps --version
```

## Shell Integration (Optional)

For the best experience, install shell integration:

```bash
cps-install
```

Then restart your shell or run:
```bash
source ~/.zshrc   # for zsh
source ~/.bashrc  # for bash
```

## Manual Shell Setup

If the install script doesn't work, add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# Claude Project Switcher
source "$HOME/.claude-project-switcher/shell/zsh.sh"  # or bash.sh
```

## Uninstallation

```bash
npm uninstall -g claude-project-switcher
```

Then remove the shell integration lines from your `~/.zshrc` or `~/.bashrc`.

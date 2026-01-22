# Usage Guide

## Adding Projects

### Add Current Directory

```bash
cps add
```

### Add with Custom Name

```bash
cps add ~/projects/my-app -n "My App"
```

### Add with Tags

```bash
cps add ~/projects/api -t "backend,typescript,rest"
```

### Add to Group

```bash
cps add ~/projects/website -g "work"
```

## Switching Projects

### Interactive Selection (Recommended)

```bash
cps switch --fzf
```

This opens an interactive fzf interface where you can fuzzy search project names.

### By Name

```bash
cps switch my-app
```

### Recent Projects

```bash
cps switch --recent
```

## Listing Projects

### All Projects

```bash
cps list
```

### Recent Projects

```bash
cps list --recent
```

### Filter by Group

```bash
cps list --group work
```

### Filter by Tag

```bash
cps list --tag typescript
```

## Removing Projects

```bash
cps remove my-app
```

## Scanning Directories

```bash
# Scan current directory (2 levels deep)
cps scan

# Scan specific directory with depth
cps scan ~/projects --depth 3

# Scan and auto-add found projects
cps scan ~/projects --add
```

## Shell Integration

After running `cps-install`, you can use the `cps` function directly in your shell:

```bash
cps  # Automatically cd to selected project
```

The shell integration also provides tab completion for commands.

#!/bin/bash

set -e

INSTALL_DIR="$HOME/.claude-project-switcher"
SHELLRC=""
SHELL_TYPE=""

# Detect shell
if [[ -n "$ZSH_VERSION" ]]; then
    SHELLRC="$HOME/.zshrc"
    SHELL_TYPE="zsh"
elif [[ -n "$BASH_VERSION" ]]; then
    SHELLRC="$HOME/.bashrc"
    SHELL_TYPE="bash"
else
    echo "Unsupported shell. Please manually source the appropriate shell script."
    exit 1
fi

echo "Detected shell: $SHELL_TYPE"
echo "Shell config: $SHELLRC"

# Check if already installed
if grep -q "Claude Project Switcher" "$SHELLRC" 2>/dev/null; then
    echo "Claude Project Switcher is already installed in $SHELLRC"
    echo "To reinstall, remove the relevant lines from $SHELLRC first"
    exit 0
fi

# Create install directory and copy shell scripts
echo "Creating $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR/shell"

# Find the shell scripts relative to this install script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/../src/shell/$SHELL_TYPE.sh" "$INSTALL_DIR/shell/"

# Add to shell config
echo ""
echo "Adding Claude Project Switcher to $SHELLRC..."
echo "" >> "$SHELLRC"
echo "# Claude Project Switcher" >> "$SHELLRC"
echo "source \"$INSTALL_DIR/shell/$SHELL_TYPE.sh\"" >> "$SHELLRC"

echo "Installation complete!"
echo "Please restart your shell or run: source $SHELLRC"

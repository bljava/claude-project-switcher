# Claude Project Switcher Zsh Integration

# Shortcut function for quick switching
cps() {
    local result
    result=$(command cps switch --fzf --claude 2>/dev/null)

    if [[ -n "$result" ]]; then
        # Result is pure "cd <path>" format
        eval "$result"
    fi
}

# Switch project AND start Claude Code
cc() {
    local result
    result=$(command cps switch --fzf --claude 2>/dev/null)

    if [[ -n "$result" ]]; then
        # Result is now pure "cd <path>" format
        eval "$result" && claude .
    fi
}

# Completion for cps command
_cps_completion() {
    local -a commands
    commands=(
        'add:Add a project'
        'list:List all projects'
        'switch:Switch to a project'
        'remove:Remove a project'
        'scan:Scan directory for projects'
    )

    if (( CURRENT == 2 )); then
        _describe 'command' commands
    fi
}

compdef _cps_completion cps

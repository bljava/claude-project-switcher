# Claude Project Switcher Bash Integration

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
    local cur prev commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    commands="add list switch remove scan"

    if [[ ${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "${commands}" -- "${cur}") )
    fi
}

complete -F _cps_completion cps

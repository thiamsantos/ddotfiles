function herdr-pick-workspace --description "fzf picker for herdr workspaces (label, branch, cwd)"
    set -l agents_json (herdr agent list)
    set -l ws_json (herdr workspace list)

    # Build a NUL-delimited stream of multi-line records and hand it to fzf.
    # Each record: line 1 = "id\tlabel · status", line 2 = branch, line 3 = cwd.
    set -l selection (begin
        for line in (echo $ws_json | jq -r '.result.workspaces[]
                | [.workspace_id, (.label // "?"), (.agent_status // "?")] | @tsv')
            set -l parts (string split \t -- $line)
            set -l id $parts[1]
            set -l label $parts[2]
            set -l st $parts[3]

            set -l cwd (echo $agents_json | jq -r --arg ws $id \
                'first(.result.agents[] | select(.workspace_id==$ws) | .cwd) // ""')

            set -l branch "-"
            if test -n "$cwd"
                set branch (git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null; or echo "-")
            end

            set -l short (test -n "$cwd"; and string replace -- "$HOME" "~" "$cwd"; or echo "-")

            printf '%s\t%s · %s\n  %s\n  %s\0' $id $label $st $branch $short
        end
    end | fzf --ansi --read0 --gap \
            --delimiter='\t' --with-nth=2.. \
            --layout=reverse \
            --prompt='space> ')
    or return

    set -l ws (string split --max 1 \t -- $selection)[1]
    test -n "$ws"; and herdr workspace focus $ws >/dev/null
end

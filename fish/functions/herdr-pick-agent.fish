function herdr-pick-agent --description "fzf picker for herdr agents with pane preview"
    set -l agents_json (herdr agent list)
    set -l wsmap (herdr workspace list \
        | jq -c '[.result.workspaces[] | {(.workspace_id): .label}] | add')

    # Build a NUL-delimited stream of multi-line records for fzf --read0.
    # Record: line 1 = "pane_id\ttitle", line 2 = "  status · workspace · branch".
    set -l selection (begin
        for line in (echo $agents_json | jq -r --argjson ws "$wsmap" '.result.agents[]
                | [ .pane_id,
                    (.terminal_title_stripped // .agent // ""),
                    (.agent_status // "?"),
                    ($ws[.workspace_id] // .workspace_id),
                    (.cwd // "") ] | @tsv')
            set -l f (string split \t -- $line)
            set -l pane $f[1]
            set -l title $f[2]
            set -l st $f[3]
            set -l wsname $f[4]
            set -l cwd $f[5]

            set -l branch "-"
            if test -n "$cwd"
                set branch (git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null; or echo "-")
            end

            printf '%s\t%s\n  %s · %s · %s\0' \
                $pane $title $st $wsname $branch
        end
    end | fzf --ansi --read0 --gap \
            --delimiter='\t' --with-nth=2.. \
            --layout=reverse \
            --prompt='agent> ' \
            --preview='herdr agent read {1} --source visible --lines 40 --format ansi' \
            --preview-window='right,60%,border-left')
    or return

    set -l pane (string split --max 1 \t -- $selection)[1]
    test -n "$pane"; and herdr agent focus $pane >/dev/null
end

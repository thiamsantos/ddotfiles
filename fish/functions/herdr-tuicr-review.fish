function herdr-tuicr-review --description "Open tuicr in a half-width herdr split, block until closed, print the session slug"
    # Parse: [--cwd DIR] -- <tuicr args...>
    set -l cwd $PWD
    set -l argv_rest $argv
    if test "$argv[1]" = --cwd
        set cwd $argv[2]
        set argv_rest $argv[3..-1]
    end
    if test "$argv_rest[1]" = --
        set argv_rest $argv_rest[2..-1]
    end
    if test (count $argv_rest) -eq 0
        echo "herdr-tuicr-review: no tuicr arguments given" >&2
        echo "usage: herdr-tuicr-review [--cwd DIR] -- <tuicr args...>" >&2
        return 1
    end

    # Guard: must be inside a herdr session.
    if test -z "$HERDR_ENV"
        echo "herdr-tuicr-review: not inside a herdr session. Start your agent inside herdr and retry." >&2
        return 1
    end
    if not command -q herdr
        echo "herdr-tuicr-review: herdr not found on PATH." >&2
        return 1
    end
    if not command -q tuicr
        echo "herdr-tuicr-review: tuicr not found on PATH." >&2
        return 1
    end

    # Snapshot existing session slugs so we can spot a newly-created one.
    set -l before_slugs (tuicr review list --all 2>/dev/null | \
        python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(s.get('slug','') for s in d))" 2>/dev/null)

    # Split a half-width pane to the right; capture the new pane id from the JSON result.
    set -l split_json (herdr pane split --direction right --ratio 0.5 --no-focus --cwd "$cwd" 2>/dev/null)
    set -l pane_id (echo $split_json | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['pane']['pane_id'])" 2>/dev/null)
    if test -z "$pane_id"
        echo "herdr-tuicr-review: failed to create herdr pane" >&2
        return 1
    end

    # FIFO so we block until tuicr exits. Always close the pane + remove the fifo.
    set -l fifo (mktemp -u /tmp/herdr-tuicr-fifo.XXXXXX)
    mkfifo "$fifo"
    function __htr_cleanup --inherit-variable pane_id --inherit-variable fifo
        herdr pane close "$pane_id" >/dev/null 2>&1
        rm -f "$fifo"
        functions -e __htr_cleanup
    end

    # Build a single shell command string: run tuicr, then signal done.
    # herdr pane run takes the command as ONE arg (it is submitted to the pane's
    # shell); passing `sh -c` + separate args does NOT execute. Keep it one string.
    set -l tuicr_cmd (string join ' ' -- tuicr $argv_rest)
    herdr pane run "$pane_id" "$tuicr_cmd; echo __TUICR_DONE__ > $fifo" >/dev/null 2>&1

    echo "herdr-tuicr-review: tuicr open in a herdr pane. Review, then press q to close it." >&2

    # Block until tuicr exits (writes to the fifo).
    read -z __htr_done <"$fifo"
    __htr_cleanup

    # Resolve the session for this launch (delegated to a helper — avoids fragile inline python).
    set -l helper (dirname (status --current-filename))/herdr-tuicr-resolve-session.py
    set -l before_joined (string join \n -- $before_slugs)
    set -l args_joined (string join ' ' -- $argv_rest)
    set -l resolved (tuicr review list --all 2>/dev/null | python3 "$helper" "$args_joined" "$before_joined" 2>/dev/null)

    if test -n "$resolved"
        printf '%s\n' $resolved
    else
        echo "herdr-tuicr-review: review complete, but could not resolve the session slug." >&2
        echo "herdr-tuicr-review: look under ~/Library/Application Support/tuicr/reviews/sessions/ (newest file)." >&2
    end
end

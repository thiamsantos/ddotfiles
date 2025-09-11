# Fish shell completions for the r function
complete -c r -f

# Complete commands (first argument)
complete -c r -n "__fish_is_first_token" -a "psql iex" -d "Available commands"

# Complete environments (second argument) - only after a valid command
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from psql iex" -a "stg sand prod" -d "Available environments"

# Add descriptions for specific combinations
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from psql" -a "stg" -d "Connect to staging PostgreSQL"
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from psql" -a "sand" -d "Connect to sandbox PostgreSQL" 
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from psql" -a "prod" -d "Connect to production PostgreSQL"

complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from iex" -a "stg" -d "Start IEx shell on staging"
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from iex" -a "sand" -d "Start IEx shell on sandbox"
complete -c r -n "__fish_is_nth_token 2; and __fish_seen_subcommand_from iex" -a "prod" -d "Start IEx shell on production"


function r --description "Connect to remote environments (staging, sandbox, production)"
    if test (count $argv) -lt 2
        __r_show_usage >&2
        return 1
    end

    set -l cmd $argv[1]
    set -l env $argv[2]
    set -l rest $argv[3..-1]

    if not contains $cmd psql iex login set-param get-param
        __r_show_usage >&2
        return 1
    end

    if not contains $env stg sand prod review
        __r_show_usage >&2
        return 1
    end

    if test "$env" = review
        if test "$cmd" != iex; or test (count $rest) -ne 1
            echo "Error: the 'review' env is only supported as: r iex review APP_NAME" >&2
            return 1
        end
    else
        set -l expected (switch $cmd; case get-param; echo 2; case set-param; echo 3; case '*'; echo 0; end)
        if test (count $rest) -ne $expected
            __r_show_usage >&2
            return 1
        end
    end

    set -l config (__r_get_env_config $env); or return 1
    set -l config (string split " " $config)
    set -l env_name $config[1]
    set -l app $config[2]
    set -l pod $config[3]
    set -l release_bin $config[4]

    echo "Updating remotectl..."
    remotectl update; or echo "r: remotectl update failed, continuing with the installed version" >&2

    echo "Switching to $env_name..."
    remotectl use $env_name; or return 1

    switch $cmd
        case psql
            remotectl portforward $app --psql
        case iex
            if test "$env" = review
                # Attach to the running node with `remote`. `start_iex` boots a second
                # BEAM in the existing pod and gets OOM-killed (exit 137).
                remotectl k8s shell $rest[1] -- $release_bin remote
            else
                remotectl k8s shell $pod -m 8Gi -- $release_bin start_iex
            end
        case get-param
            aws ssm get-parameter --name "/$env_name/$rest[1]/$rest[2]" --with-decryption --region (__r_aws_region)
        case set-param
            aws ssm put-parameter --name "/$env_name/$rest[1]/$rest[2]" --value $rest[3] --type SecureString --region (__r_aws_region)
    end
end

function __r_get_env_config --argument env_short
    if not functions -q __r_env_config
        echo "r: no environment config found." >&2
        echo "r: create ~/.config/fish/conf.d/r.local.fish from fish/conf.d/r.local.fish.example" >&2
        return 1
    end
    set -l config (__r_env_config $env_short)
    if test -z "$config"
        echo "r: unknown environment '$env_short' (define it in ~/.config/fish/conf.d/r.local.fish)" >&2
        return 1
    end
    echo $config
end

# `remotectl use` sets the region but aws-cli doesn't read it.
function __r_aws_region
    remotectl region get | string match -r '\S+$'
end

function __r_show_usage
    echo "Usage:"
    echo "  r [psql|iex|login] [stg|sand|prod]"
    echo "  r iex review APP_NAME"
    echo "  r get-param [stg|sand|prod] SERVICE PARAM_NAME"
    echo "  r set-param [stg|sand|prod] SERVICE PARAM_NAME VALUE"
    echo ""
    echo "Each command updates remotectl, runs 'remotectl use ENV' (AWS login,"
    echo "region, kubectl context), then runs the requested command."
    echo "SSM parameter paths are /{env}/{service}/PARAM_NAME."
end

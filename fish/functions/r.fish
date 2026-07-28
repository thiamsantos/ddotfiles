function r --description "Connect to remote environments (staging, sandbox, production)"
    if test (count $argv) -lt 2
        __r_show_usage >&2
        return 1
    end

    set -l cmd $argv[1]
    set -l env $argv[2]

    if not contains $cmd psql iex login set-param get-param
        __r_show_usage >&2
        return 1
    end

    # The 'review' env targets ephemeral review-app deployments and requires an
    # app (k8s deploy) name as the next argument.
    set -l app_name
    if test "$env" = review
        if test "$cmd" != iex
            echo "Error: the 'review' env is only supported with iex: r iex review APP_NAME" >&2
            return 1
        end
        if test (count $argv) -ne 3
            echo "Error: iex review requires: r iex review APP_NAME" >&2
            return 1
        end
        set app_name $argv[3]
    else
        switch $cmd
            case psql iex login
                if test (count $argv) -ne 2
                    __r_show_usage >&2
                    return 1
                end
            case get-param
                if test (count $argv) -ne 4
                    echo "Error: get-param requires: r get-param [stg|sand|prod] SERVICE PARAM_NAME" >&2
                    return 1
                end
            case set-param
                if test (count $argv) -ne 5
                    echo "Error: set-param requires: r set-param [stg|sand|prod] SERVICE PARAM_NAME VALUE" >&2
                    return 1
                end
        end
    end

    if not contains $env stg sand prod review
        __r_show_usage >&2
        return 1
    end

    set -l config (__r_get_env_config $env); or return 1
    __r_setup_env (string split " " $config)

    if test "$env" = review
        __r_execute_cmd $cmd (string split " " $config) $app_name
    else if test $cmd != login
        __r_execute_cmd $cmd (string split " " $config) $argv[3..-1]
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

function __r_setup_env
    set -l env_name $argv[1]
    set -l region $argv[2]
    set -l role $argv[3]
    set -l cluster_name $argv[4]
    set -l cluster_region $argv[5]

    echo "Setting up $env_name environment..."
    remotectl aws login $env_name --region $region --role $role
    aws eks update-kubeconfig --name $cluster_name --region $cluster_region
end

function __r_execute_cmd
    set -l cmd $argv[1]
    set -l env_name $argv[2]
    set -l region $argv[3]
    set -l role $argv[4]
    set -l cluster_name $argv[5]
    set -l cluster_region $argv[6]
    set -l app $argv[7]
    set -l pod $argv[8]
    set -l release_bin $argv[9]
    set -l service $argv[10]
    set -l param_name $argv[11]
    set -l param_value $argv[12]

    switch $cmd
        case psql
            echo "Connecting to $env_name PostgreSQL..."
            remotectl portforward $app --region $region -e $env_name --role $role --login --use-context --psql
        case iex
            if test -n "$service"
                # Review app: $service holds the target deploy name. Exec into the
                # running pod and attach to the live node with the release's `remote` command.
                # Using `start_iex` here boots a second BEAM in the existing pod
                # and gets OOM-killed (exit 137).
                echo "Connecting to IEx on review app $service ($env_name)..."
                remotectl k8s shell $service --region $region -e $env_name --role $role --login --use-context -- $release_bin remote
            else
                echo "Starting IEx shell on $env_name..."
                remotectl k8s shell $pod -m 4Gi --region $region -e $env_name --role $role --login --use-context -- $release_bin start_iex
            end
        case get-param
            set -l ssm_path "/$env_name/$service/$param_name"
            echo "Getting parameter $ssm_path from $env_name..."
            aws ssm get-parameter --name $ssm_path --with-decryption --region $cluster_region
        case set-param
            set -l ssm_path "/$env_name/$service/$param_name"
            echo "Setting parameter $ssm_path in $env_name..."
            aws ssm put-parameter --name $ssm_path --value $param_value --type SecureString --region $cluster_region
    end
end

function __r_show_usage
    echo "Usage:"
    echo "  r [psql|iex|login] [stg|sand|prod]"
    echo "  r iex review APP_NAME"
    echo "  r [get-param|set-param] [stg|sand|prod] SERVICE PARAM_NAME [VALUE]"
    echo ""
    echo "Available commands:"
    echo "  r login stg                    - Login to staging environment"
    echo "  r login sand                   - Login to sandbox environment"
    echo "  r login prod                   - Login to production environment"
    echo "  r psql stg                     - Connect to staging PostgreSQL"
    echo "  r psql sand                    - Connect to sandbox PostgreSQL"
    echo "  r psql prod                    - Connect to production PostgreSQL"
    echo "  r iex stg                      - Start IEx shell on staging"
    echo "  r iex sand                     - Start IEx shell on sandbox"
    echo "  r iex prod                     - Start IEx shell on production"
    echo "  r iex review APP_NAME          - Start IEx shell on a review app deploy (staging)"
    echo "  r get-param stg SERVICE PARAM       - Get SSM parameter from staging/SERVICE"
    echo "  r set-param prod SERVICE PARAM VALUE - Set SSM parameter in production/SERVICE"
    echo "  (valid SERVICE names are your own; see fish/conf.d/r.local.fish.example)"
    echo ""
    echo "SSM Parameter commands automatically construct the path as: /{env}/{service}/PARAM_NAME"
    echo ""
    echo "Each command will automatically:"
    echo "  1. Login to AWS with appropriate role"
    echo "  2. Update kubeconfig for the target environment"
    echo "  3. Execute the requested command (except for 'login')"
end

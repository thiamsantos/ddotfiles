function r --description "Connect to remote environments (staging, sandbox, production)"
    if test (count $argv) -lt 2
        __r_show_usage >&2
        return 1
    end
    
    set -l cmd $argv[1]
    set -l env $argv[2]
    
    if not contains $cmd psql iex
        __r_show_usage >&2
        return 1
    end
    
    if not contains $env stg sand prod
        __r_show_usage >&2
        return 1
    end
    
    set -l config (__r_get_env_config $env)
    __r_setup_env (string split " " $config)
    __r_execute_cmd $cmd (string split " " $config)
end

function __r_get_env_config --argument env_short
    switch $env_short
        case stg
            echo staging eu REDACTED-ROLE REDACTED-CLUSTER eu-west-1
        case sand
            echo sandbox us REDACTED-ROLE REDACTED-CLUSTER us-east-1
        case prod
            echo production eu REDACTED-ROLE REDACTED-CLUSTER eu-west-1
    end
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
    
    switch $cmd
        case psql
            echo "Connecting to $env_name PostgreSQL..."
            remotectl portforward REDACTED-SERVICE --region $region -e $env_name --role $role --login --use-context --psql
        case iex
            echo "Starting IEx shell on $env_name..."
            remotectl k8s shell --region $region -e $env_name --role $role --login --use-context REDACTED-SERVICE -- REDACTED-SERVICE/bin/REDACTED-SERVICE start_iex
    end
end

function __r_show_usage
    echo "Usage: r [psql|iex] [stg|sand|prod]"
    echo ""
    echo "Available commands:"
    echo "  r psql stg   - Connect to staging PostgreSQL"
    echo "  r psql sand  - Connect to sandbox PostgreSQL"
    echo "  r psql prod  - Connect to production PostgreSQL"
    echo "  r iex stg    - Start IEx shell on staging"
    echo "  r iex sand   - Start IEx shell on sandbox"
    echo "  r iex prod   - Start IEx shell on production"
    echo ""
    echo "Each command will automatically:"
    echo "  1. Login to AWS with appropriate role"
    echo "  2. Update kubeconfig for the target environment"
    echo "  3. Execute the requested command"
end


function fish_prompt 
    set -g fish_prompt_pwd_dir_length 0
    string join '' -- \
        (set_color blue) (prompt_pwd) \
        (set_color cyan) (fish_vcs_prompt) \
        (set_color normal) \n '> '
end
return {
  {
    "ibhagwan/fzf-lua",
    keys = {
      {
        "<leader><leader>",
        function()
          local fzf = require("fzf-lua")
          -- Prefer git files; fall back to all files outside a git repo.
          if vim.fn.isdirectory(".git") == 1 or vim.fn.systemlist("git rev-parse --is-inside-work-tree 2>/dev/null")[1] == "true" then
            fzf.git_files({ cmd = "git ls-files --exclude-standard --cached --others" })
          else
            fzf.files()
          end
        end,
        desc = "Find files (git-aware)",
      },
      {
        "<leader>ff",
        function()
          require("fzf-lua").files({ cwd = vim.fn.expand("%:p:h") })
        end,
        desc = "Files in current buffer dir",
      },
      {
        "<leader>s.",
        function()
          require("fzf-lua").live_grep({ cwd = vim.fn.expand("%:p:h") })
        end,
        desc = "Live grep in current buffer dir",
      },
    },
  },
  {
    -- Don't auto-open a file-explorer side panel. By default snacks replaces
    -- netrw and opens its explorer when nvim starts on a directory; disabling
    -- replace_netrw keeps the explorer closed unless explicitly invoked.
    "folke/snacks.nvim",
    opts = {
      explorer = { replace_netrw = false },
    },
  },
  {
    -- Use the classic bottom command line instead of noice's floating popup.
    -- noice stays enabled for messages/LSP; only the cmdline rendering changes.
    "folke/noice.nvim",
    opts = {
      cmdline = {
        view = "cmdline", -- classic cmdline at the bottom (not the floating popup)
        format = {
          -- Drop the leading glyphs (we run a text-only UI).
          cmdline = { icon = ":" },
          search_down = { icon = "/" },
          search_up = { icon = "?" },
        },
      },
      presets = {
        command_palette = false, -- don't float/center the cmdline + completion
      },
    },
  },
}

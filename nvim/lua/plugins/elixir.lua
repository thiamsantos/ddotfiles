return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      -- Turn off the elixir Extra's language servers; we use dexter instead.
      servers = {
        elixirls = { enabled = false },
        nextls = { enabled = false },
        lexical = { enabled = false },
        dexter = {
          -- dexter is installed via mise/brew, not Mason.
          mason = false,
          cmd = { "dexter", "lsp" },
          filetypes = { "elixir", "eelixir", "heex" },
          root_markers = { ".dexter/dexter.db", ".dexter.db", "mix.exs", ".git" },
        },
      },
      setup = {
        -- Register the dexter config name with Neovim's built-in LSP before setup.
        dexter = function(_, opts)
          vim.lsp.config("dexter", {
            cmd = opts.cmd,
            filetypes = opts.filetypes,
            root_markers = opts.root_markers,
          })
          vim.lsp.enable("dexter")
          return true -- prevent lspconfig from also setting it up
        end,
      },
    },
  },
}

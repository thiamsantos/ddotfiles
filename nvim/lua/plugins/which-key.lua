return { -- Useful plugin to show you pending keybinds.
  'folke/which-key.nvim',
  event = 'VimEnter', -- Sets the loading event to 'VimEnter'
  opts = {
    -- delay between pressing a key and opening which-key (milliseconds)
    -- this setting is independent of vim.o.timeoutlen
    delay = 0,
    -- Document existing key chains
    spec = {
      { '<leader>b', group = '+buffer' },
      { '<leader>t', group = '+tab' },
      { '<leader>f', group = '+file' },
      { '<leader>m', group = '+local leader' },
      { '<leader>mt', group = '+tests' },
      { '<leader>g', group = '+git' },
      { '<leader>w', group = '+window' },
    },
  },
}

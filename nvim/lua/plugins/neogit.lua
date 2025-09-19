return {
  'NeogitOrg/neogit',
  dependencies = {
    'nvim-lua/plenary.nvim', 
    'sindrets/diffview.nvim',
    'nvim-telescope/telescope.nvim',
  },

  config = function()
    local neogit = require 'neogit'

    neogit.setup {
      mappings = {
        popup = {
          ['F'] = 'PullPopup',
          ['p'] = 'PushPopup',
          ['P'] = false,
        },
      },
    }
    vim.keymap.set('n', '<leader>gg', function()
      neogit.open { kind = 'replace' }
    end, { desc = 'Neogit Status' })
  end,
}

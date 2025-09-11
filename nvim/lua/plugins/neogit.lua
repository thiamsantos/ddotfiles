return {
  'NeogitOrg/neogit',
  dependencies = {
    'nvim-lua/plenary.nvim', -- required
    'sindrets/diffview.nvim', -- optional - Diff integration
    'nvim-telescope/telescope.nvim', -- optional
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
      neogit.open({ kind = 'replace' })
    end, { desc = 'Neogit Status' })
  end,
}


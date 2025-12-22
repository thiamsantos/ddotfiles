-- Adds git related signs to the gutter, as well as utilities for managing changes
-- NOTE: gitsigns is already included in init.lua but contains only the base
-- config. This will add also the recommended keyvim.keymap.sets.

return {
  {
    'lewis6991/gitsigns.nvim',
    opts = {
      signs = {
        add = { text = '+' },
        change = { text = '~' },
        delete = { text = '_' },
        topdelete = { text = '‾' },
        changedelete = { text = '~' },
      },

      on_attach = function(bufnr)
        local gitsigns = require 'gitsigns'

        vim.keymap.set('n', '<leader>gn', function()
          if vim.wo.diff then
            vim.cmd.normal { ']c', bang = true }
          else
            gitsigns.nav_hunk 'next'
          end
        end, { desc = 'Jump to next git [c]hange' })

        vim.keymap.set('n', '<leader>gp', function()
          if vim.wo.diff then
            vim.cmd.normal { '[c', bang = true }
          else
            gitsigns.nav_hunk 'prev'
          end
        end, { desc = 'Jump to previous git [c]hange' })

        vim.keymap.set('n', '<leader>gs', gitsigns.stage_hunk, { desc = 'git [s]tage hunk' })
        vim.keymap.set('n', '<leader>gr', gitsigns.reset_hunk, { desc = 'git [r]eset hunk' })
        vim.keymap.set('n', '<leader>gS', gitsigns.stage_buffer, { desc = 'git [S]tage buffer' })
        vim.keymap.set('n', '<leader>gu', gitsigns.stage_hunk, { desc = 'git [u]ndo stage hunk' })
        vim.keymap.set('n', '<leader>gR', gitsigns.reset_buffer, { desc = 'git [R]eset buffer' })
        vim.keymap.set('n', '<leader>gp', gitsigns.preview_hunk, { desc = 'git [p]review hunk' })
        vim.keymap.set('n', '<leader>gb', gitsigns.blame_line, { desc = 'git [b]lame line' })
        vim.keymap.set('n', '<leader>gd', gitsigns.diffthis, { desc = 'git [d]iff against index' })
        vim.keymap.set('n', '<leader>gD', function()
          gitsigns.diffthis '@'
        end, { desc = 'git [D]iff against last commit' })
      end,
    },
  },
}

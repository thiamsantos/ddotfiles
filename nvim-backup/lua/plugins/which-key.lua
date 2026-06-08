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
      { '<leader>f', group = '+file' },
      { '<leader>g', group = '+git' },
      { '<leader>m', group = '+local leader' },
      { '<leader>mt', group = '+tests' },
      { '<leader>s', group = '+search' },
      { '<leader>t', group = '+tab' },
      { '<leader>w', group = '+window' },
    },
  },
  config = function()
    -- Clear highlights on search when pressing <Esc> in normal mode
    --  See `:help hlsearch`
    vim.keymap.set('n', '<Esc>', '<cmd>nohlsearch<CR>')

    -- Exit terminal mode in the builtin terminal with a shortcut that is a bit easier
    -- for people to discover. Otherwise, you normally need to press <C-\><C-n>, which
    -- is not what someone will guess without a bit more experience.
    --
    -- NOTE: This won't work in all terminal emulators/tmux/etc. Try your own mapping
    -- or just use <C-\><C-n> to exit terminal mode
    vim.keymap.set('t', '<Esc><Esc>', '<C-\\><C-n>', { desc = 'Exit terminal mode' })

    -- Window Keybinds
    vim.keymap.set('n', '<leader>wh', '<C-w><C-h>', { desc = 'Move focus to the left window' })
    vim.keymap.set('n', '<leader>wl', '<C-w><C-l>', { desc = 'Move focus to the right window' })
    vim.keymap.set('n', '<leader>wj', '<C-w><C-j>', { desc = 'Move focus to the lower window' })
    vim.keymap.set('n', '<leader>wk', '<C-w><C-k>', { desc = 'Move focus to the upper window' })
    vim.keymap.set('n', '<leader>wH', '<C-w>H', { desc = 'Move window to the left' })
    vim.keymap.set('n', '<leader>wL', '<C-w>L', { desc = 'Move window to the right' })
    vim.keymap.set('n', '<leader>wJ', '<C-w>J', { desc = 'Move window to the lower' })
    vim.keymap.set('n', '<leader>wK', '<C-w>K', { desc = 'Move window to the upper' })
    vim.keymap.set('n', '<leader>wv', '<C-w>v', { desc = 'Split window vertically' })
    vim.keymap.set('n', '<leader>ws', '<C-w>s', { desc = 'Split window horizontally' })
    vim.keymap.set('n', '<leader>wq', '<C-w>q', { desc = 'Quit window' })
    vim.keymap.set('n', '<leader>w<', '<C-W><', { desc = 'Decrease window width' })
    vim.keymap.set('n', '<leader>w>', '<C-W>>', { desc = 'Increase window width' })
    vim.keymap.set('n', '<leader>w=', '<C-W>=', { desc = 'Balance all windows' })

    -- Buffer keybinds
    vim.keymap.set('n', '<leader>bk', ':bdelete<CR>', { desc = 'Buffer Kill' })
    vim.keymap.set('n', '<leader>bn', ':vnew<CR>', { desc = 'New Buffer' })

    -- Tab keybinds
    vim.keymap.set('n', '<leader>tt', ':tabnew<CR>', { desc = 'New tab' })
    vim.keymap.set('n', '<leader>tq', ':tabclose<CR>', { desc = 'Close tab' })
    vim.keymap.set('n', '<leader>tH', ':-tabmove<CR>', { desc = 'Move tab to left' })
    vim.keymap.set('n', '<leader>tL', ':+tabmove<CR>', { desc = 'Move tab to right' })
    vim.keymap.set('n', '<leader>th', ':tabprevious<CR>', { desc = 'Previous tab' })
    vim.keymap.set('n', '<leader>tl', ':tabnext<CR>', { desc = 'Next tab' })

    -- File keybinds
    vim.keymap.set('n', '<leader>fy', function()
      local path = vim.fn.expand '%:p'
      vim.fn.setreg('+', path)
      vim.notify('Yanked path: ' .. path)
    end, { desc = 'Yank file path to clipboard' })

    vim.keymap.set('n', '<leader>fY', function()
      local path = vim.fn.expand '%:.'
      vim.fn.setreg('+', path)
      vim.notify('Yanked path: ' .. path)
    end, { desc = 'Yank project file path to clipboard' })

    vim.keymap.set('n', '<leader>fD', function()
      local file = vim.fn.expand '%:p'

      vim.ui.select({ 'Yes', 'No' }, { prompt = 'Delete ' .. file .. '?' }, function(choice)
        if choice == 'Yes' then
          vim.cmd 'bdelete'
          vim.fn.delete(file)
        end
      end)
    end, { desc = 'Delete this file' })

    vim.keymap.set('n', '<leader>fs', ':w<cr>', { desc = 'Save file' })

    vim.keymap.set('n', '<leader>fS', function()
      vim.ui.input({ prompt = 'Save as: ', default = vim.fn.expand '%:p' }, function(input)
        if input and #input > 0 then
          vim.cmd('saveas ' .. vim.fn.fnameescape(input))
        end
      end)
    end, { desc = 'Save file as' })

    vim.keymap.set('n', '<leader>fR', function()
      local old = vim.fn.expand '%:p'
      vim.ui.input({ prompt = 'Rename to: ', default = old }, function(new)
        if not new or #new == 0 or new == old then
          return
        end

        -- Create parent directories if they don't exist
        local parent = vim.fn.fnamemodify(new, ':h')
        if vim.fn.isdirectory(parent) == 0 then
          vim.fn.mkdir(parent, 'p')
        end

        vim.cmd('saveas ' .. vim.fn.fnameescape(new))
        vim.fn.delete(old)
        vim.cmd('bdelete ' .. vim.fn.fnameescape(old))
      end)
    end, { desc = 'Rename/move file' })
  end,
}

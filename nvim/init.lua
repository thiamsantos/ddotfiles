-- Set <space> as the leader key
-- See `:help mapleader`
--  NOTE: Must happen before plugins are loaded (otherwise wrong leader will be used)
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- Set to true if you have a Nerd Font installed and selected in the terminal
vim.g.have_nerd_font = false

-- [[ Setting options ]]
-- See `:help vim.o`

-- Make line numbers default
vim.o.relativenumber = true

-- Enable mouse mode, can be useful for resizing splits for example!
vim.o.mouse = 'a'

-- Don't show the mode, since it's already in the status line
vim.o.showmode = false

-- Sync clipboard between OS and Neovim.
--  Schedule the setting after `UiEnter` because it can increase startup-time.
--  Remove this option if you want your OS clipboard to remain independent.
--  See `:help 'clipboard'`
vim.schedule(function()
  vim.o.clipboard = 'unnamedplus'
end)

-- Enable break indent
vim.o.breakindent = true

-- Save undo history
vim.o.undofile = true

-- Case-insensitive searching UNLESS \C or one or more capital letters in the search term
vim.o.ignorecase = true
vim.o.smartcase = true

-- Keep signcolumn on by default
vim.o.signcolumn = 'yes'

-- Decrease update time
vim.o.updatetime = 250

-- Decrease mapped sequence wait time
vim.o.timeoutlen = 300

-- Configure how new splits should be opened
vim.o.splitright = true
vim.o.splitbelow = true

-- Sets how neovim will display certain whitespace characters in the editor.
--  See `:help 'list'`
--  and `:help 'listchars'`
--
--  Notice listchars is set using `vim.opt` instead of `vim.o`.
--  It is very similar to `vim.o` but offers an interface for conveniently interacting with tables.
--   See `:help lua-options`
--   and `:help lua-options-guide`
vim.o.list = true
vim.opt.listchars = { tab = '» ', trail = '·', nbsp = '␣' }

-- Preview substitutions live, as you type!
vim.o.inccommand = 'split'

-- Show which line your cursor is on
vim.o.cursorline = true

-- Minimal number of screen lines to keep above and below the cursor.
vim.o.scrolloff = 10

-- if performing an operation that would fail due to unsaved changes in the buffer (like `:q`),
-- instead raise a dialog asking if you wish to save the current file(s)
-- See `:help 'confirm'`
vim.o.confirm = true

vim.filetype.add {
  pattern = {
    ['^Brewfile$'] = 'ruby',
  },
}

-- Automatically create parent directories when saving a new file
vim.api.nvim_create_autocmd('BufWritePre', {
  group = vim.api.nvim_create_augroup('AutoCreateParentDirs', { clear = true }),
  pattern = '*',
  callback = function(ctx)
    local dir = vim.fn.fnamemodify(ctx.file, ':p:h')
    if not vim.fn.isdirectory(dir) then
      vim.fn.mkdir(dir, 'p')
    end
  end,
})

vim.api.nvim_create_autocmd('ColorScheme', {
  group = vim.api.nvim_create_augroup('CustomNeogitDiff', { clear = true }),
  callback = function()
    local colors = require('dracula').colors()
    local groups = {
      NeogitDiffAdd = { fg = colors.bright_green, bg = colors.menu },
      NeogitDiffDelete = { fg = colors.bright_red, bg = colors.menu },
      NeogitDiffContext = { fg = colors.comment, bg = colors.visual },

      NeogitDiffAddHighlight = { fg = colors.green, bg = colors.bg },
      NeogitDiffDeleteHighlight = { fg = colors.red, bg = colors.bg },
      NeogitDiffContextHighlight = { fg = colors.comment, bg = colors.visual },

      NeogitDiffAddCursor = { fg = colors.green, bg = colors.selection },
      NeogitDiffDeleteCursor = { fg = colors.red, bg = colors.selection },
      NeogitDiffContextCursor = { fg = colors.comment, bg = colors.selection },
    }
    for group, setting in pairs(groups) do
      vim.api.nvim_set_hl(0, group, setting)
    end
  end,
})

-- [[ Install `lazy.nvim` plugin manager ]]
--    See `:help lazy.nvim.txt` or https://github.com/folke/lazy.nvim for more info
local lazypath = vim.fn.stdpath 'data' .. '/lazy/lazy.nvim'
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = 'https://github.com/folke/lazy.nvim.git'
  local out = vim.fn.system { 'git', 'clone', '--filter=blob:none', '--branch=stable', lazyrepo, lazypath }
  if vim.v.shell_error ~= 0 then
    error('Error cloning lazy.nvim:\n' .. out)
  end
end

local rtp = vim.opt.rtp
rtp:prepend(lazypath)

require('lazy').setup {
  'NMAC427/guess-indent.nvim',
  require 'plugins.telescope',
  require 'plugins.conform',
  require 'plugins.indent_line',
  require 'plugins.neogit',
  require 'plugins.dracula',
  require 'plugins.lint',
  require 'plugins.autopairs',
  require 'plugins.gitsigns',
  require 'plugins.which-key',
  require 'plugins.treesitter',
  require 'plugins.blink-cmp',
  require 'plugins.mini',
  require 'plugins.lsp',
  {
    'nmac427/guess-indent.nvim',
    config = function()
      require('guess-indent').setup()
    end,
  },
  {
    'declancm/maximize.nvim',
    config = function()
      vim.keymap.set('n', '<leader>wo', require('maximize').toggle, { desc = 'Maximize window' })
    end,
  },
  {
    'rgroli/other.nvim',
    config = function()
      require('other-nvim').setup {
        mappings = {
          'elixir',
        },
      }

      vim.keymap.set('n', '<leader>mtt', ':Other<CR>', { desc = 'Open alternative file' })
      vim.keymap.set('n', '<leader>mtT', ':OtherVSplit<CR>', { desc = 'Open alternative file in other window' })
    end,
  },

  {
    'vim-test/vim-test',
    config = function()
      vim.g['test#strategy'] = 'neovim_sticky'
      vim.g['test#neovim#term_position'] = 'vert'
      vim.g['test#neovim_sticky#reopen_window'] = 1

      vim.keymap.set('n', '<leader>mtv', ':w | TestFile<CR>', { desc = 'Run tests for the current file' })
      vim.keymap.set('n', '<leader>mts', ':w | TestNearest<CR>', { desc = 'Run the nearest test' })
      vim.keymap.set('n', '<leader>mta', ':TestSuite<CR>', { desc = 'Run all tests' })
      vim.keymap.set('n', '<leader>mtr', ':TestLast<CR>', { desc = 'Re-run the last test' })
    end,
  },

  {
    'm4xshen/hardtime.nvim',
    lazy = false,
    dependencies = { 'MunifTanjim/nui.nvim' },
    opts = {
      restricted_keys = {
        ['h'] = false,
        ['j'] = false,
        ['k'] = false,
        ['l'] = false,
      },
    },
  },
  { 'folke/todo-comments.nvim', event = 'VimEnter', dependencies = { 'nvim-lua/plenary.nvim' }, opts = { signs = false } },
  {
    'rcarriga/nvim-notify',
    config = function()
      local notify = require 'notify'
      notify.setup {
        render = 'minimal',
      }

      -- Make it the default notification handler
      vim.notify = notify
    end,
  },
}

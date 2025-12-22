return {
  {
    'nvim-telescope/telescope.nvim',
    event = 'VimEnter',
    dependencies = {
      'nvim-lua/plenary.nvim',
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        build = 'make',
        cond = function()
          return vim.fn.executable 'make' == 1
        end,
      },
      { 'nvim-telescope/telescope-ui-select.nvim' },
    },
    extensions = {
      file_browser = {
        theme = 'ivy',
        -- disables netrw and use telescope-file-browser in its place
        hijack_netrw = true,
        mappings = {
          ['i'] = {
            -- your custom insert mode mappings
          },
          ['n'] = {
            -- your custom normal mode mappings
          },
        },
      },
    },
    config = function()
      require('telescope').setup {
        -- defaults = {
        --   mappings = {
        --     i = { ['<c-enter>'] = 'to_fuzzy_refine' },
        --   },
        -- },
        pickers = {
          git_files = {
            show_untracked = true,
          },
          find_files = {
            hidden = true,
          },
          buffers = {
            sort_mru = true,
          },
        },
        extensions = {
          ['ui-select'] = {
            require('telescope.themes').get_dropdown(),
          },
        },
      }

      -- Enable Telescope extensions if they are installed
      pcall(require('telescope').load_extension, 'fzf')
      pcall(require('telescope').load_extension, 'ui-select')
      pcall(require('telescope').load_extension, 'file_browser')

      local builtin = require 'telescope.builtin'

      vim.keymap.set('n', '<leader><leader>', builtin.git_files, { desc = 'Fuzzy find git files' })
      vim.keymap.set('n', '<leader>/', builtin.live_grep, { desc = '[F]iles [G]rep' })
      vim.keymap.set('n', '<leader>,', builtin.buffers, { desc = 'Find existing buffers' })

      -- Slightly advanced example of overriding default behavior and theme
      vim.keymap.set('n', '/', function()
        -- You can pass additional configuration to Telescope to change the theme, layout, etc.
        builtin.current_buffer_fuzzy_find(require('telescope.themes').get_dropdown {
          winblend = 10,
          previewer = false,
        })
      end, { desc = '[/] Fuzzily search in current buffer' })

      vim.keymap.set('n', '<leader>s.', function()
        local current_file = vim.api.nvim_buf_get_name(0)

        -- :p - make it a full path
        -- :h - get the head (directory) of the path
        local current_dir = vim.fn.fnamemodify(current_file, ':p:h')

        if current_dir == '' then
          current_dir = vim.fn.getcwd()
        end

        builtin.live_grep {
          search_dirs = { current_dir },
          prompt_title = 'LIVE GREP: ' .. current_dir,
        }
      end, { desc = 'Live grep in current buffer dir' })
    end,
  },
  {
    'nvim-telescope/telescope-file-browser.nvim',
    dependencies = { 'nvim-telescope/telescope.nvim', 'nvim-lua/plenary.nvim' },
    config = function()
      vim.keymap.set('n', '<space>.', ':Telescope file_browser path=%:p:h select_buffer=true<CR>', { desc = 'Browser files in current buffer directory' })
      vim.keymap.set('n', '<space>ff', function()
        require('telescope').extensions.file_browser.file_browser {
          hidden = { file_browser = true, folder_browser = true },
          respect_gitignore = false,
        }
      end, { desc = 'Explore files' })
    end,
  },
}

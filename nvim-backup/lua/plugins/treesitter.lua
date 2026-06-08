return { -- Highlight, edit, and navigate code
  'nvim-treesitter/nvim-treesitter',
  branch = 'main', -- the rewritten branch; works with Neovim 0.12+
  lazy = false, -- main branch does not support lazy-loading
  build = ':TSUpdate',
  config = function()
    -- Parsers to keep installed. `markdown_inline` is an injection parser
    -- (no filetype of its own) but is needed for fenced code blocks.
    local parsers = {
      'css',
      'bash',
      'c',
      'diff',
      'html',
      'lua',
      'luadoc',
      'markdown',
      'markdown_inline',
      'query',
      'vim',
      'vimdoc',
      'elixir',
      'fish',
      'typescript',
      'yaml',
      'json',
    }

    require('nvim-treesitter').setup()
    require('nvim-treesitter').install(parsers)

    -- Enable treesitter highlighting + indentation for the filetypes that map
    -- to the parsers above. Highlighting itself is provided by Neovim core.
    local filetypes = {
      'css',
      'sh', -- bash
      'c',
      'diff',
      'html',
      'lua',
      'markdown',
      'query',
      'vim',
      'help', -- vimdoc
      'elixir',
      'eelixir',
      'heex',
      'fish',
      'typescript',
      'yaml',
      'json',
    }

    vim.api.nvim_create_autocmd('FileType', {
      group = vim.api.nvim_create_augroup('TreesitterStart', { clear = true }),
      pattern = filetypes,
      callback = function()
        -- Guard in case a parser is not (yet) installed.
        local ok = pcall(vim.treesitter.start)
        if ok then
          vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end
      end,
    })
  end,
}

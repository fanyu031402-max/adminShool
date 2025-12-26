const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  configureWebpack: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src-shared'),
        'path': 'path-browserify'  // Web 端兼容 path
      },
      fallback: {
        'crypto': require.resolve('crypto-browserify'),
        'stream': require.resolve('stream-browserify'),
        'process': require.resolve('process/browser'),
        // 解决 asn1.js 对 Node 内置 vm 模块的依赖
        'vm': require.resolve('vm-browserify')
      }
    }
  },
  chainWebpack(config) {
    // 删除预加载和预获取插件以优化打包
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')

    // 添加 process polyfill
    config.plugin('provide-process')
      .use(webpack.ProvidePlugin, [{
        process: 'process/browser'
      }])

    // 配置 SVG 图标处理
    config.module
      .rule('svg')
      .exclude.add(path.resolve('./src/icons'))
      .end()

    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(path.resolve('./src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ symbolId: 'icon-[name]' })
      .end()

    // 优化代码分割，减少 ChunkLoadError
    config.optimization.splitChunks({
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: 5,
          chunks: 'initial',
          reuseExistingChunk: true
        }
      }
    })
  },
  devServer: {
    hot: true,
    client: {
      overlay: false
    }
  }
})

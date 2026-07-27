const config = require('./config')

module.exports = {
  assetsDir: 'static',
  transpileDependencies: ["highcharts","axios","html2canvas","jspdf","fast-png","fflate","iobuffer"],
  productionSourceMap: process.env.NODE_ENV !== 'production',
  lintOnSave: true,
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          // 输出风格改为 expanded (避免伪元素中的字符被转义）
          outputStyle: "expanded",
        },
      },
      postcss: {
        plugins: [
          //postcss-pxtorem 版本必须为5.1.1 否则会报错
          require("postcss-pxtorem")({
            rootValue: 16, // 指定转换倍率，我现在设置这个表示1rem=16px;
            minPixelValue: 1, // 需要转换的最小值，一般1px像素不转换，以上才转换
            selectorBlackList: [".el"], // 匹配不被转换为rem的选择器
            mediaQuery: false, // 允许在媒体查询中转换px
          }),
        ],
      },
    },
  },
  devServer: {
     proxy: {
      '/cors': {
        target: `http://glxj.dev.internal.virtueit.net:82/v1/deeproadbackend/api`, // 接口域名
        // target: `http://${config.__PROJECT}.dev.internal.virtueit.net:81`, // 接口域名
        secure: false, // 如果是https接口，需要配置这个参数
        changeOrigin: true, // 是否跨域
        pathRewrite: {
          '^/cors': '/'
        }
      },
      '/lumianApi': {
        target: `http://glxj.dev.internal.virtueit.net:82/v1-snapshot/lumian`, // 接口域名
        secure: false, // 如果是https接口，需要配置这个参数
        changeOrigin: true, // 是否跨域
        pathRewrite: {
          '^/lumianApi': '/'
        }
      },
      
    }
  },
  publicPath: config.publicPath,
  // outputDir: "vis",
};

import Vue from 'vue'
import App from './App.vue'
import router from './router/index.js'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './styles/common.less'

// 自定义全局组件
import './icons'
import './icons/SvgIcon'

// 网络请求
import axios from 'axios'
import VueAxios from 'vue-axios'

// 状态管理
import store from './store/index'

// 全局组件
import AlarmPopup from './components/AlarmPopup'

// 挂载 store 到 Vue 原型
Vue.prototype.$store = store

// 注册全局组件
Vue.component('alarm-popup', AlarmPopup)

// 使用插件
Vue.use(ElementUI)
Vue.use(VueAxios, axios)

// 生产环境关闭提示
Vue.config.productionTip = false

// 全局错误处理 - 处理 ChunkLoadError
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue Global Error:', err, info)
  
  // 处理 ChunkLoadError
  if (err.name === 'ChunkLoadError' || err.message.includes('Loading chunk')) {
    console.warn('检测到 ChunkLoadError，尝试刷新页面...')
    // 延迟刷新，避免无限循环
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    return
  }
  
  // 其他错误的处理
  if (vm && vm.$message) {
    vm.$message.error('应用发生错误，请刷新页面重试')
  }
}

// 处理未捕获的 Promise 错误
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise Rejection:', event.reason)
  
  // 处理路由相关的 ChunkLoadError
  if (event.reason && (
    event.reason.name === 'ChunkLoadError' || 
    event.reason.message.includes('Loading chunk')
  )) {
    console.warn('检测到路由 ChunkLoadError，尝试刷新页面...')
    event.preventDefault() // 阻止默认的错误处理
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
})

// 创建 Vue 实例
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

import store from '@/store'
import Vue from 'vue'
import Router from 'vue-router'
import { nimLogin } from '@/utils/imUtil'
import { hasServerConfig } from '@/utils/serverConfig'

// 直接导入所有组件，避免 ChunkLoadError
// 这样所有组件在应用启动时就会加载，不会出现动态加载失败的问题
import ServerConfig from '../views/ServerConfig/ServerConfig.vue'
import Login from '../views/Login/Login.vue'
import Dashboard from '../views/Dashboard/Dashboard.vue'
import Devices from '../views/Device/Devices.vue'
import DeviceDetail from '../views/Device/DeviceDetail.vue'
import EventList from '../views/Event/EventList.vue'
import EventDetails from '../views/Event/EventDetails.vue'
import Settings from '../views/Setting/Settings.vue'
import Main from '../views/Main/Main.vue'
import Agreement from '../views/Agreement/index.vue'

Vue.use(Router)

const routes = [
  {
    path: '/',
    redirect: '/server-config',
    meta: { requiresAuth: false }
  },
  {
    path: '/server-config',
    name: 'ServerConfig',
    component: ServerConfig,
    meta: { guestOnly: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/agreement',
    name: 'Agreement',
    component: Agreement,
    meta: { 
      requiresAuth: false,
      title: '用户协议'
    }
  },
  {
    path: '/main',
    component: Main,
    meta: { showMenu: true },
    children: [
      {
        path: '/dashboard',
        component: Dashboard,
        meta: {
          requiresAuth: true,
          title: '首页',
          showMenu: true,
          icon: 'el-icon-house'
        }
      },
      {
        path: '/devices',
        component: Devices,
        meta: {
          requiresAuth: true,
          title: '设备管理',
          showMenu: true,
          icon: 'el-icon-monitor'
        }
      },
      {
        path: '/devices/:id',
        component: DeviceDetail,
        meta: {
          requiresAuth: true,
          title: '设备详情'
        },
        props: true
      },
      {
        path: '/events',
        name: 'events',
        component: EventList,
        meta: {
          requiresAuth: true,
          title: '事件管理',
          showMenu: true,
          icon: 'el-icon-tickets'
        }
      },
      {
        path: '/events/:id',
        component: EventDetails,
        meta: {
          requiresAuth: true,
          title: '事件详情'
        },
        props: true
      },
      {
        path: '/settings',
        component: Settings,
        meta: {
          requiresAuth: true,
          title: '个人设置',
          showMenu: true,
          icon: 'el-icon-setting'
        }
      }
    ]
  },
  // 404 页面重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = new Router({
  mode: 'hash',
  routes: routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.state.token

  // 设置页面标题（包含版本号）
  const appVersion = require('../../package.json').version
  if (to.meta.title) {
    // document.title = `${to.meta.title} - CX管理系统 v${appVersion}`
    document.title = `校园防欺凌管理系统`
  }

  // 检查服务器配置，如果没有配置且不是访问配置页，则跳转到配置页
  if (to.path !== '/server-config' && !hasServerConfig()) {
    next('/server-config')
    return
  }

  // 已登录用户访问登录页，清除登录信息
  if (isAuthenticated) {
    if (to.meta.guestOnly) {
      store.commit('SET_TOKEN', '')
      store.commit('SET_USERNAME', '')
      store.commit('SET_COMPANY_ID', '')
      store.commit('SET_USER_ID', '')
      store.commit('SET_REALTIMEEVENT', [])
      next()
      return
    } else {
      // 获取用户信息
      store.dispatch('getUserInfo').then(res => {
        store.commit('SET_USER_ID', res.data.id)
        store.commit('SET_COMPANY_TYPE', res.data.company.type)
        store.commit('SET_COMPANY_ID', res.data.company.id)
        store.commit('SET_VOICE', res.data.company.setting.is_sound)
        store.commit('SET_YX_ACCID', res.data.yx_accid)
        store.commit('SET_YX_TOKEN', res.data.yx_token)
        store.commit('SET_ONLINE', res.data.company.setting.is_online_wx)
        store.commit('SET_URL', res.data.company.url)
        store.commit('SET_BDID', res.data.bd_user_id)
        store.commit('SET_RTC_SHOW', res.data.company.setting.is_real_time_im)
        store.commit('SET_SOUND', res.data.company.setting.sound_type)
        store.commit('SET_VOICE', res.data.company.setting.is_sound)
        store.commit("SET_SIPID", res.data.sip_id);
        nimLogin(res.data.yx_accid, res.data.yx_token)
        next()
      }).catch(err => {
        console.error('获取用户信息失败:', err)
        next('/login')
      })
      return
    }
  } else {
    // 未登录用户
    if (to.path === '/login' || to.path === '/server-config' || to.path === '/agreement') {
      next()
    } else {
      next('/login')
    }
    return
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('Router Error:', error)
  
  // 处理 ChunkLoadError
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    console.warn('路由 ChunkLoadError，尝试刷新页面...')
    // 显示用户友好的提示
    if (Vue.prototype.$message) {
      Vue.prototype.$message.warning('页面加载失败，正在刷新...')
    }
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }
})

// 修复路由 push 重复导航错误
const VueRouterPush = Router.prototype.push
Router.prototype.push = function push(to) {
  return VueRouterPush.call(this, to).catch(err => err)
}

export default router
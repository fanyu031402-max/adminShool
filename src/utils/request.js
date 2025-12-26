import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'
import Vue from 'vue'
import { getBaseURL, getServiceType } from '@/utils/serverConfig'

// 优先使用配置的服务器地址，如果没有配置则使用环境变量
const BASEURL = getBaseURL() || process.env.VUE_APP_API || ''

const service = axios.create({
  baseURL: BASEURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 动态更新baseURL的函数
export function updateBaseURL() {
  const newBaseURL = getBaseURL() || process.env.VUE_APP_API || ''
  service.defaults.baseURL = newBaseURL
}


/**
 * 请求拦截器
 * 在发送请求之前添加 token 等认证信息。
 * 如果是本地服务，统一为接口路径添加 /v1 前缀；线上服务保持原样。
 */
service.interceptors.request.use(
  config => {
    const token = Vue.prototype.$store.state.token
    if (token) {
      config.headers['aibabel-access-token2'] = token
    }
    
    // 本地服务统一为接口路径添加 /v1 前缀；线上服务保持原样
    if (getServiceType() !== 'online' && config.url) {
      const isAbsolute = config.url.startsWith('http://') || config.url.startsWith('https://')
      if (!isAbsolute) {
        if (config.url.startsWith('/v1/')) {
          // 已经以 /v1 开头，不需要重复添加
        } else if (config.url.startsWith('/')) {
          // 相对路径，添加 /v1 前缀
          config.url = '/v1' + config.url
        } else {
          // 没有以 / 开头，先加 / 再加 /v1
          config.url = '/v1/' + config.url
        }
      }
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)




/**
 * 响应拦截器
 * 统一处理响应数据和错误
 */
service.interceptors.response.use(
  response => {
    if (response.status === 200) {
      const data = response.data
      if (data.code !== 0) {
        if (data.code === 2001) {
          router.push('/login')
          Message.error('token失效，请重新登录！')
        } else {
          Message.error(data.msg || '请求失败')
        }
        return Promise.reject(data)
      }
      return response
    }
    return Promise.reject(response)
  },
  error => {
    // 处理网络请求错误
    if (error && error.response) {
      switch (error.response.status) {
        case 404:
        case 504:
          error.message = '请求出错(404)'
          break
        case 500:
          error.message = '服务器错误(500)'
          break
        case 403:
          error.message = '权限不足,请联系管理员!'
          break
        default:
          error.message = `连接出错(${error.response.status})!`
          break
      }
      Message.error(error.message)
    } else {
      if (error.message === 'Network Error') {
        Message.error('网络出错,请稍后重试!')
        router.push('/login')
      } else {
        Message.error('请求失败，请稍后重试')
      }
    }
    return Promise.reject(error)
  }
)

export default service

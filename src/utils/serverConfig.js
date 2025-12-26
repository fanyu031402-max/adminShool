/**
 * 服务器配置管理工具
 * 用于管理API服务器的协议、IP和端口配置
 */

const STORAGE_KEY = 'server_config'

/**
 * 获取默认配置
 */
function getDefaultConfig() {
  return {
    serviceType: 'online', // 'online' 或 'local'
    protocol: 'http',
    ip: '192.168.1.226',
    port: '18001'
  }
}

/**
 * 获取服务器配置
 */
export function getServerConfig() {
  try {
    const configStr = localStorage.getItem(STORAGE_KEY)
    if (configStr) {
      return JSON.parse(configStr)
    }
  } catch (e) {
    console.error('读取服务器配置失败:', e)
  }
  return getDefaultConfig()
}

/**
 * 保存服务器配置
 */
export function saveServerConfig(config) {
  try {
    const configToSave = {
      serviceType: config.serviceType || 'online',
      protocol: config.protocol || 'http',
      ip: config.ip || 'localhost',
      port: config.port || '8080'
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave))
    return true
  } catch (e) {
    console.error('保存服务器配置失败:', e)
    return false
  }
}

/**
 * 获取完整的API基础URL
 * 如果服务类型是线上，使用环境变量；如果是本地，使用本地配置。
 * - 如果配置的是 IP 且有端口：protocol://ip:port
 * - 如果配置的是域名（或已经自带端口的域名）：protocol://domain
 */
export function getBaseURL() {
  const config = getServerConfig()
  
  // 如果服务类型是线上服务，使用环境变量配置
  if (config.serviceType === 'online') {
    // 使用环境变量中的 API 地址（根据 NODE_ENV 自动选择）
    return process.env.VUE_APP_API || ''
  }
  
  // 如果服务类型是本地服务，使用本地配置
  const host = config.ip || ''
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(host)

  // 如果是纯 IP 并且配置了端口，则带端口；
  // 如果是域名（或已经带端口的域名），则不再额外拼接端口
  if (isIP && config.port) {
    return `${config.protocol}://${host}:${config.port}`
  }
  return `${config.protocol}://${host}`
}

/**
 * 获取服务类型
 * @returns {string} 'online' 或 'local'
 */
export function getServiceType() {
  const config = getServerConfig()
  return config.serviceType || 'online'
}

/**
 * 检查配置是否存在
 */
export function hasServerConfig() {
  return !!localStorage.getItem(STORAGE_KEY)
}

/**
 * 清除服务器配置
 */
export function clearServerConfig() {
  localStorage.removeItem(STORAGE_KEY)
}



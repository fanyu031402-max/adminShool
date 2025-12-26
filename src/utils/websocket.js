// src/utils/websocket.js
class AlarmSocket {
    constructor(url) {
      this.ws = null          // WebSocket实例
      this.url = url          // 服务端地址
      this.reconnectCount = 0 // 当前重连次数
      this.maxReconnect = 5   // 最大重连次数
      this.listeners = new Set() // 事件监听器集合
      this.pingInterval = 30000 // 心跳间隔(30秒)
    }
  
    /**
     * 建立WebSocket连接
     */
    connect() {
      // 创建WebSocket实例
      this.ws = new WebSocket(this.url)
      console.log(this.url,'this.url')
  
      // 连接成功回调
      this.ws.onopen = () => {
        console.log('WebSocket连接建立成功')
        this.reconnectCount = 0 // 重置重连计数器
        this.sendAuthToken()     // 发送认证信息
        this.startHeartbeat()    // 启动心跳检测
      }
  
      // 接收消息处理
      this.ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data)
          console.log(type,'event')
          // 分发告警消息
          if (type === 'event') this.dispatchAlarm(payload)
          // 响应服务端心跳
          if (type === 'heartbeat') this.resetHeartbeat()
        } catch (error) {
          console.error('消息解析失败:', error)
        }
      }
  
      // 连接关闭处理
      this.ws.onclose = () => {
        console.log('WebSocket连接关闭')
        this.handleDisconnect()
      }
  
      // 错误处理
      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        this.handleDisconnect()
      }
    }
  
    /**
     * 发送认证令牌
     */
    sendAuthToken() {
      const token = localStorage.getItem('jwt')
      this.send({
        type: 'login',
        token: 'OMSRA-c63f777d-a5e1-45db-af6e-f9340eea1cb4'
      })
    }
  
    /**
     * 启动心跳检测
     */
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        if (this.isConnected()) {
          this.send({ type: "heartbeat", token: 'OMSRA-c63f777d-a5e1-45db-af6e-f9340eea1cb4' })
        }
      }, this.pingInterval)
    }
  
    /**
     * 处理连接断开
     */
    handleDisconnect() {
      clearInterval(this.heartbeatTimer)
      // 指数退避重连策略
      if (this.reconnectCount < this.maxReconnect) {
        const delay = Math.pow(2, this.reconnectCount) * 1000
        setTimeout(() => {
          this.reconnectCount++
          console.log(`尝试第${this.reconnectCount}次重连...`)
          this.connect()
        }, delay)
      }
    }
  
    /**
     * 分发告警事件
     */
    dispatchAlarm(payload) {
      this.listeners.forEach(callback => callback(payload))
    }
  
    // 工具方法
    isConnected() {
      return this.ws?.readyState === WebSocket.OPEN
    }
  
    send(data) {
      if (this.isConnected()) {
        this.ws.send(JSON.stringify(data))
      }
    }
  
    // 公共接口
    addListener(callback) {
      this.listeners.add(callback)
    }
  
    removeListener(callback) {
      this.listeners.delete(callback)
    }
  }
  
  // 导出单例实例
  export default new AlarmSocket('ws://192.168.1.226:18001/v1/ws')
  
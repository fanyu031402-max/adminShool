/**
 * WebSocket 连接管理器
 * 用于统一管理 WebSocket 连接状态，避免状态冲突导致的 ChunkLoadError
 */

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 2000;
  }

  /**
   * 创建或获取 WebSocket 连接
   * @param {string} key - 连接标识
   * @param {string} url - WebSocket URL
   * @param {Object} options - 连接选项
   * @returns {WebSocket}
   */
  getConnection(key, url, options = {}) {
    if (this.connections.has(key)) {
      const existing = this.connections.get(key);
      if (existing.readyState === WebSocket.OPEN) {
        console.log(`WebSocketManager: 复用现有连接 ${key}`);
        return existing;
      } else {
        console.log(`WebSocketManager: 清理无效连接 ${key}`);
        this.closeConnection(key);
      }
    }

    console.log(`WebSocketManager: 创建新连接 ${key} -> ${url}`);
    const ws = new WebSocket(url);
    
    // 设置事件处理器
    ws.onopen = (event) => {
      console.log(`WebSocketManager: 连接 ${key} 已打开`);
      this.reconnectAttempts.set(key, 0);
      if (options.onOpen) options.onOpen(event);
    };

    ws.onclose = (event) => {
      console.log(`WebSocketManager: 连接 ${key} 已关闭`, event.code, event.reason);
      this.connections.delete(key);
      
      if (options.onClose) options.onClose(event);
      
      // 自动重连逻辑
      if (options.autoReconnect && !event.wasClean) {
        this.handleReconnect(key, url, options);
      }
    };

    ws.onerror = (event) => {
      console.error(`WebSocketManager: 连接 ${key} 发生错误`, event);
      if (options.onError) options.onError(event);
    };

    ws.onmessage = (event) => {
      if (options.onMessage) options.onMessage(event);
    };

    this.connections.set(key, ws);
    return ws;
  }

  /**
   * 处理重连逻辑
   * @param {string} key - 连接标识
   * @param {string} url - WebSocket URL
   * @param {Object} options - 连接选项
   */
  handleReconnect(key, url, options) {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.warn(`WebSocketManager: 连接 ${key} 达到最大重连次数`);
      return;
    }

    this.reconnectAttempts.set(key, attempts + 1);
    
    setTimeout(() => {
      console.log(`WebSocketManager: 重连 ${key} (第 ${attempts + 1} 次)`);
      this.getConnection(key, url, options);
    }, this.reconnectDelay * Math.pow(2, attempts)); // 指数退避
  }

  /**
   * 关闭指定连接
   * @param {string} key - 连接标识
   */
  closeConnection(key) {
    if (this.connections.has(key)) {
      const ws = this.connections.get(key);
      console.log(`WebSocketManager: 主动关闭连接 ${key}`);
      ws.close(1000, 'Manual close');
      this.connections.delete(key);
      this.reconnectAttempts.delete(key);
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections() {
    console.log('WebSocketManager: 关闭所有连接');
    for (const [key, ws] of this.connections) {
      ws.close(1000, 'Cleanup');
    }
    this.connections.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * 获取连接状态
   * @param {string} key - 连接标识
   * @returns {number|null} WebSocket readyState
   */
  getConnectionState(key) {
    const ws = this.connections.get(key);
    return ws ? ws.readyState : null;
  }

  /**
   * 检查连接是否健康
   * @param {string} key - 连接标识
   * @returns {boolean}
   */
  isConnectionHealthy(key) {
    const state = this.getConnectionState(key);
    return state === WebSocket.OPEN;
  }
}

// 创建全局实例
const wsManager = new WebSocketManager();

// 页面卸载时清理所有连接
window.addEventListener('beforeunload', () => {
  wsManager.closeAllConnections();
});

export default wsManager;
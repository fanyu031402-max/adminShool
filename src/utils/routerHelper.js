/**
 * 路由辅助工具
 * 用于处理路由导航中的 ChunkLoadError 等问题
 */

/**
 * 安全的路由导航，带重试机制
 * @param {Object} router - Vue Router 实例
 * @param {String|Object} to - 目标路由
 * @param {Number} maxRetries - 最大重试次数
 * @returns {Promise}
 */
export function safeRouterPush(router, to, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const attemptNavigation = () => {
      router.push(to)
        .then(resolve)
        .catch(error => {
          console.error(`路由导航失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
          
          // 检查是否是 ChunkLoadError
          if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
            retryCount++;
            
            if (retryCount < maxRetries) {
              console.log(`ChunkLoadError 检测到，${2000}ms 后重试...`);
              setTimeout(attemptNavigation, 2000);
            } else {
              console.warn('达到最大重试次数，刷新页面...');
              window.location.href = router.resolve(to).href;
            }
          } else {
            reject(error);
          }
        });
    };
    
    attemptNavigation();
  });
}

/**
 * 安全的路由替换，带重试机制
 * @param {Object} router - Vue Router 实例
 * @param {String|Object} to - 目标路由
 * @param {Number} maxRetries - 最大重试次数
 * @returns {Promise}
 */
export function safeRouterReplace(router, to, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const attemptNavigation = () => {
      router.replace(to)
        .then(resolve)
        .catch(error => {
          console.error(`路由替换失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
          
          if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
            retryCount++;
            
            if (retryCount < maxRetries) {
              console.log(`ChunkLoadError 检测到，${2000}ms 后重试...`);
              setTimeout(attemptNavigation, 2000);
            } else {
              console.warn('达到最大重试次数，刷新页面...');
              window.location.href = router.resolve(to).href;
            }
          } else {
            reject(error);
          }
        });
    };
    
    attemptNavigation();
  });
}

/**
 * 检查是否为 ChunkLoadError
 * @param {Error} error - 错误对象
 * @returns {Boolean}
 */
export function isChunkLoadError(error) {
  return error && (
    error.name === 'ChunkLoadError' || 
    error.message.includes('Loading chunk') ||
    error.message.includes('Loading CSS chunk')
  );
}

/**
 * 处理 ChunkLoadError 的通用方法
 * @param {Error} error - 错误对象
 * @param {Function} onRetry - 重试回调
 * @param {Function} onReload - 重载回调
 */
export function handleChunkLoadError(error, onRetry, onReload) {
  if (isChunkLoadError(error)) {
    console.warn('检测到 ChunkLoadError:', error.message);
    
    if (typeof onRetry === 'function') {
      onRetry();
    } else if (typeof onReload === 'function') {
      onReload();
    } else {
      // 默认行为：刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    return true;
  }
  return false;
}
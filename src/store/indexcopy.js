import Vue from "vue";
// import state from './state'
// import mutations from './mutations'
// import actions from './actions'
class Store {
  constructor(options) {
    // 从 localStorage 恢复初始化状态
    const savedState = localStorage.getItem('vuex_persist') 
    const initialState = savedState ? JSON.parse(savedState) : options.state

    // 创建响应式状态
    this._vm = new Vue({ data: { state: initialState } })
    this.state = this._vm.state

    // 绑定 mutations/actions
    this.mutations = options.mutations || {}
    this.actions = options.actions || {}
    this.getters = {}

    // 动态注册 getters
    Object.keys(options.getters || {}).forEach(key => {
      Object.defineProperty(this.getters, key, {
        get: () => options.getters[key](this.state)
      })
    })

    // 监听页面关闭事件持久化数据
    window.addEventListener('beforeunload', () => {
      this._saveState()
    })
  }

  commit(type, payload) {
    if (this.mutations[type]) {
      this.mutations[type](this.state, payload)
      this._saveState() // 每次提交后自动持久化:ml-citation{ref="1" data="citationList"}
    } else {
      console.error(`[Vuex] Mutation "${type}" 未定义`)
    }
  }

  dispatch(type, payload) {
    return new Promise((resolve, reject) => {
      if (this.actions[type]) {
        this.actions[type]({
          state: this.state,
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this)
        }, payload)
          .then(resolve)
          .catch(reject)
      } else {
        console.error(`[Vuex] Action "${type}" 未定义`)
        reject()
      }
    })
  }

  // 私有方法：保存到 localStorage
  _saveState() {
    localStorage.setItem('vuex_persist', JSON.stringify(this.state))
  }
}

export const createStore = (options) => new Store(options)
// export default new Vuex.Store({
//   state,
//   mutations,
//   actions,
//   getters: {
//     cartTotal: state => state.cartItems.length
//   }
// })

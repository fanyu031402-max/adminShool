// src/store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'

Vue.use(Vuex)

// 持久化配置
const persistenceConfig = {
  storage: window.localStorage,  // 可选 sessionStorage
  persistKeys: ['token', 'userInfo'],  // 需要持久化的状态字段
  key: 'vuex_persist'           // 存储键名
}

// 创建 Store 实例
const store = new Vuex.Store({
  state: {
    token: null,
    userInfo: {
      username: '',
      company_type: '',
      company_id: '',
      yx_accid: '',
      yx_token: '',
      online: '',
      url: '',
      bd_id: '',
      rtc_show: '',
      user_id: '',
      real_time_event: [],
      sound: 0,
      voice: false,
      sipId:'',
    },
    temporaryData: null  // 不需要持久化的数据
  },
  mutations: {
    SET_SIPID(state, value){
        state.userInfo.sipId = value
    },
    SET_SOUND(state, sound) {
      state.userInfo.sound = sound
    },
    SET_VOICE(state, voice) {
      state.userInfo.voice = voice
    },
    SET_REALTIMEEVENT(state, real_time_event) {
      state.userInfo.real_time_event = real_time_event
    },
    SET_TOKEN(state, token) {
      state.token = token
    },
    SET_USERNAME(state, username) {
      state.userInfo.username = username
    },
    SET_COMPANY_ID(state, company_id) {
      state.userInfo.company_id = company_id
    },
    SET_USER_ID(state, user_id) {
      state.userInfo.user_id = user_id
    },
    SET_COMPANY_TYPE(state, company_type) {
      state.userInfo.company_type = company_type
    },
    SET_YX_ACCID(state, yx_accid) {
      state.userInfo.yx_accid = yx_accid
    },
    SET_YX_TOKEN(state, yx_token) {
      state.userInfo.yx_token = yx_token
    },
    SET_ONLINE(state, online) {
      state.userInfo.online = online
    },
    SET_URL(state, url) {
      state.userInfo.url = url
    },
    SET_BDID(state, bd_id) {
      state.userInfo.bd_id = bd_id
    },
    SET_RTC_SHOW(state, rtc_show) {
      state.userInfo.rtc_show = rtc_show
    }
  },
  actions: actions,
  // 自定义持久化插件
  plugins: [persistencePlugin(persistenceConfig)]
})

// 持久化插件工厂函数
function persistencePlugin(config) {
  return store => {
    // 初始化时加载数据
    const savedState = loadState(config)
    if (savedState) {
      store.replaceState(Object.assign({}, store.state, savedState))
    }

    // 监听 mutation 提交
    store.subscribe((mutation, state) => {
      saveState(state, config)
    })
  }
}

// 加载持久化数据
function loadState({ storage, key }) {
  try {
    const serialized = storage.getItem(key)
    return serialized ? JSON.parse(serialized) : null
  } catch (err) {
    console.error('持久化数据加载失败:', err)
    return null
  }
}

// 保存持久化数据
function saveState(state, { storage, key, persistKeys }) {
  try {
    const stateToSave = persistKeys.reduce((obj, key) => {
      obj[key] = state[key]
      return obj
    }, {})
    storage.setItem(key, JSON.stringify(stateToSave))
  } catch (err) {
    console.error('持久化数据保存失败:', err)
  }
}

export default store

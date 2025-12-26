import {Login, Logout,getUserInfo} from "@/api/login";
import { GetLatestEvent } from "@/api/event";

export default {
    login({ commit }, requestData) {
    return new Promise((resolve, reject) => {
        Login(requestData).then((response) => {
            let data = response.data.data
            // 解构的
            commit('SET_TOKEN', data.access_token)
            commit('SET_USERNAME', data.username);
            resolve(response)
        }).catch(error => {
            reject(error)
        })
    })
    },
    logout ({ commit }) {
        return new Promise((resolve, reject) => {
            Logout().then(response => {
                const data = response.data
                commit('SET_TOKEN', '');
                commit('SET_USERNAME', '');
                commit('SET_ROLES', []);
                commit('SET_ROLE', '');
                commit('SET_BUTTON', []);
                commit('SET_COMPANY_ID', []);
                commit('SET_URL', '');
                commit('SET_SIPID','')
                resolve(data);
            })

        })
    },
    /**
        * 获取最近消息列表
        */
    getLatestEvent({ commit }) {
        let params = { pagesize: 20 };
        GetLatestEvent(params).then(response => {
            let data = response.data.data.data;
            // data.forEach(item => {
            //     this.$set(item, 'hidden', true)
            // })
            commit('SET_REALTIMEEVENT', data)
        })
    },
    getUserInfo({ commit }){
        return new Promise((resolve, reject) => {
            getUserInfo().then(response => {
                const data = response.data
                resolve(data);
            })
        })
    },
    
  }
  
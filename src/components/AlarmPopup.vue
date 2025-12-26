<!-- components/AlarmPopup.vue -->
<template>
    <div v-if="visible" class="alarm-popup">
        <el-dialog :visible.sync="visible" title="事件消息" width="600px" :close-on-click-modal="false" @close="close">
            <div class="alarm-content">

                <el-descriptions title="" :column="1">
                    <el-descriptions-item label="设备编号">{{ editData.sn }}</el-descriptions-item>
                    <el-descriptions-item label="安装房间">{{ editData.room }}</el-descriptions-item>
                    <el-descriptions-item label="发生时间"> {{ editData.created_at }}</el-descriptions-item>
                    <el-descriptions-item label="事件类型">
                        <el-tag size="small">{{ getEventType(editData.event_type) }}</el-tag>
                    </el-descriptions-item>
                </el-descriptions>

                <!-- 敏感词高亮
          <div class="sensitive-words">
            <h4>检测到的敏感词：</h4>
            <highlight-text 
              :text="currentAlarm.originalText" 
              :keywords="currentAlarm.keywords"
            />
          </div> -->

                <!-- 录音播放 -->
                <div class="audio-player">
                    <p>音频：</p>
                    <audio :src="editData.audio_url" controls="" @error="playAudioError()" :paused="audioPaused"
                        @ended="playAudioEnd()" style="width: 240px; height: 32px;line-height: 32px"
                        ref="audioVo"></audio>
                </div>

                <el-descriptions title="" :column="1">

                    <el-descriptions-item label="事件处理">
                        <el-button size="mini" type="primary" round @click="handleAction(1)">玩闹
                        </el-button>
                        <el-button size="mini" type="danger" round @click="handleAction(2)">谩骂冲突
                        </el-button>
                        <el-button size="mini" type="warning" round @click="handleAction(3)">欺凌
                        </el-button>
                        <el-button size="mini" type="success" round @click="handleAction(4)">误报
                        </el-button>
                        <el-button size="mini" type="info" round @click="handleAction(5)">不确定
                        </el-button>
                    </el-descriptions-item>

                </el-descriptions>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <el-button type="danger" plain @click="callOther()">
                        <i class="el-icon-mic"></i> 发起对讲
                    </el-button>
                    <el-button type="primary" plain @click="close('yes')">
                        <i class="el-icon-view"></i> 查看详情
                    </el-button>
                </div>
            </div>
        </el-dialog>
        
        <!-- 对讲弹窗组件 -->
        <DialogChat :flag.sync="dialog_chat" :editData="localEditData" />
        <DialogChatLocal :flag.sync="dialog_chat_local" :editData="localEditData" />
    </div>
</template>

<script>
import HighlightText from './HighlightText'
import { getServiceType } from "@/utils/serverConfig";
import { GetInfoById, HandlerEvent, IsTalk } from "@/api/event";
import { initWebRTC3, disconnect, close } from "@/utils/imUtil";
import { checkBrowser } from "@/utils/common";
import { EventBus } from "@/utils/event";
import { safeRouterPush } from "@/utils/routerHelper";
import DialogChat from "../views/Event/components/chat";
import DialogChatLocal from "../views/Event/components/chatLocal.vue";

export default {
    components: { 
        HighlightText,
        DialogChat,
        DialogChatLocal
    },

    data() {
        return {
            visible: false,
            // currentAlarm: null,
            audioPaused: false, //是否暂停
            alarmQueue: [],
            dialog_chat: false, // 线上对讲弹窗
            dialog_chat_local: false, // 本地对讲弹窗
            talkTime: null, // 对讲时间
            isSupport: true, // 浏览器支持状态
            form: {}, // 表单数据
            localEditData: {}, // 本地编辑数据副本
            _isDestroyed: false, // 组件销毁标记
            _listenersSetup: false // 监听器设置标记
        }
    },
    props: {
        flag: {
            type: Boolean,
            default: false
        },
        editData: {
            type: Object,
            default: () => {
            }
        }
    },
    watch: {
        flag(newValue, oldValue) {
            this.visible = newValue;
        },
        editData: {
            handler(newVal) {
                // 当 prop 变化时，更新本地数据副本
                this.localEditData = { ...newVal };
            },
            immediate: true,
            deep: true
        }
    },

    mounted() {
        this.setupEventListeners();
    },

    beforeDestroy() {
        this.cleanupResources();
    },

    // 添加组件失活时的清理
    deactivated() {
        this.cleanupResources();
    },

    methods: {
        /**
         * 完整的资源清理
         */
        cleanupResources() {
            if (this._isDestroyed) {
                return; // 避免重复清理
            }
            
            console.log('AlarmPopup: 开始清理资源...');
            this._isDestroyed = true;
            
            // 1. 移除事件监听器
            this.removeEventListeners();
            
            // 2. 关闭所有弹窗
            this.dialog_chat = false;
            this.dialog_chat_local = false;
            
            // 3. 清理音频资源
            if (this.$refs.audioVo) {
                this.$refs.audioVo.pause();
                this.$refs.audioVo.src = '';
            }
            
            // 4. 重置组件状态
            this.talkTime = null;
            this.localEditData = {};
            this.form = {};
            
            console.log('AlarmPopup: 资源清理完成');
        },
        /**
         * 设置事件监听
         */
        setupEventListeners() {
            // 防止重复设置监听器
            if (this._listenersSetup) {
                console.warn('AlarmPopup: 事件监听器已设置，跳过重复设置');
                return;
            }
            
            let that = this;
            
            // 浏览器兼容性检查
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
                that.isSupport = false;
                that.$message.error("对讲功能只支持Google浏览器72及以上版本");
                return;
            }

            // 使用箭头函数保持 this 上下文，便于清理
            this._nimAcceptHandler = (event) => {
                console.log("onNimAccept:", event.channelId);
                try {
                    const dialogData = {
                        ...that.localEditData,
                        nimChannelId: event.channelId,
                        sn: that.form.sn,
                        talkTime: that.talkTime
                    };
                    that.openDialog(dialogData);
                } catch (error) {
                    console.error('处理 onNimAccept 事件失败:', error);
                }
            };

            this._nimRejectHandler = (event) => {
                console.log("onNimReject:", event);
                that.$message.error("对方正在通话中，请稍后尝试！");
                try {
                    disconnect(event.channelId);
                    close(event.channelId);
                } catch (error) {
                    console.error('处理 onNimReject 事件失败:', error);
                }
            };

            this._aimAcceptHandler = (event) => {
                console.log("onAimAccept:", event);
                try {
                    const dialogData = {
                        ...that.localEditData,
                        nimChannelId: event.sn,
                        sn: event.sn,
                        talkTime: that.talkTime,
                        localUid: event.localUid
                    };
                    that.openDialog(dialogData);
                } catch (error) {
                    console.error('处理 onAimAccept 事件失败:', error);
                }
            };

            this._aimRejectHandler = (event) => {
                console.log("onAimReject:", event);
                that.$message.error("对方正在通话中，请稍后尝试！");
                try {
                    disconnect(event.channelId);
                    close(event.channelId);
                } catch (error) {
                    console.error('处理 onAimReject 事件失败:', error);
                }
            };

            // 注册事件监听器
            EventBus.$on("onNimAccept", this._nimAcceptHandler);
            EventBus.$on("onNimReject", this._nimRejectHandler);
            EventBus.$on("onAimAccept", this._aimAcceptHandler);
            EventBus.$on("onAimReject", this._aimRejectHandler);
            
            this._listenersSetup = true;
            console.log('AlarmPopup: 事件监听器设置完成');
        },

        /**
         * 移除事件监听
         */
        removeEventListeners() {
            if (!this._listenersSetup) {
                return;
            }
            
            console.log('AlarmPopup: 移除事件监听器...');
            
            // 移除具体的处理函数，而不是所有监听器
            if (this._nimAcceptHandler) {
                EventBus.$off("onNimAccept", this._nimAcceptHandler);
                this._nimAcceptHandler = null;
            }
            
            if (this._nimRejectHandler) {
                EventBus.$off("onNimReject", this._nimRejectHandler);
                this._nimRejectHandler = null;
            }
            
            if (this._aimAcceptHandler) {
                EventBus.$off("onAimAccept", this._aimAcceptHandler);
                this._aimAcceptHandler = null;
            }
            
            if (this._aimRejectHandler) {
                EventBus.$off("onAimReject", this._aimRejectHandler);
                this._aimRejectHandler = null;
            }
            
            this._listenersSetup = false;
            console.log('AlarmPopup: 事件监听器移除完成');
        },
         /**
     * 打开im
     */
    openDialog(params) {
      if (getServiceType() === 'online') {
        this.dialog_chat = true;
      } else {
        this.dialog_chat_local = true;
      }
      // 更新本地数据副本，不直接修改 prop
      this.localEditData = Object.assign({}, params);
    },
        /**
         * 发起对讲 - 增强错误处理
         */
        callOther(){
            console.log('AlarmPopup: 发起对讲请求...');
            
            // 检查组件状态
            if (!this.isSupport) {
                console.warn('AlarmPopup: 浏览器不支持对讲功能');
                return;
            }
            
            if (this._isDestroyed) {
                console.warn('AlarmPopup: 组件已销毁，取消对讲');
                return;
            }
            
            try {
                // 线上服务走公网接口，本地服务走局域网接口
                if (getServiceType() === 'online') {
                    this.callOtherLine();
                } else {
                    this.callOtherLocal();
                }
            } catch (error) {
                console.error('AlarmPopup: 发起对讲失败:', error);
                this.$message.error('发起对讲失败，请重试');
            }
        },
    callOtherLocal() {
      // 浏览器兼容性检查
      if (!this.isSupport) {
        return;
      }
      
      console.log(this.editData.id,'this.editData.id')
      let params = { id: parseInt(this.editData.id) };
      let sn = this.editData.sn;
      let sip_id;
      
      GetInfoById(params).then(response => {
        let data = response.data.data;
        sip_id = data.device.sip_id;
        
        if (sn.includes("TSA010") || sn.includes("RSA010") || sn.includes("HSA010")) {
          IsTalk(params).then(response => {
            let data = response.data.data;
            if (data.isTalk) {
              this.talkTime = data.talkTime;
              this.form.sn = sn; // 设置表单数据
              this.openDialog({talkTime:this.talkTime, sn:this.editData.sn, sip_id:sip_id})
            } else {
              this.$message({
                message: "该事件已经过去一段时间了，不能发起对讲了",
                type: "error"
              })
            }
          })
        }
      }).catch(error => {
        console.error('获取设备信息失败:', error);
        this.$message.error('获取设备信息失败');
      });
    },
    callOtherLine() {
      // 浏览器兼容性检查
      if (!this.isSupport) {
        return;
      }
      
      let params = { id: parseInt(this.editData.id) };
      let sn = this.editData.sn;
      
      if (sn.includes("TSA010") || sn.includes("RSA010")||sn.includes("HSA010")) {
         IsTalk(params).then(response => {
                    let data = response.data.data;
                    if (data.isTalk) {
                        this.talkTime = data.talkTime;
                        this.form.sn = sn; // 设置表单数据
                        // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
                        let localUid = Math.ceil(Math.random() * 1e5);
                        let userId = this.$store.state.userInfo.user_id;
                        initWebRTC3(parseInt(this.editData.id), this.editData.sn, userId, localUid, 1, "company");
                    } else {
                        this.$message({
                            message: "该事件已经过去一段时间了，不能发起对讲了",
                            type: "error"
                        })
                    }
                }).catch(error => {
                    console.error('检查对讲状态失败:', error);
                    this.$message.error('检查对讲状态失败');
                });
      }
    },
        /**
             * 事件处理
             */
        handleAction(value) {
            let ret = { label: value, id: this.editData.id };
            HandlerEvent(ret).then(response => {
                let data = response.data
                this.$message({
                    message: data.msg,
                    type: "success"
                })
                this.isShow = false;
            })
        },
         /**
     * 关闭所有弹窗
     */
    closeAllDialogs() {
  const openDialogs = []
  
  // 递归查找所有Dialog组件实例
  function findDialogs(vm) {
    if (vm.$options.name === 'ElDialog' && vm.visible) {
      openDialogs.push(vm)
    }
    vm.$children.forEach(child => findDialogs(child))
  }
  
  findDialogs(this.$root)
  openDialogs.forEach(dialog => {
    dialog.visible = false
  })
},
        /**
         * 关闭弹窗
         */
        close(intent) {
            console.log('AlarmPopup: 关闭弹窗, intent:', intent);
            
            if (intent == 'yes') {
                let eventId = this.editData.id;
                this.toDetailed(eventId);
                this.closeAllDialogs()
            }
            
            this.dialog_flag = false;
            
            // 清理状态并通知父组件
            this.$emit("update:flag", false);
            this.$emit("close");
            
            // 注意：不要在这里调用 cleanupResources()
            // 只有在组件真正销毁时才清理资源
        },

        /**
         * 退出
         */
        logout() {
            this.$store.dispatch('app/logout').then(response => {
                if (response.code === 0) {
                    this.$message({
                        message: "退出成功！",
                        type: "success"
                    })
                    this.$router.push({
                        name: 'Login'
                    })
                }
            })
        },

        /**
         * @description: 播放内容
         * @param {Boolean} status 1 开始 2 暂停
         * @param {String} url 语音文件url
         * @param {Function} cb 回调函数
         * @param {Function} endCb 播放结束的回调函数
         * @param {Function} errorCb 播放错误的回调函数
         * @returns audioObj 音频对象
         */
        play(status, url, cb) {
            if (status === 1) {
                if (url.indexOf('.mp3') > -1 || url.indexOf('.wav') > -1 || url.indexOf('.ogg') > -1) {
                    // this.audioUrl = url
                    this.audioPaused = false
                    this.$refs.audioVo.play()
                    cb && cb()
                    /* useCapture   可选。布尔值，指定事件是否 在捕获或冒泡阶段执行。
                    可能值：
                    true - 事件句柄在捕获阶段执行
                    false- 默认。事件句柄在冒泡阶段执行 */
                } else {
                    console.error('未找到语音文件')
                }
            } else if (status === 2) {
                this.$refs.audioVo.pause()
                this.audioPaused = true
            }
        },

        // 播放音频结束事件
        playAudioEnd() {

        },
        // 播放失败
        playAudioError() {

        },
        /**
         * 安全的路由导航到详情页
         */
        toDetailed(eventId) {
            console.log('AlarmPopup: 导航到事件详情, eventId:', eventId);
            console.log('AlarmPopup: 当前路由:', this.$route.path);
            
            // 检查组件状态
            if (this._isDestroyed || !this.$router) {
                console.warn('AlarmPopup: 组件已销毁或路由不可用，取消导航');
                return;
            }
            
            if (this.$route.path === '/events') {
                // 如果已经在事件列表页，直接刷新
                this.$router.go(0);
            } else {
                // 使用安全导航，添加状态检查
                const targetRoute = '/events/' + eventId;
                
                // 检查目标路由是否有效
                try {
                    const resolved = this.$router.resolve(targetRoute);
                    if (!resolved.route.matched.length) {
                        console.error('AlarmPopup: 无效的路由:', targetRoute);
                        this.$message.error('页面路径无效');
                        return;
                    }
                } catch (error) {
                    console.error('AlarmPopup: 路由解析失败:', error);
                    this.$message.error('路由解析失败');
                    return;
                }
                
                // 显示加载状态
                const loading = this.$loading({
                    lock: true,
                    text: '正在跳转...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });
                
                // 使用安全导航
                safeRouterPush(this.$router, targetRoute)
                    .then(() => {
                        console.log('AlarmPopup: 路由导航成功');
                        loading.close();
                    })
                    .catch(error => {
                        console.error('AlarmPopup: 路由导航失败:', error);
                        loading.close();
                        
                        // 根据错误类型提供不同的处理
                        if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
                            this.$message({
                                message: '页面加载失败，正在刷新...',
                                type: 'warning',
                                duration: 2000
                            });
                            setTimeout(() => {
                                window.location.href = window.location.origin + '/#' + targetRoute;
                            }, 2000);
                        } else {
                            this.$message.error('页面跳转失败，请重试');
                        }
                    });
            }
        },
        /**
         * 根据event_type的value来确定label值
         */
        getEventType(event_type) {
            let type
            switch (event_type) {
                case 1:
                    type = "异常事件"
                    break;
                case 2:
                    type = "敏感词"
                    break;
                case 3:
                    type = "熄灯监测"
                    break;
                case 4:
                    type = "其他"
                    break;
                default:
                    type = "其他"
            }
            return type
        }


    },
}
</script>

<style scoped>
.alarm-content {
    padding: 10px 20px;
}

.info-row {
    margin: 15px 0;
}

.label {
    color: #666;
    font-weight: bold;
}

.sensitive-words {
    margin: 20px 0;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
}

.audio-player {
    display: flex;
    /* margin: 20px 0; */
}

.action-buttons {
    margin-top: 25px;
    text-align: right;
}
</style>
<template>
  <div class="event-detail-container">
    <!-- 头部操作栏 -->
    <div class="operation-bar">
      <el-button type="info" icon="el-icon-arrow-left" @click="goBack">返回列表</el-button>
    </div>

    <!-- 主体内容 -->
    <el-row>
      <!-- 事件信息 -->
      <el-col>
        <el-card class="info-card" shadow="hover">
          <el-descriptions border>
            <template slot="title">
              <div slot="header" class="card-header">
                <i class="el-icon-warning"></i>
                <span>事件信息</span>
              </div>
            </template>
            <el-descriptions-item label="发生时间">
              <el-tag effect="plain" type="info">{{ form.created_at }}</el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="事件类型">
              <el-tag :type="eventTypeColor" effect="plain">{{ form.event_type }}</el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="处理结果">
              <el-tag :type="resultStatusColor" effect="plain">
                {{ form.label || '待处理' }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="事件音频">
              <!-- <audio controls class="audio-player">
                                <source :src="eventInfo.audio" type="audio/mpeg">
                                您的浏览器不支持音频播放
                            </audio> -->
              <audio-player ref="players" :src="form.audio_url" @toggle="handleToggle" />
            </el-descriptions-item>
          </el-descriptions>
          <el-descriptions border>
            <template slot="title">
              <div slot="header" class="card-header">
                <i class="el-icon-monitor"></i>
                <span>设备信息</span>
              </div>
            </template>
            <el-descriptions-item label="设备编号">
              <el-tag effect="plain">{{ form.sn }}</el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="安装房间">
              <el-tag type="success" effect="plain">{{ form.room }}</el-tag>
            </el-descriptions-item>

            <!-- <el-descriptions-item label="设备状态">
                            <el-tag :type="deviceStatusColor">{{ deviceInfo.status }}</el-tag>
                        </el-descriptions-item> -->
          </el-descriptions>

          <div style="display: flex;align-items: center;margin-top: 30px;" v-show="isShow">
            <!-- <div class="card-header">
              <i class="el-icon-news"></i>
              <span>事件处理</span>
            </div> -->
            <!-- 操作按钮组 -->
            <div class="action-buttons">
              <el-button type="primary" @click="handlerEvent(1)">玩闹</el-button>

              <el-button type="danger" @click="handlerEvent(2)">谩骂冲突</el-button>

              <el-button type="warning" @click="handlerEvent(3)">欺凌</el-button>

              <el-button type="success" @click="handlerEvent(4)">误报</el-button>

              <el-button type="info" @click="handlerEvent(5)">不确定</el-button>
            </div>
          </div>

        </el-card>
      </el-col>
    </el-row>
    <el-row style="margin-top:30px">
      <el-button size="small" :disabled="!isSupport" type="primary" round @click="callOther">发起 对讲
      </el-button>
      <div class="errorMsg" v-show="!isSupport">当前浏览器不支持体验，建议下载安装最新chrome浏览器</div>
    </el-row>
    <DialogChat :flag.sync="dialog_chat" :editData="editData" @update:flag="onDialogClose" />
  </div>
</template>

<script>
import { GetInfoById, HandlerEvent, IsTalk } from "@/api/event";
import { checkBrowser, getEventType, getLabelType } from "@/utils/common";
import { call, close, disconnect, initWebRTC3 } from "@/utils/imUtil";
import DialogChat from "./components/chat";
// import BRTChatDialog from "./dialog/BRTChat";
import { EventBus } from "@/utils/event";
import AudioPlayer from './components/audio.vue'
import { getServiceType } from "@/utils/serverConfig";
// import { getBdUserId } from "@/utils/app";
import DialogChatLocal from "./components/chatLocal.vue";

export default {
  components: { AudioPlayer, DialogChat,DialogChatLocal },
  data() {
    return {
      eventInfo: {
        time: '2023-09-15 14:30:22',
        type: '异常声响',
        result: '',
        audio: '/audios/event_20230915.mp3'
      },
      deviceInfo: {
        id: 'DEV-2023-0875',
        room: '三楼西侧会议室',
        status: '在线'
      },
      isSupport: true,
      form: {
        created_at: "",
        event_type: "",
        handler_type: "",
        handler_name: "",
        audio_url: "",
        long_audio: "",
        label: 0,
        customer: [],
        sn: "",
        id: -1,
        talk_url: "",
      },
      editData: {
        nimChannelId: "",
        sn: "",
        localUid: -1,
      },
      brtData: {
        sn: '',
        task_id: '',
        user_id: -1,
        feed_id: -1,
        scene: 'xy',
        key: 'a',
      },
      dialog_chat: false,
      dialog_brtchat: false,
      type: -100,
      audioIsPlaying: false,
      isSupport: true,
      audioPaused: false, //是否暂停
      contextPaused: false, //是否暂停
      id: this.$route.params.id || this.$store.getters["eventDetailed/eventId"],
      isShow: true,
      showScore: false,
      gridData: [],
      isSilence: false,
      isDesc: true,
      isStop: false,
      desc: '正在呼叫对方...',
      client: null,
      localUid: -1,
      localStream: null,
      remoteStream: null,
      nimChannelId: '',
      isIMShow: false,
      yx_opp_accid: '',
      talkTime: 10,
      flag: null,
    }
  },
  computed: {
    eventTypeColor() {
      const types = {
        '异常声响': 'warning',
        '安全预警': 'danger',
        '设备故障': 'info'
      }
      return types[this.eventInfo.type] || 'info'
    },
    resultStatusColor() {
      return this.eventInfo.result ? 'success' : 'danger'
    },
    deviceStatusColor() {
      return this.deviceInfo.status === '在线' ? 'success' : 'danger'
    }
  },
  watch: {
    // 监听路由参数变化，当id变化时重新获取数据
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.id = newId;
          this.getInfoById(parseInt(newId));
        }
      },
      immediate: false
    }
  },
  methods: {
    handleToggle(index, state) {
      if (index) {
        this.$refs.players.play()
      } else {
        this.$refs.players.pause()
      }
    },
    /**
     * 打开im
     */
    openDialog(params) {
      this.dialog_chat = true;
      // 子组件赋值
      this.editData = Object.assign({}, params);
    },
    // 注册对讲事件监听（点击对讲时调用）
    registerTalkEvents() {
      let that = this;
      // 先取消之前的监听，避免重复注册
      this.unregisterTalkEvents();
      
      // 2代报警器
      EventBus.$on("onNimAccept", function (event) {
        console.log("channelId:", event.channelId)
        that.editData.nimChannelId = event.channelId
        that.editData.sn = that.form.sn
        that.editData.talkTime = that.talkTime
        that.openDialog(that.editData)
      });
      EventBus.$on("onNimReject", function (event) {
        that.$message.error("对方正在通话中，请稍后尝试！")
        disconnect(event.channelId)
        close(event.channelId)
        // 挂断后取消监听
        that.unregisterTalkEvents();
      });
      // 3代报警器
      EventBus.$on("onAimAccept", function (event) {
        that.editData.nimChannelId = event.sn
        that.editData.sn = event.sn
        that.editData.talkTime = that.talkTime
        that.editData.localUid = event.localUid
        that.openDialog(that.editData)
      });
      EventBus.$on("onAimReject", function (event) {
        that.$message.error("对方正在通话中，请稍后尝试！")
        disconnect(event.channelId)
        close(event.channelId)
        // 挂断后取消监听
        that.unregisterTalkEvents();
      });
    },
    // 取消对讲事件监听（挂断后调用）
    unregisterTalkEvents() {
      EventBus.$off("onNimAccept");
      EventBus.$off("onNimReject");
      EventBus.$off("onAimAccept");
      EventBus.$off("onAimReject");
    },
    // 弹窗关闭时取消事件监听
    onDialogClose(val) {
      if (!val) {
        // 弹窗关闭（挂断）时取消监听
        this.unregisterTalkEvents();
      }
    },


    getInfoById(id) {
      let params = { id: id };
      GetInfoById(params).then(response => {
        let data = response.data.data;
        this.form.customer = data.customer;
        this.form.event_type = getEventType(data.event_type);
        this.form.handler_name = data.handler_name;
        this.form.audio_url = data.audio_url;
        this.form.long_audio = data.long_audio;
        this.form.created_at = data.created_at;
        this.form.sn = data.sn;
        this.form.label = getLabelType(data.label);
        this.type = data.event_type;
        this.form.keyword = data.keyword;
        this.form.room = data.room;
        this.form.id = data.id;
        this.form.talk_url = data.lite_talk_url;
        this.yx_opp_accid = data.device.yx_accid;
        this.brtData.feed_id = data.device.bd_user_id;
        this.brtData.user_id = parseInt(this.$store.state.userId);
        this.brtData.task_id = data.task_id;
        this.brtData.sn = data.sn;
        // console.log('brtData:',this.brtData)
        this.gridData = data.vpr_matchs;
        if (this.gridData) {
          this.showScore = true;
        } else {
          this.showScore = false;
        }
        if (data.label != 0) {
          this.isShow = false;
        } else {
          this.isShow = true;
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
    /**
     * @description: 语音播报
     * @param {Boolean} status 1 开始 2 暂停
     * @param {String} url 语音文件url
     * @param {Function} cb 回调函数
     * @param {Function} endCb 播放结束的回调函数
     * @param {Function} errorCb 播放错误的回调函数
     * @returns audioObj 音频对象
     */
    playContext(status, url, cb) {
      if (status === 1) {
        if (url.indexOf('.mp3') > -1 || url.indexOf('.wav') > -1 || url.indexOf('.ogg') > -1) {

          this.contextPaused = false
          this.$refs.contextAudio.play()
          cb && cb()
        } else {
          console.error('未找到语音文件')
        }
      } else if (status === 2) {
        this.$refs.contextAudio.pause()
        this.contextPaused = true
      }
    },
    // 播放音频结束事件
    playAudioEnd() {

    },
    // 播放失败
    playAudioError() {

    },


    handlerEvent(value) {
      let ret = { label: value, id: this.form.id };
      HandlerEvent(ret).then(response => {
        let data = response.data
        this.$message({
          message: data.msg,
          type: "success"
        })
        this.isShow = false;
      })
    },

   callOther(){
      // 线上服务走公网接口，本地服务走局域网接口
      if (getServiceType() === 'online') {
        this.callOtherLine()
      } else {
        this.callOtherLocal()
      }
    },
    callOtherLocal() {
      console.log(this.id,'this.id')
      let params = { id: parseInt(this.id) };
      let sn = this.form.sn;
      //  else if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
      //   IsTalk(params).then(response => {
      //     let data = response.data.data;
      //     if (data.isTalk) {
      //       this.talkTime = data.talkTime;
      //       console.log(this.yx_opp_accid)
      //       call(this.localUid, this.form.sn, this.yx_opp_accid, this.localUid)
      //         .then(response => {
      //           console.log('呼叫成功了')
      //         })
      //     } else {
      //       this.$message({
      //         message: "该事件已经过去一段时间了，不能发起对讲了",
      //         type: "error"
      //       })
      //     }

      //   })
      // } 
      if (sn.includes("TSA010") || sn.includes("RSA010")|| sn.includes("HSA010")) {
        IsTalk(params).then(response => {
          let data = response.data.data;
          if (data.isTalk) {
            this.talkTime = data.talkTime;
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
            this.openDialog({talkTime:this.talkTime,sn:this.form.sn,sip_id:this.form.sip_id})
            // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
            // let localUid = Math.ceil(Math.random() * 1e5);
            // let userId = this.$store.state.app.user_id;
            // console.log(this.$store.state.app.user_id,'111')
            // initWebRTC3(parseInt(this.id), this.form.sn, userId, localUid, 1, "company");
          } else {
            this.$message({
              message: "该事件已经过去一段时间了，不能发起对讲了",
              type: "error"
            })
          }

        })
      }

    },
    callOtherLine() {
      console.log(this.id,'this.id')
      let params = { id: parseInt(this.id) };
      let sn = this.form.sn;
      // if (sn.includes("HSA001") || sn.includes("SSA010")) {//AI呼叫器
      //   // 子组件赋值
      //   this.brtData.sn = sn;
      //   this.dialog_brtchat = true;
      // } else if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
      //   IsTalk(params).then(response => {
      //     let data = response.data.data;
      //     if (data.isTalk) {
      //       this.talkTime = data.talkTime;
      //       console.log(this.yx_opp_accid)
      //       call(this.localUid, this.form.sn, this.yx_opp_accid, this.localUid)
      //         .then(response => {
      //           console.log('呼叫成功了')
      //         })
      //     } else {
      //       this.$message({
      //         message: "该事件已经过去一段时间了，不能发起对讲了",
      //         type: "error"
      //       })
      //     }

      //   })
      // } else 
      if (sn.includes("TSA010") || sn.includes("RSA010")||sn.includes("HSA010")) {
        IsTalk(params).then(response => {
          let data = response.data.data;
          if (data.isTalk) {
            this.talkTime = data.talkTime;
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
            // 点击对讲时注册事件监听
            this.registerTalkEvents();
            // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
            let localUid = Math.ceil(Math.random() * 1e5);
            let userId = this.$store.state.userInfo.user_id;
            initWebRTC3(parseInt(this.id), this.form.sn, userId, localUid, 1, "company");
          } else {
            this.$message({
              message: "该事件已经过去一段时间了，不能发起对讲了",
              type: "error"
            })
          }

        })
      }

    },
    /**
     * 根据event_type的value来确定label值
     */
    getEvent(event_type) {
      return getEventType(event_type);
    },
    goBack() {
      this.$router.back()
    },
    handlerEvent(value) {
      let ret = { label: value, id: this.form.id };
      HandlerEvent(ret).then(response => {
        let data = response.data
        this.$message({
          message: data.msg,
          type: "success"
        })
        this.getInfoById(parseInt(this.id));
        this.isShow = false;
      })
    },
  },
  created() {
    if (this.id) {
      this.getInfoById(parseInt(this.id));
    } else {
      console.log("id 空了")
    }
    this.localUid = Math.ceil(Math.random() * 1e5)
    // console.log(this.localUid)
  },

  mounted() {
    let that = this;
    if (!checkBrowser('chrome') && !checkBrowser('safari')) {
      that.isSupport = false;
      that.$message.error("对讲功能只支持Google浏览器72及以上版本")
      return;
    }
  },
  beforeDestroy() {
    // 确保组件销毁时清理事件监听
    this.unregisterTalkEvents();
  },
}
</script>

<style scoped>
::v-deep .el-button--small.is-round {
  padding: 16px 35px;
  border-radius: 35px;
  font-size: 14px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.event-detail-container {
  padding: 20px;
  background: #252a39;
  min-height: 100vh;
}

.el-card {
  background-color: #2c3348;
  border: none;
}

::v-deep .el-descriptions .is-bordered .el-descriptions-item__cell {
  border: 1px solid #575d6e;
}

.el-descriptions {
  color: #d1cccc;
}

::v-deep .el-descriptions__body {
  background-color: #2c3348;
}

::v-deep .el-descriptions-item__label.is-bordered-label {
  background-color: transparent;
}

::v-deep .el-tag--plain {
  background: transparent;
  border: none;
  color: #d1cccc;
}

::v-deep .el-descriptions-item__label.is-bordered-label {
  color: #909399;
}

.operation-bar {
  margin-bottom: 20px;
}

.info-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.card-header i {
  margin-right: 8px;
  font-size: 18px;
}

.audio-player {
  width: 100%;
  margin-top: 10px;
}

.action-buttons {
  margin-left: 40px;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
  padding: 12px 24px;
  border-radius: 20px;
}

.el-descriptions {
  margin-top: 15px;
}

.el-tag {
  font-size: 14px;
  padding: 0 10px;
  height: 28px;
  line-height: 26px;
}
</style>
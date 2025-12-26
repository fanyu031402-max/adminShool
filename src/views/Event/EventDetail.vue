<template>
  <div>
    <el-page-header @back="back" content="事件详情">
    </el-page-header>

    <el-divider style="margin: 10px 0;" />
    <el-container>
      <el-main class="pull-left" style="width: 500px;">
        <el-descriptions title="事件信息" :column="1">
          <el-descriptions-item label="发生时间"> {{ form.created_at }}</el-descriptions-item>
          <el-descriptions-item label="事件类型"> {{ form.event_type }}</el-descriptions-item>
          <el-descriptions-item label="处理结果"> {{ form.label }}</el-descriptions-item>
          <el-descriptions-item label="事件音频">
            <audio :src="this.form.audio_url" controls="" @error="playAudioError()" :paused="audioPaused"
              @ended="playAudioEnd()" style="width: 240px; height: 32px;line-height: 32px" ref="audioVo"></audio>
          </el-descriptions-item>
          <el-descriptions-item label="事件经过" v-if="form.long_audio">
            <audio :src="this.form.long_audio" controls="" @error="playAudioError()" :paused="contextPaused"
              :play="playContext" @ended="playAudioEnd()" style="width: 240px; height: 32px;line-height: 32px"
              ref="contextAudio"></audio>
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="设备信息" :column="1">
          <el-descriptions-item label="设备编号">{{ form.sn }}</el-descriptions-item>
          <el-descriptions-item label="安装房间">{{ form.room }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="负责人信息" :column="1">

          <el-descriptions-item v-for="item in form.customer" :key="item.id" label="负责人">{{ item.name }}，
            联系电话：{{ item.phone }}
          </el-descriptions-item>

        </el-descriptions>

        <el-descriptions v-show="isShow" title=" " :column="1" :colon="false">

          <el-descriptions-item label="">
            <el-button size="mini" class="mark1" type="primary" round @click="handlerEvent(1)">玩闹
            </el-button>
            <el-button size="mini" class="mark" type="danger" round @click="handlerEvent(2)">谩骂冲突
            </el-button>
            <el-button size="mini" class="mark" type="warning" round @click="handlerEvent(3)">欺凌
            </el-button>
            <el-button size="mini" class="mark" type="success" round @click="handlerEvent(4)">误报
            </el-button>
            <el-button size="mini" class="mark" type="info" round @click="handlerEvent(5)">不确定
            </el-button>
          </el-descriptions-item>

        </el-descriptions>

        <el-row style="margin-top:40px">
          <el-button style="width: 200px; margin-left: 10px;" size="small" :disabled="!isSupport" type="primary" round
            @click="callOther">发起 对讲
          </el-button>
          <div class="errorMsg" v-show="!isSupport">当前浏览器不支持体验，建议下载安装最新chrome浏览器</div>
        </el-row>
      </el-main>
      <el-aside class="pull-right" style="width: 200px" v-show="showScore">
        <p style="line-height: 30px;margin: 12px 0;font-weight: bold">疑似呼救人员</p>
        <el-table :data="gridData" border class="top" :header-cell-style="{ 'text-align': 'center' }"
          :cell-style="{ 'color': '#666' }">
          <el-table-column align="center" property="id" label="序号"></el-table-column>
          <el-table-column align="center" property="stu_name" label="姓名"></el-table-column>
        </el-table>
      </el-aside>
    </el-container>


    <DialogChat :flag.sync="dialog_chat" :editData="editData" />
    <DialogChatLocal :flag.sync="dialog_chat_local" :editData="editData" />
    <!-- <BRTChatDialog :flag.sync="dialog_brtchat" :editData="brtData" /> -->
  </div>
</template>
<script>

import { GetInfoById, HandlerEvent, IsTalk } from "@/api/event";
import { checkBrowser, getEventType, getLabelType } from "@/utils/common";
import { call, close, disconnect, initWebRTC3 } from "@/utils/imUtil";
// import DialogChat from "./components/chat";
import DialogChat from "./components/chat";
// import BRTChatDialog from "./dialog/BRTChat";
import { EventBus } from "@/utils/event";
// import { getBdUserId } from "@/utils/app";
import { getServiceType } from "@/utils/serverConfig";
import DialogChatLocal from "./components/chatLocal.vue";


export default {
  name: "eventDetailed",
  components: { DialogChat,DialogChatLocal },
  data() {
    return {
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
      dialog_chat_local:false,
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
  props: {
    msg: String
  },
  watch: {
    '$route.query.id'(newValue) {
      // this.getInfoById(parseInt(newValue));
      // this.localUid = Math.ceil(Math.random() * 1e5)
      // if(newValue!=this.id){
        // this.$router.go(0)
      // }
      },
  },
  methods: {
    back() {
      this.$router.back()
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
      // 子组件赋值
      this.editData = Object.assign({}, params);
    },


    getInfoById(id) {
      let params = { id: id };
      GetInfoById(params).then(response => {
        let data = response.data.data;
        this.form.customer = data.customer;
        this.form.sip_id=data.device.sip_id
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
        this.brtData.user_id = parseInt(this.$store.state.userInfo.userId);
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

    // callOther() {
    //   console.log(this.id,'this.id')
    //   let params = { id: parseInt(this.id) };
    //   let sn = this.form.sn;
    //   if (sn.includes("HSA") || sn.includes("SSA010")) {//AI呼叫器
    //     // 子组件赋值
    //     this.brtData.sn = sn;
    //     this.dialog_brtchat = true;
    //   } else if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
    //     IsTalk(params).then(response => {
    //       let data = response.data.data;
    //       if (data.isTalk) {
    //         this.talkTime = data.talkTime;
    //         console.log(this.yx_opp_accid)
    //         call(this.localUid, this.form.sn, this.yx_opp_accid, this.localUid)
    //           .then(response => {
    //             console.log('呼叫成功了')
    //           })
    //       } else {
    //         this.$message({
    //           message: "该事件已经过去一段时间了，不能发起对讲了",
    //           type: "error"
    //         })
    //       }

    //     })
    //   } else if (sn.includes("TSA010") || sn.includes("RSA010")) {
    //     IsTalk(params).then(response => {
    //       let data = response.data.data;
    //       if (data.isTalk) {
    //         this.talkTime = data.talkTime;
    //         if (!checkBrowser('chrome') && !checkBrowser('safari')) {
    //           this.isSupport = false;
    //           this.$message.error("对讲功能只支持Google浏览器72及以上版本")
    //           return;
    //         }
    //         // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
    //         let localUid = Math.ceil(Math.random() * 1e5);
    //         let userId = this.$store.state.app.user_id;
    //         initWebRTC3(parseInt(this.id), this.form.sn, userId, localUid, 1, "company");
    //       } else {
    //         this.$message({
    //           message: "该事件已经过去一段时间了，不能发起对讲了",
    //           type: "error"
    //         })
    //       }

    //     })
    //   }

    // },
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
      if (sn.includes("TSA010") || sn.includes("RSA010")) {
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
      if (sn.includes("HSA001") || sn.includes("SSA010")) {//AI呼叫器
        // 子组件赋值
        this.brtData.sn = sn;
        this.dialog_brtchat = true;
      } else if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
        IsTalk(params).then(response => {
          let data = response.data.data;
          if (data.isTalk) {
            this.talkTime = data.talkTime;
            console.log(this.yx_opp_accid)
            call(this.localUid, this.form.sn, this.yx_opp_accid, this.localUid)
              .then(response => {
                console.log('呼叫成功了')
              })
          } else {
            this.$message({
              message: "该事件已经过去一段时间了，不能发起对讲了",
              type: "error"
            })
          }

        })
      } else if (sn.includes("TSA010") || sn.includes("RSA010")||sn.includes("HSA010")) {
        IsTalk(params).then(response => {
          let data = response.data.data;
          if (data.isTalk) {
            this.talkTime = data.talkTime;
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
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


  }
  ,
  created() {
    if (this.id) {
      this.getInfoById(parseInt(this.id));
    } else {
      console.log("id 空了")
    }
    this.localUid = Math.ceil(Math.random() * 1e5)
    // console.log(this.localUid)
  }
  ,
  mounted() {
    let that = this;
    if (!checkBrowser('chrome') && !checkBrowser('safari')) {
      that.isSupport = false;
      that.$message.error("对讲功能只支持Google浏览器72及以上版本")
      return;
    }
    //2代报警器
    EventBus.$on("onNimAccept", function (event) {
      console.log("channelId:", event.channelId)
      that.editData.nimChannelId = event.channelId
      that.editData.sn = that.form.sn
      that.editData.talkTime = that.talkTime
      that.openDialog(that.editData)
    });
    EventBus.$on("onNimReject", function (event) {
      // console.log(event.ext)
      that.$message.error("对方正在通话中，请稍后尝试！")
      disconnect(event.channelId)
      close(event.channelId)
    });
    //3代报警器
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
    });

  }

}
</script>
<style lang="less" scoped>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.header-1 {
  font-weight: bold;
  font-size: 18px;
  height: 30px !important;
}

.header-2 {
  font-weight: bold;
  font-size: 15px;
  padding-left: 40px;
  height: 30px !important;
  line-height: 30px;
}

.el-col {
  min-width: 330px;
}

.el-form-item__label {
  padding: 0px !important;
}

.row {
  margin: 0px;
  line-height: 40px;
  height: 40px;

  .label {
    width: 160px;
    text-align: left;
    margin-left: 10px;
    vertical-align: middle;
    float: left;
    font-size: 14px;
    color: #606266;
    line-height: 40px;
    padding: 0 8px 0 40px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
  }

  .right-label {
    width: 240px;
    text-align: right;
    margin-left: 10px;
    vertical-align: middle;
    font-size: 14px;
    color: #606266;
    line-height: 40px;
    padding: 0 8px 0 0;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
  }
}

.el-form-item {
  line-height: 40px;
}

.el-button {
  // margin-top: 8px !important;
  font-size: 12px;
}


.submit-btn {
  display: block;
  display: block;
  width: 315px;
  height: 50px;
  margin: 0 auto;
  border: none;
  outline: medium;
  background: #337EFF;
  border-radius: 25px;
  font-family: PingFangSC-Regular;
  font-size: 16px;
  color: #FFFFFF;
  cursor: pointer;

  &:active {
    background: darken(#337EFF, 5%);
  }

  &:disabled {
    background: #dddddd;
    cursor: not-allowed;
  }
}

.errorMsg {
  font-size: 14px;
  text-align: center;
  color: red;
  margin-top: 10px;
}

.mark1 {
  width: 80px;
}

.mark {
  width: 80px;
  margin-left: 10px;
}

//去掉表格/*头部边框*/
::v-deep .el-table thead tr th.is-leaf {
  border: 0px solid #EBEEF5;
  border-right: none;
}

::v-deep .el-table {
  // 去掉table的border start----------------------------
  border: 0;

  th,
  tr,
  td {
    border: 0;
  }

  &::before {
    height: 0px;
  }

  &::after {
    width: 0;
  }

  .el-table__fixed:before {
    height: 0;
  }

  // 去掉table的border end----------------------------
}

.el-divider {
  margin: 8px 0;
  background: 0 0;
  border-top: 1px solid #E6EBF5;
}

.margin-tip10 {
  margin-top: 10px;
}

.el-descriptions__header {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  margin-bottom: 10px;
}

.el-descriptions-item__container .el-descriptions-item__content,
.el-descriptions-item__container .el-descriptions-item__label {
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -webkit-box-align: baseline;
  -ms-flex-align: baseline;
  align-items: baseline;
  line-height: 32px !important;
}
</style>

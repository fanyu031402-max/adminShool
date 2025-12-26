<template>
  <el-dialog :visible.sync="dialog_info_flag" :center="true" custom-class="dialog-with-background" @close="closeDialog"
             width="280px" style="height: auto !important;" :destroy-on-close="true" :show-close="true"
             :close-on-click-modal="false" @opened="openDialog">
    <div class="wrapper">

      <div class="callbox">
        <div class="top">
          <el-image class="header" :src="require('@/assets/header_ico.png')"></el-image>
          <p ref="sn" :model="sn">SN:{{ sn }}</p>
        </div>


        <div class="mid">
          <span v-show="isconnect">{{ displayTime }}</span>
          <span v-show="calling" class="connect-status" v-html="statustext_calling"></span>
        </div>
        <audio
            v-show="false"
            src="https://g3-xcx.aibabel.cn/assets/mini/audio/call.mp3"
            loop="loop"
            ref="audio_call"
        />

        <audio
            v-show="false"
            src="https://g3-xcx.aibabel.cn/assets/mini/audio/du.mp3"
            ref="audio_du"
        />
        <div  style="width: 1px;height: 1px;position: absolute;top: -1px;left:-1px; display: none" id="cytherevideo"></div>
        <div style="width: 1px;height: 1px;position: absolute;top: -1px;left:-1px; display: none" id="cyherevideo"></div>
      </div>
       <!-- 动画 -->
       <div class="animation-window">
          <!-- <canvas id="animationCanvas" width="161" height="79"></canvas> -->
          <canvas id="animationCanvas" width="53" height="26"></canvas>
        </div>
      <footer class="bottom-bar">
        <!-- <el-image class="button" :src="require('@/assets/icon_calloff.png')" @click="stop"><p>挂断</p></el-image>
        <p class="p">挂断</p> -->
        <el-button type="cyan" style="width: 160px; " native-type="button" round @click="stop">挂 断</el-button>
      </footer>

    </div>

  </el-dialog>
</template>
<script>
import {message} from '@/components/message'
// import * as BRTC from '@/sdk/baidu.rtc.sdk1.2.3';
// import BRTC from 'baidurtc'
import {GetBRTToken, GetBRTTokenBySN} from "@/api/device";

export default {
  name: 'dialogInfo',
  data() {
    return {
      dialog_info_flag: false,  // 弹窗标记
      seconds: 0,
      minutes: 0,
      timerInterval: null,
      sn: '',
      task_id: '',
      user_id: 1,
      feedId: 8,//远端用户ID
      scene: '',
      key: '',
      // message: 'Hello Vue!',
      statustext_calling: '<span style="color:white">正在呼叫...</span>',
      statustext_connect: '<span style="color:white">通话中...</span>',
      calling: false,
      statustext_disconnect: '<span style="color:#e9e9e9">等待呼叫</span>',
      saystatus: '按住讲话',
      //通话标记
      isconnect: false,//是否拨通
      issend: false,
      input_brtcserver: "wss://rtc.exp.bcelive.com/janus",
      input_appid: '',
      input_token: '',
      input_roomname: '',
      input_userid: '',//用户ID
      input_rtmpserver: '',//直播转推流地址
      gRequest: '',
      defaultDeviceID: null,
      gDoPing: false,
      gDoPong: false,
      gPingStartupTime: 8000,
      gPingRepeatTime: 5000,
      gAsPublisher: true,
      gShareScreen: false,
      gRtmpmix: false,
      gRtmpMixLayoutIndex: '',
      gRecording: true,
      gAutoPlayMuted: true,
      gAutoPublish: true,
      gUsingData: true,
      gUsingVideo: false,
      gUsingAudio: true,
      gReceivingVideo: true,
      gReceivingAudio: true,
      gShowVideobps: true,
      gVideoProfile: 'hires',
      gScreenProfile: 'raw',
      gWaitPermissionTimeOutMs: 30000,
      gCandidateIP: null,
      gMediaServerIP: null,
      gShowSpinner: true,
      gUserEvent: true,
      gSessionEvent: true,
      gAutologin: false,
      // 'playing'
      gState: 'init',
      gBitRate: 1500,
      gAudioBitRate: null,
      gAudioStereo: true,
      gPreviewLocal: false,
      gUsingMessageAPI: false,
      gVolumeMonitor: true,
      gMirrorLocalVideo: true,
      gReportMonitorData: false,
      gReportEnv: 'online',
      gDynamicRemoteVideoView: true,
      gLog: "all",
      gName: 'brtc webclient',
      gMultiStreamSDK: true,
      gVideoCodec: 'h264', // 'vp8', 'vp9', 'h263', 'h265', 'h266', 'av1'

      gMuted: false,
      gVideoMuted: false,
      gPublished: true,
      audiooutputdeviceid: '',//音频输出ID
      isMobile: false,
      // audio_call: '',
      // audio_du: '',
      leftTime: 10 * 60 * 1000,
      showTime: "10:00",
      timeFlag: true,
      images: [],
      currentFrame: 0,
      animationId: null,
      isAnimating: false, // 动画播放状态
      lastUpdateTime: 0, // 上一次更新时间
      frameInterval: 200 // 帧间隔时间（毫秒）
      // audioOutputDevice:null,
    }
  },
  methods: {
    /**
     * 弹窗打开，动画结束时
     */

    openDialog() {
      //初始化页面参数
      this.timeFlag = true;
      // 初始值处理
      let editData = this.editData
      // console.log('editData:', editData)
      this.sn = editData.sn
      // this.task_id = editData.task_id
      // this.user_id = editData.user_id
      this.feedId = editData.bd_user_id
      // this.scene = editData.scene
      // this.key = editData.key
      // this.leftTime = editData.talkTime * 60 * 1000
      // this.showTime = editData.talkTime + ":00"
      // 初始化音视频实例
      console.warn('初始化音视频sdk')
      window.self = this;
      this.init();
    },
    closeDialog() {
      this.stop();
    },
    countTime(time) {
      console.log(time);
      let m;
      let s;
      if (time > 0) {
        m = Math.floor(time / 1000 / 60 % 60);
        s = Math.floor(time / 1000 % 60);
      } else {
        this.handleOver()
        return
      }
      time = time - 1000;
      let minute;
      let second;
      if (0 <= m && m <= 9) {
        minute = "0" + m;
      } else {
        minute = m;
      }
      if (0 <= s && s <= 9) {
        second = "0" + s;
      } else {
        second = s;
      }
      if (!this.timeFlag) {
        return
      }
      this.showTime = minute + ":" + second;
      console.log("time:" + minute + ":" + second);
      setTimeout(() => this.countTime(time), 1000);
    },
    /**
     * 初始化
     */
    init() {
      let sendData = {
        sn: this.sn,
        feed_id: this.feedId,

      };
      console.log('sendData', sendData)
      let data = JSON.stringify(sendData)
      GetBRTTokenBySN(data).then(response => {
        let data = response.data.data;
        this.input_appid = data.app_id;
        this.input_token = data.token;
        this.input_roomname = data.room_name;
        this.input_userid = data.user_id;
        this.feedId = this.feedId;
        console.log('data:', data)
        this.start();
      })


    },
    // sendVoice: function () {
    //   if (!this.isconnect) {
    //     return
    //   }
    //   this.issend = true;
    //   BRTC.BRTC_SetUserAttribute(
    //       JSON.stringify({key_down: 1})
    //   );
    // },
    // stopVoice: function () {
    //   this.issend = false;
    //   console.log(this.issend)
    //   BRTC.BRTC_SetUserAttribute(
    //       JSON.stringify({key_down: 0})
    //   );
    // },
    stop: function () {
      this.stopTimer();
      this.calling = false;
      console.log('通话结束，已挂断')
      if (this.isconnect) {
        message("通话结束，已挂断");
      }
      this.isconnect = false;
      window.BRTC_Stop();
      this.stopCall();
      this.dialog_info_flag = false;
      this.$emit("update:flag", false);
    },
    playCall: function () {
      this.$refs.audio_call.play();
    },
    stopCall: function () {
      this.$refs.audio_call.pause();
      this.$refs.audio_du.play();
    },
    getRemoteUsers() {
      let list = window.BRTC_GetRemoteUsers();
      if (list.length >= 2) {
        alert('当前设备正在通话中，稍后再试');
        return false;
      }
    },
    start() {
      let list = window.BRTC_GetRemoteUsers();
      if (list.length >= 2) {
        alert('当前设备正在通话中，稍后再试');
        return false;
      }
      this.calling = true;
      console.log('开始呼叫');
      this.playCall();
      let that = this;
      window.BRTC_MuteCamera(true)
      //开始呼叫
      window.BRTC_Start({
        debuglevel: 'false', // true, false, 'all', ['debug','log','error']
        server: this.input_brtcserver,
        appid: this.input_appid,
        token: this.input_token,
        autosubscribe: true,
        autopublish: true,
        usingvideo:false,
        // rtmpmix:true,
        // usingdatachannel:false,

        roomname: this.input_roomname,
        // videocodec: this.gVideoCodec, // 'h264', 'vp8', 'vp9', 'h263', 'h265', 'h266', 'av1'
        userid: this.input_userid,
        displayname: this.gName,
        remotevideoviewid: "cytherevideo",// 'therevideo',//远端window
        localvideoviewid: 'cyherevideo',//本地window
        // screensharevideoprofile: this.gScreenProfile,
        linkdownevent: function () {
          // console.log('linkdownevent');
        },
        linkupevent: function () {
          console.log('linkupevent');
        },
        userevent: this.gUserEvent,
        userevent_joinedroom: function (id, display, attribute) {
          console.log('userevent_joinedroom id: ' + id + ', display: ' + display + ', attribute:' + attribute);
        },
        userevent_leavingroom: function (id, display) {
          console.log('userevent_leavingroom id: ' + id + ', display: ' + display);
        },
        sessionevent: this.gSessionEvent,
        mediastate: function (medium, on) {
          console.log('send medium ' + medium + ' is: ' + on);
        },
        logintimeout: 10000,
        logintimeoutevent: function () {
          console.log('timeout');
        },
        showspinner: this.gShowSpinner,
        shownovideo: true,
        remotevideoloading: function (idx) {
        },
        remotevideoon: function (idx) {
          // console.log("remotevideoon:",idx);
        },
        remotevideooff: function (idx) {
          // console.log('remotevideooff, index:' + idx);
        },
        onremotestream: function (e, i, n, o) {
          console.log(' remote stream')
        },
        remotevideocoming: function (id, display, attribute) {
          console.log('订阅远端音频信息', display, attribute);
          that.isconnect = true;
          if (that.feedId == id) {
            // console.log('关闭静音')
            window.BRTC_MuteRemoteVideo(true);
            console.log('订阅的ID', id);
            that.calling = false;
            that.startTimer();
            setTimeout(() => {
              // that.message.success("已接通");
              console.log("已接通")
              // this.startTimer();
              that.$refs.audio_call.pause();
            }, 500);
            // setTimeout(() => {
            //   console.log('音频等级', window.BRTC_GetRemoteAudioLevels())
            // }, 2000)

          }
        },
        remotevideoleaving: function (id) {

          that.isconnect = false;
          // this.isconnect = false;
          if (that.feedId == id) {
            // that.message.error("设备已挂断");
            console.log("设备已挂断")
            that.calling = false;
            that.stop();
          }

        },
        remotevideounpublished: function (id) {
          console.log('remotevideounpublished, feedid');
        },
        remotedata: function (data, label) {
          console.log('got remote data');
        },
        success: function () {
          console.log('连接成功');
          // let user = BRTC.BRTC_GetRemoteUsers()
        },
        localvideopublishing: function () {
          console.log('本地视频开始发布的回调');
        },
        localvideopublished_ok: function () {
          console.log('本地视频成功发布到回调');
        },
        error: function (error) {
          if (error == "No WebRTC support... ") {
            alert('错误：当前浏览器不支持实时对讲，请换一款重试');
          } else {
            console.error(error)
          }
        },
        destroyed: function (error) {
        },
        onlocalstream: function (stream, name) {
          // local stream for display sonic wave
          // console.log('onlocalstream name: ' + name);
        },
        onlocalstream_end: function (name) {
          // end event of local stream
          // console.log('onlocalstream_end name: ' + name);
        },

        remotevideo_closed: function (feedid) {
          console.log('remotevideo_closed(feedid: ' + feedid + ') by server, please do SubScribing again');
        },
        onmessage: function (msg) {
          // event onmessage.
          console.log('onmessage id: ' + msg.id + ' data: ' + msg.data);
          // this.ref('#remotedata').append(msg.data);
        },
        onattribute: function (a) {
          console.log('订阅属性事件：', +a.id + ' attribute: ' + a.attribute + ' feedId：' + that.feedId);
          // event onattribute
          if (a.id == that.feedId) {
            let attribute = JSON.parse(a.attribute);
            if (attribute.feed_id != that.input_userid) {
              alert('当前设备正在通话中，稍后重试');
              this.stop();
            }
          }
          console.log('onattribute id: ' + a.id + ' attribute: ' + a.attribute);
        },
        onrtmpstreaming: function (mode, url, status) {
          // event onrtmpstreaming
          // console.log('onrtmpstreaming: mode: ' + mode + ', url: ' + url + ', status: ' + status);
        }
      });
    },
    videocallback: function (devices) {
      console.log('devices', devices);
    },
    getRemoteVideoInfo() {

    },
    startTimer() {
      this.seconds=0;
      this.minutes=0;
      this.timerInterval = setInterval(() => {
        this.seconds++;
        if (this.seconds === 60) {
          this.seconds = 0;
          this.minutes++;
        }
      }, 1000);
    },
    stopTimer() {
      clearInterval(this.timerInterval);
    },
    /**
     * 开启帧动画
     */
     loadImages() {
      for (let i = 0; i <= 3; i++) {
        const img = new Image();
        img.src = require(`@/assets/chat/frame${i}.png`);
        this.images.push(img);
      }

    },
    /**
     * 在canvas上绘制帧动画
     * @param timestamp
     */
    draw(timestamp) {
      if (!this.lastUpdateTime) {
        this.lastUpdateTime = timestamp; // 初始化 lastUpdateTime
      }

      // 计算时间差
      const deltaTime = timestamp - this.lastUpdateTime;

      // 如果经过的时间大于帧间隔时间，则绘制下一帧
      if (deltaTime >= this.frameInterval) {
        const canvas = document.getElementById('animationCanvas');
        const ctx = canvas.getContext('2d');

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 绘制当前帧图片
        ctx.drawImage(this.images[this.currentFrame], 0, 0, canvas.width, canvas.height);

        // 更新帧索引
        this.currentFrame = (this.currentFrame + 1) % this.images.length;

        // 更新上一次更新时间
        this.lastUpdateTime = timestamp;
      }

      // 请求下一帧
      this.animationId = requestAnimationFrame(this.draw.bind(this)); // 绑定 this
    },
    /**
     * 开始帧动画
     */
    startAnimation() {
      if (this.images.length === 0) {
        this.loadImages(); // 只在没有加载图片时加载
      }
      if (!this.animationId) {
        this.draw(); // 开始动画
      }
      // this.animationInterval = setInterval(() => {
      //   this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      //   this.drawFrame();
      // }, this.frameDuration);
    },
    /**
     * 停止帧动画
     */
    stopAnimation() {
      cancelAnimationFrame(this.animationId);
      this.animationId = null; // 重置动画ID
      this.currentFrame = 0; // 可以选择重置帧
    }

  },
  computed: {
    displayTime() {
      let displaySeconds = this.seconds < 10 ? "0" + this.seconds : this.seconds;
      let displayMinutes = this.minutes < 10 ? "0" + this.minutes : this.minutes;
      return displayMinutes + ":" + displaySeconds;
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
      this.dialog_info_flag = newValue;
      this.loadImages(); // 初始化时加载帧图片
      this.startAnimation();

    },
    editData: {
      handler(newValue, oldValue) {
        console.log(newValue)
      }
    }
  },
  mounted(){
    //  this.loadImages(); // 初始化时加载帧图片
    //   this.startAnimation();
  }
}
</script>
<style lang="less" scoped>
.dialog-style {
  //display: flex;
  //flex-direction: row;
  //flex-wrap: nowrap;
  align-content: center; //多根轴线对齐方式 space-around
  justify-content: center; //主轴对齐方式
  align-items: stretch; //交叉轴对其方式
  width: 100%;
  height: 90%;
  flex-direction: column;
  text-align: center;
}
::v-deep .el-dialog{
  background-image: url("../../../assets/bg_chat.jpg"); /* 设置背景图 */
  background-size: cover; /* 背景图覆盖整个元素 */
  background-repeat: no-repeat; /* 不重复背景图 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-top: 0 !important;
}

.wenda {
  padding: 1.1rem;
  flex: 1 0 35%;
}

.arrows_icon {
  width: 1.8rem;
  height: 1.8rem;
  float: right;
}

.title {
  text-align: center;
  font-size: 2rem;
}

.callbox {
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center; //多根轴线对齐方式 space-around
  justify-content: center; //主轴对齐方式
  align-items: center; //交叉轴对其方式
}

.top {
  padding: 2px;
  // flex: 1 1 4%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: space-around;
  justify-content: space-around;
  align-items: center;
  color: #303133;
  font-size: 12px;

}

.top p {
  line-height: 40px;
  font-size: 12px;
}

.mid {
  flex: 1 1 10%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: space-around;
  justify-content: flex-start;
  align-items: center;
  color: #303133;
  font-size: 12px;
}

.mid .connect-status {
  width: 70%;
  height: 33px;
  margin-bottom: 10px;
  //background-color: #585858;
  /*border: 1px solid;*/
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
}


.wrapper {
  height: 67vh;
  display: flex;
  flex-direction: column;
  text-align: center;

  .header {
    width: 96px;
    height: 96px;
    border-radius: 56px
  }

  .bottom-bar {
    width: 78%;
    height: unset;
    bottom: 0px;
    position: absolute;
    padding-bottom: 50px;
    justify-content: center;
    text-align: center;
    z-index: 99999999;

    .button {
      height: 42px;
      width: 118px;
      cursor: pointer;
    }

    .p {
      font-size: 12px;
      color: white;
      padding-top: 10px;
      margin-bottom: 30px;
    }
  }

}
.animation-window{
      // width: 100%;
      // height: 120px;
      //background: #25252d;
      position: absolute;
      z-index: 9;
      //right: 16px;
      top: 500px;
      //border: 1px solid #FFFFFF;
      left: 50%;
      transform: translateX(-50%);
      // display: flex;
      // justify-content: center;
      // align-items: center;
    }
.dialog-with-background {
  z-index: 1000;
  background-image: url("../../../assets/bg_chat.jpg"); /* 设置背景图 */
  background-size: cover; /* 背景图覆盖整个元素 */
  background-repeat: no-repeat; /* 不重复背景图 */
}

</style>


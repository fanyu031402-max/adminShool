<template>
  <el-dialog :visible.sync="dialog_info_flag" @close="closeDialog" width="360px" :close-on-click-modal="false"
             @opened="openDialog">
    <div class="wrapper">
      <div class="content">
        <!--画面div-->
        <div class="header-window">
          <el-avatar :size="120" :src="require('@/assets/header_ico.png')"></el-avatar>
        </div>
        <!--小画面div-->
        <div class="sub-window" ref='small'>
          <span class="loading-text" v-show='isDesc'>{{ desc }}</span>
          <span class="loading-text" v-show='!isDesc'>{{ showTime }}</span>
        </div>
        <!-- 动画 -->
        <div class="animation-window">
          <!-- <canvas id="animationCanvas" width="161" height="79"></canvas> -->
          <canvas id="animationCanvas" width="53" height="26"></canvas>
        </div>
        <!-- <footer class="bottom-bar">
          <el-image class="button" :src="require('@/assets/warning_call_ico.png')" @click="handleOver"></el-image>
        </footer> -->
        

      </div>
      <footer class="bottom-bar">
      <el-button type="cyan" style="width: 160px; " native-type="button" round @click="handleOver">挂 断</el-button>
    </footer>

    </div>
  </el-dialog>
</template>
<script>
import {message} from '@/components/message'
import * as WebRTC2 from '@/sdk/NIM_Web_NERTC_v4.6.21.js'

import config from '../../../../config'
import {getToken} from '@/utils/common'
import {close, closeAibabelSignal, disconnect} from "@/utils/imUtil";
// import { onMounted } from '@vue/composition-api';

export default {
  name: 'dialogInfo',
  data() {
    return {
      dialog_info_flag: false,  // 弹窗标记
      isSilence: false,
      isDesc: true,
      isStop: false,
      desc: '呼叫中...',
      client: null,
      channelName: '',
      nimChannelId: '',
      // localUid: Math.ceil(Math.random() * 1e5),
      localUid: 11111111,
      localStream: null,
      remoteStream: null,
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
      this.isDesc = true;
      this.isStop = false;
      this.desc = '正在呼叫对方...';
      this.client = null;
      this.localUid = Math.ceil(Math.random() * 1e5);
      this.localStream = null;
      this.remoteStream = null;
      this.timeFlag = true;

      // 初始值处理
      let editData = this.editData
      this.channelName = editData.sn
      this.nimChannelId = editData.nimChannelId
      this.leftTime = editData.talkTime * 60 * 1000
      this.showTime = editData.talkTime + ":00"

      // 初始化音视频实例
      console.warn('初始化音视频sdk')
      window.self = this
      this.client = WebRTC2.createClient({
        appkey: config.appkey,
        debug: true
      })
      //监听事件
      this.client.on('peer-online', evt => {
        console.warn(`${evt.uid} 远端用户加入房间`)
      })

      this.client.on('peer-leave', evt => {
        console.warn(`${evt.uid}远端用户离开房间`, "this.remoteStream.getId():" + this.remoteStream.getId())
        if (this.remoteStream.getId() === evt.uid) {
          this.remoteStream = null
          this.isDesc = true
          this.desc = '对方离开房间了'
          message(this.desc)
        }
        this.handleOver()
      })

      this.client.on('stream-added', evt => {
        let remoteStream = evt.stream;
        console.warn('收到对方发布的订阅消息: ', remoteStream.getId())
        console.warn('this.remoteStream: ', this.remoteStream)
        if (this.remoteStream && this.remoteStream.getId() !== remoteStream.getId()) {
          console.warn('房间里第三个人加入，忽略')
          message("对方正在通话中...")
          this.handleOver();
          return
        } else {
          this.remoteStream = remoteStream
        }
        this.subscribe(remoteStream)
      })

      this.client.on('stream-removed', evt => {
        let remoteStream = evt.stream;
        console.warn('对方停止订阅: ', remoteStream.getId())
        remoteStream.stop()
      })

      this.client.on('stream-subscribed', evt => {
        console.warn('收到了对端的流，准备播放')
        const remoteStream = evt.stream;
        remoteStream.setAudioVolume(100)
        //用于播放对方视频画面的div节点
        this.isDesc = false
        this.countTime(this.leftTime)
        const div = this.$refs.small
        remoteStream.play(div).then(() => {
          console.warn('播放音频')
        }).catch(err => {
          console.warn('播放对方音频失败了: ', err)
        })
      })

      this.getImToken().then(token => {
        this.joinChannel(token)
      }).catch(e => {
        message(e)
        console.error(e)
      })


    },
    closeDialog() {
      //关闭im
      try {
        console.warn('离开房间')
        this.timeFlag = false

        if (this.nimChannelId) {
          console.log("nimChannelId:", this.nimChannelId)
          disconnect(this.nimChannelId)
          close(this.nimChannelId)
        }
        this.client.leave()
        this.localStream.destroy()
        this.remoteStream.destroy()
        WebRTC2.destroy()
        closeAibabelSignal()
      } catch (e) {
        // 为了兼容低版本，用try catch包裹一下
      }
      setTimeout(() => {
        this.showTime = "10:00"
        this.leftTime = 10 * 60 * 1000
        this.dialog_info_flag = false;
        this.$emit("update:flag", false);
      }, 1000)

    },
    getImToken() {
      return getToken({
        uid: this.localUid,
        appkey: config.appkey,
        appSecret: config.appSecret,
        channelName: this.channelName
      }).then(token => {
        return token
      }, (e) => {
        throw e;
      });
    },
    joinChannel(token) {
      if (!this.client) {
        message('内部错误，请重新加入房间')
        return
      }
      console.info('开始加入房间: ', this.channelName)
      this.client.join({
        channelName: this.channelName,
        uid: this.localUid,
        token,
      }).then(data => {
        console.info('加入房间成功，开始初始化本地音视频流')
        this.initLocalStream()
      }).catch(error => {
        console.error('加入房间失败：', error)
        message(`${error}: 请检查appkey或者token是否正确`)
        this.closeDialog()
      })
    },
    initLocalStream() {
      //初始化本地的Stream实例，用于管理本端的音视频流
      this.localStream = WebRTC2.createStream({
        uid: this.localUid,
        audio: true, //是否启动mic
        video: false, //是否启动camera
        screen: false, //是否启动屏幕共享
      })

      //设置本地音频质量
      this.localStream.setAudioProfile('speech_low_quality')
      // this.localStream.setAudioProfile('speech_standard')
      //启动媒体，打开实例对象中设置的媒体设备
      this.localStream.init().then(() => {
        console.warn('音视频开启完成，可以播放了')
        // const div = self.$refs.large
        // this.localStream.play(div)
        this.localStream.play()
        // this.localStream.setLocalRenderMode({ // 设置视频窗口大小
        //     width: div.clientWidth,
        //     height: div.clientHeight,
        //     cut: true // 是否裁剪
        // })
        // 发布
        this.publish()
      }).catch(err => {
        console.warn('音视频初始化失败: ', err)
        message('音视频初始化失败')
        this.localStream = null
      })
    },
    publish() {
      console.warn('开始发布视频流', this.localStream.sampleRate)
      //发布本地媒体给房间对端
      this.client.publish(this.localStream).then(() => {
        console.warn('本地 publish 成功')
      }).catch(err => {
        console.error('本地 publish 失败: ', err)
        message('本地 publish 失败')
      })
    },
    subscribe() {
      this.remoteStream.setSubscribeConfig({
        audio: true,
        video: true
      })
      this.client.subscribe(this.remoteStream).then(() => {
        console.warn('本地 subscribe 成功')
      }).catch(err => {
        console.warn('本地 subscribe 失败: ', err)
        message('订阅对方的流失败')
      })
    },
    handleOver() {
      this.closeDialog()
    },
    countTime(time) {
      // console.log(time);
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
      // console.log("time:" + minute + ":" + second);
      setTimeout(() => this.countTime(time), 1000);
    },
    /**
     * 开启帧动画
     */
     loadImages() {
      for (let i = 0; i <= 3; i++) {
        const img = new Image();
        // img.src = require(`@/assets/chat/frame${i}.png`);
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
  }
}
</script>
<style scoped lang="less">
::v-deep .el-dialog{
  background-image: url("../../../assets/bg_chat.jpg");
}
.wrapper {
  height: 67vh;
  // background-image: url("../../../assets/bg_chat.jpg"); 
  display: flex;
  flex-direction: column;
  text-align: center;

  .content {
    flex: 0.85;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    .el-avatar{
      background: none;
    }

    .main-window {
      height: 100%;
      margin: 0 auto;
    }

    .header-window {
      width: 100%;
      height: 120px;
      position: absolute;
      top: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .animation-window{
      // width: 100%;
      // height: 120px;
      //background: #25252d;
      // position: absolute;
      // z-index: 9;
      //right: 16px;
      // top: 430px;
      //border: 1px solid #FFFFFF;
      // display: flex;
      // justify-content: center;
      // align-items: center;
    }

    .sub-window {
      width: 100%;
      height: 40px;
      top: 210px;
      position: absolute;
      z-index: 9;
      margin: 0 auto;
      background-color: transparent;

      .loading-text {
        display: block;
        width: 100%;
        text-align: center;
        line-height: 40px;
        font-size: 12px;
        color: #303133;
        font-weight: 400;
        background-color: transparent;
      }
    }
  }


  .bottom-bar {
    // width: 100%;
    height: unset;
    position: absolute;
    bottom: 30px;
    justify-content: center;
    text-align: center;
    z-index: 99999999;
    left: 50%;
    transform: translateX(-50%);

    .button {
      height: 68px;
      width: 68px;
      margin-bottom: 30px;
      cursor: pointer;
      // background-image: url('../../../assets/warning_call_ico.png');
    }
  }


  .tab-bar {
    height: 120px;
    list-style: none;
    display: inline;
    align-items: center;
    color: #fff;
    position: fixed;
    bottom: 120px;
    text-align: center;
    margin: 0px auto;

    li {
      height: 68px;
      width: 125px;
      margin-bottom: 30px;
      cursor: pointer;
      //结束按钮
      &.over {
        // background: url("../../../assets/warning_call_ico.png") no-repeat center;
        background-size: 68px 68px;

        &:hover {
          // background: url("../../../assets/warning_call_ico.png") no-repeat center;
          background-size: 68px 68px;
        }

        &:active {
          // background: url("../../../assets/warning_call_ico.png") no-repeat center;
          background-size: 68px 68px;
        }
      }
    }
  }
}
</style>


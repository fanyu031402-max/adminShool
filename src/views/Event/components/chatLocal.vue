<template>
  <!-- <div>
    <h2>WebRTC 呼叫 SIP 客户端</h2>
    <input v-model="target" placeholder="目标 SIP 如 1000">
    <button @click="makeCall">呼叫</button>
    <button @click="hangup">挂断</button>
    <p>{{ status }}</p>
    <audio ref="remoteAudio" autoplay></audio>
  </div> -->
  <el-dialog :visible.sync="dialog_info_flag" @close="closeDialog" width="360px" :close-on-click-modal="false">
    <!-- <p>{{ status }}</p> -->
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
          <canvas id="animationCanvas" width="53" height="26"></canvas>
        </div>
      </div>
      <footer class="bottom-bar">
        <el-button type="cyan" style="width: 160px; " native-type="button" round @click="hangup">挂
          断</el-button>
      </footer>
      <audio ref="remoteAudio" autoplay></audio>
    </div>
  </el-dialog>
</template>

<script>
import { message } from '@/components/message'
import JsSIP from 'jssip';
import { getServerConfig } from '@/utils/serverConfig'
// import { getIMSocketURL } from "@/utils/imUtil";
export default {
  data() {
    return {
      target: '1000',
      status: '未连接',
      ua: null,
      session: null,
      dialog_info_flag: false,  // 弹窗标记
      isSilence: false,
      isDesc: true,
      isStop: false,
      desc: '呼叫中...',
      client: null,
      channelName: '',
      leftTime: 10 * 60 * 1000,
      showTime: "10:00",
      timeFlag: true,
      images: [],
      currentFrame: 0,
      animationId: null,
      isAnimating: false, // 动画播放状态
      lastUpdateTime: 0, // 上一次更新时间
      frameInterval: 200, // 帧间隔时间（毫秒）
      reconnectAttempts: 0,
      maxReconnectAttempts: 3, // 新增：最大重连次数
      reconnectInterval: 3000,
      ip: null,
      localStream: null, // 新增：存储本地音频流，用于挂断时释放
      isManualDisconnect: false, // 新增：标记是否为手动断开连接
      // audioOutputDevice:null,
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
    async flag(newValue, oldValue) {
      this.dialog_info_flag = newValue;
      if (newValue) {
        this.loadImages(); // 初始化时加载帧图片
        this.startAnimation();
        await this.initSIP()
        this.openDialog()
      }
    },
    editData: {
      handler(newValue, oldValue) {
        console.log(newValue)
      }
    }
  },
  mounted() {
    // this.initSIP()
    //  this.loadImages(); // 初始化时加载帧图片
    //   this.startAnimation();
  },
  beforeDestroy() {
    if (this.session) {
      // this.session.terminate()
    }
    if (this.ua) {
      this.ua.stop()
    }
  },
  methods: {
    getIMSocketURL() {
      // 从配置服务获取协议和IP
      const config = getServerConfig()
      let protocol = 'wss:'
      let host = ''
      
      // 如果服务类型是本地服务，使用配置的协议和IP
      if (config.serviceType === 'local') {
        // 根据配置的协议确定WebSocket协议
        protocol = config.protocol === 'https' ? 'wss:' : 'ws:'
        host = config.ip || 'localhost'
      } else {
        // 线上服务，从window.location获取（兼容原有逻辑）
        const url = new URL("/ws", window.location)
        protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        host = url.hostname
      }
      
      // 端口固定为8089
      const port = '8089'
      const wsUrl = `${protocol}//${host}:${port}/ws`
      console.log('WebSocket URL:', wsUrl, 'Config:', config)
      return wsUrl
    },
    openDialog() {
      //初始化页面参数
      this.isDesc = true;
      this.isStop = false;
      this.desc = '正在呼叫对方...';
      this.timeFlag = true;
      this.reconnectAttempts = 0; // 重置重连计数器
      this.isManualDisconnect = false; // 重置手动断开标记

      // 初始值处理
      let editData = this.editData
      this.leftTime = editData.talkTime * 60 * 1000
      this.showTime = editData.talkTime + ":00"
      console.log(editData, 'editData')
      // this.target=editData.sn
      setTimeout(() => {
        this.makeCall()
      }, 2000)
    },
    closeDialog() {
      //关闭im
      // 标记为手动断开，避免触发重连逻辑
      this.isManualDisconnect = true;
      
      // 1. 终止 SIP 会话（若存在）
      // if (this.session) {
      // this.session.terminate()
      //   // this.session.terminate(); // 彻底终止通话会话
      //   this.session = null; // 清空会话变量
      // }

      // 2. 停止本地音频流（核心：释放麦克风）
      if (this.localStream) {
        // 获取流中的所有轨道（此处仅音频轨道），逐一停止
        this.localStream.getTracks().forEach(track => {
          track.stop(); // 停止轨道，释放麦克风资源
        });
        this.localStream = null; // 清空流变量
      }

      // 3. 停止 SIP 客户端（若存在）
      if (this.session) {
        // this.session.terminate(); // 彻底终止通话会话
        this.session = null; // 清空会话变量
        if (this.ua) {
          this.ua.stop()
        }
        this.ua = null
        //  this.session.terminate()
      }

      // 4. 额外：停止动画和计时（可选，根据业务需求）
      this.stopAnimation();
      this.timeFlag = false; // 停止倒计时
      
      // 5. 重置重连计数器
      this.reconnectAttempts = 0;

      setTimeout(() => {
        this.showTime = "10:00"
        this.leftTime = 10 * 60 * 1000
        this.dialog_info_flag = false;
        this.$emit("update:flag", false);
        // 重置手动断开标记
        this.isManualDisconnect = false;
      }, 1000)
    },
    initSIP() {
      let url = this.getIMSocketURL()
      console.log(url, this.$store.state.userInfo.sipId, '11122222')
      let ip = url.split('/')[2]
      console.log(ip, 'ip')
      this.ip = ip.split(':')[0]
      console.log(this.ip, 'this.ip')
      // let socket;
      //  socket = new WebSocket(url);
      try {
        console.log(this.$store.state,'111')
        JsSIP.debug.enable('JsSIP:*')
        // const socket = new JsSIP.WebSocketInterface('wss://192.168.1.154:8089/ws')
        const socket = new JsSIP.WebSocketInterface(url)
        const config = {
          sockets: [socket],
          // uri: 'sip:20001@192.168.1.154',
          uri: 'sip:' + this.$store.state.userInfo.sipId + '@' + this.ip,
          password: this.$store.state.userInfo.sipId,
          // password: '20001',
          session_timers: false,
          rtcConfiguration: {
            iceServers: [{ urls: 'stun:stun.voipbuster.com:3478' }],
            iceTransportPolicy: 'all'
          },
          sessionDescriptionHandlerFactoryOptions: {
            peerConnectionOptions: {
              iceGatheringTimeout: 2000,
              rtcConfiguration: {
                iceServers: [{ urls: 'stun:stun.voipbuster.com:3478' }]
              }
            },
            disableTrickleIce: false
          }
        }
        this.ua = new JsSIP.UA(config)
        this.ua.start()

        // // 网络状态监测
        //   this.startNetworkMonitoring()

        this.ua.on('connected', () => {
          this.status = '已连接'
        })

        this.ua.on('disconnected', () => {
          this.status = 'disconnected'
          this.handleDisconnection()
        })

        this.ua.on('registered', () => {
          this.status = '已注册'
        })

        this.ua.on('registrationFailed', () => {
          this.handleDisconnection()
        })

        this.ua.on('transportCreated', () => {
          this.status = 'connecting'
        })
      } catch (err) {
        console.error('SIP初始化失败:', err)
        this.handleDisconnection()
      }
    },
    handleDisconnection() {
      // 如果是手动断开连接（挂断），不进行重连和错误提示
      if (this.isManualDisconnect) {
        console.log('手动断开连接，跳过重连逻辑');
        return;
      }
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.status = '连接中'
        this.reconnectAttempts++
        console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => {
          this.initSIP()
        }, this.reconnectInterval)
      } else {
        message('连接服务器失败，请检查网络')
        this.closeDialog()
      }
    },
    startNetworkMonitoring() {
      this.networkCheckInterval = setInterval(() => {
        if (!navigator.onLine) {
          this.status = 'disconnected'
          this.handleDisconnection()
        }
      }, 5000)
    },

    makeCall() {
      console.log('makeCall')
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      }).then(stream => {
        // 新增：存储本地音频流
        this.localStream = stream;
        console.log("获取音频成功", stream);
        // this.session = this.ua.call(`sip:10002@192.168.1.154`, {
          this.session = this.ua.call(`sip:${this.editData.sip_id}@${this.ip}`, {
          mediaConstraints: { audio: true, video: false },
          pcConfig: {
            iceServers: [],
            sessionTimers: false,
            iceTransportPolicy: 'all',
            mediaConstraints: { audio: true, video: false },
            mediaStream: stream, // 可选：部分 SIP 库需显式传入本地流
          },
          sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false },
            alwaysAcquireMediaFirst: true,
            disableTrickleIce: true,
            earlyMedia: false
          }
        })

        this.session.connection.addEventListener('track', (event) => {
          console.log("收到远端音频轨道:", event.track);
          const remoteStream = new MediaStream()
          remoteStream.addTrack(event.track)
          this.$refs.remoteAudio.srcObject = remoteStream
          this.$refs.remoteAudio.play()
        })
        this.session.on("failed", () => {
          this.status = '通话失败事件触发'
          message("发起对讲失败")
          this.closeDialog()
        });

        this.session.on('ended', () => {
          this.status = '通话结束'
          message("通话结束")
          this.closeDialog()
        })

        this.session.on('confirmed', () => {
          this.isDesc = false
          console.log(this.leftTime, 'this.leftTime')
          this.countTime(this.leftTime)
          this.status = '通话中'
        })

        this.session.on('peerconnection', (e) => {
          e.peerconnection.addEventListener('iceconnectionstatechange', () => {
            if (e.peerconnection.iceConnectionState === 'disconnected') {
              message('网络连接不稳定')
            }
          })
        })
      }).catch(err => {
        console.error("获取音频失败", err)
        message("请授权麦克风权限后再呼叫")
      })
    },
    hangup() {
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
        // this.closeDialog()
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
  }
}
</script>
<style scoped lang="less">
::v-deep .el-dialog {
  background-image: url("../../../assets/bg_chat.jpg");
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 67vh;

  //  padding:40px 0;
  .content {
    height: 73%;
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: space-between;
    margin: 40px 0;
    position: relative;

    .sub-window {
      margin-top: 10px;
    }

    .animation-window {
      position: absolute;
      bottom: 0;
    }
  }
}
</style>

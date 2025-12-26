
<template>
    <div class="recorder-container">
      <el-button
        type="primary"
        :icon="microphoneIcon"
        @mousedown.native="startRecording"
        @mouseup.native="stopRecording"
        @touchstart.native="startRecording"
        @touchend.native="stopRecording"
        :loading="isLoading"
        :disabled="!isSupported"
        round
      >
        {{ buttonText }}
      </el-button>
      
      <!-- <el-progress 
        v-if="isRecording"
        :percentage="recordingProgress"
        :stroke-width="12"
        :format="formatProgress"
      /> -->
      
      <!-- <audio 
        v-if="audioUrl"
        :src="audioUrl"
        controls
        class="audio-player"
      /> -->
    </div>
  </template>
  
  <script>
  import { ElMessage } from 'element-ui'
  
  export default {
    name: 'AudioRecorder',
    data() {
      return {
        isRecording: false,
        isLoading: false,
        isSupported: false,
        audioUrl: '',
        mediaRecorder: null,
        audioChunks: [],
        recordingTime: 0,
        timer: null,
        maxDuration: 60 // 最大录音时长(秒)
      }
    },
    computed: {
      microphoneIcon() {
        return this.isRecording ? 'el-icon-turn-off-microphone' : 'el-icon-microphone'
      },
      buttonText() {
        if (!this.isSupported) return '浏览器不支持录音'
        return this.isRecording ? `录音中...${this.recordingTime}s` : '一键喊话'
      },
      recordingProgress() {
        return Math.min((this.recordingTime / this.maxDuration) * 100, 100)
      }
    },
    mounted() {
      this.checkSupport()
    },
    methods: {
      formatProgress() {
        return `${this.recordingTime}/${this.maxDuration}s`
      },
      checkSupport() {
        this.isSupported = !!(
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia &&
          window.MediaRecorder
        )
        if (!this.isSupported) {
          ElMessage.error('当前浏览器不支持录音功能')
        }
      },
      async startRecording(e) {
        e.preventDefault() // 防止移动端触发页面滚动
        if (!this.isSupported || this.isRecording) return
        
        try {
          this.isLoading = true
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 44100,
              channelCount: 1,
              echoCancellation: true
            }
          })
          
          this.mediaRecorder = new MediaRecorder(stream)
          this.audioChunks = []
          this.recordingTime = 0
          
          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              this.audioChunks.push(e.data)
            }
          }
          
          this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
            this.audioUrl = URL.createObjectURL(audioBlob)
            this.$emit('record-complete', audioBlob)
            stream.getTracks().forEach(track => track.stop())
          }
          
          this.mediaRecorder.start(100) // 每100ms收集一次数据
          this.isRecording = true
          this.startTimer()
        } catch (error) {
          this.handleError(error)
        } finally {
          this.isLoading = false
        }
      },
      stopRecording() {
        if (!this.isRecording) return
        clearInterval(this.timer)
        this.mediaRecorder.stop()
        this.isRecording = false
      },
      startTimer() {
        this.timer = setInterval(() => {
          this.recordingTime++
          if (this.recordingTime >= this.maxDuration) {
            this.stopRecording()
            ElMessage.warning(`已达到最大录音时长${this.maxDuration}秒`)
          }
        }, 1000)
      },
      handleError(error) {
        console.error('录音错误:', error)
        let message = '录音失败'
        if (error.name === 'NotAllowedError') {
          message = '请允许麦克风访问权限'
        } else if (error.name === 'NotFoundError') {
          message = '未找到录音设备'
        }
        ElMessage.error(message)
      }
    },
    beforeDestroy() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop()
      }
      clearInterval(this.timer)
    }
  }
  </script>
  
  <style scoped>
  .recorder-container {
    display: inline-block;
    /* flex-direction: column; */
    /* align-items: center; */
    /* gap: 15px; */
    /* padding: 20px; */
    /* background: #f5f7fa; */
    margin-right: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  .audio-player {
    width: 100%;
    margin-top: 15px;
  }
  </style>
  
<template>
    <div class="custom-audio">
      <!-- 隐藏的原生audio元素 -->
      <audio :src="src" ref="audioEl" @timeupdate="updateTime"></audio>
      
      <!-- 自定义控制界面 -->
      <div class="controls">
        <el-button 
          :type="isPlaying ? 'danger' : 'primary'" 
          @click="togglePlay"
          circle
          :icon="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"
        />
        
        <!-- 自定义进度条 -->
        <div class="progress" @click="seekAudio">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
          <div class="buffer-bar" :style="{ width: bufferProgress + '%' }"></div>
        </div>
        
        <!-- 时间显示 -->
        <span class="time">{{ formattedTime }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      src: String,
      active: Boolean
    },
    data() {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        bufferProgress: 0
      }
    },
    computed: {
      formattedTime() {
        const format = t => {
          const m = Math.floor(t / 60).toString().padStart(2, '0')
          const s = Math.floor(t % 60).toString().padStart(2, '0')
          return `${m}:${s}`
        }
        return `${format(this.currentTime)} / ${format(this.duration)}`
      },
      progress() {
        return (this.currentTime / this.duration) * 100 || 0
      }
    },
    watch: {
      active(newVal) {
        if (!newVal && this.isPlaying) {
          this.pause()
        }
      }
    },
    methods: {
      initAudio() {
        const audio = this.$refs.audioEl
        audio.addEventListener('loadedmetadata', () => {
          this.duration = audio.duration
        })
        audio.addEventListener('progress', () => {
          if (audio.buffered.length > 0) {
            this.bufferProgress = (audio.buffered.end(0) / audio.duration) * 100
          }
        })
        audio.addEventListener('ended', this.pause)
      },
      togglePlay() {
        this.$emit('toggle', !this.isPlaying)
      },
      play() {
        this.$refs.audioEl.play()
        this.isPlaying = true
      },
      pause() {
        this.$refs.audioEl.pause()
        this.isPlaying = false
      },
      stop() {
        this.pause()
        this.$refs.audioEl.currentTime = 0
        this.currentTime = 0
      },
      updateTime() {
        this.currentTime = this.$refs.audioEl.currentTime
      },
      seekAudio(e) {
        const rect = e.target.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        this.$refs.audioEl.currentTime = percent * this.duration
      }
    },
    mounted() {
      this.initAudio()
    },
    beforeDestroy() {
      this.stop()
    }
  }
  </script>
  
  <style scoped>
  .custom-audio {
    background: #434b63;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .progress {
    flex: 1;
    height: 6px;
    background: #ebeef5;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  
  .progress-bar {
    position: absolute;
    height: 100%;
    background: #409EFF;
    transition: width 0.2s ease;
    z-index: 1;
  }
  
  .buffer-bar {
    position: absolute;
    height: 100%;
    background: #dcdfe6;
  }
  
  .time {
    font-size: 12px;
    color: #909399;
    min-width: 100px;
    text-align: center;
  }
  
  .el-button {
    transition: transform 0.2s;
  }
  
  .el-button:hover {
    transform: scale(1.1);
  }
  </style>
  
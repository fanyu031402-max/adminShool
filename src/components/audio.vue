<template lang="html">
  <div class="vue-audio-container" @click.stop.prevent="startPlay">
    <slot></slot>
    <audio class="vue-audio"
            :muted="muted"
            :autoplay="autoplay"
            :preload="preload"
            :src="source"
            :loop="loop"
            @ended="_ended"
            @playing="_playing"
            @pause="_pause"
            @error="_error"
            @timeupdate="_timeupdate"
            @waiting="_waiting">
    </audio>
  </div>
</template>

<script>
import * as constant from './constant'
import  '../styles/audio.less'
import { EventBus } from "@/utils/event";
let currentTarget
export default {
  name:'vue-audio',
  data () {
    return {
      audios: []
    }
  },
  props: {
    source: {
      type: String,
      required: true,
      validator: function (value) {
        return value
      }
    },
    mode: {
      type: Number,
      default: constant.SINGLE
    },
    index: {
      type: Number,
      default: 0,
      required: true
    },
    preload: {
      type: String,
      default: 'none',
      validator: function (value) {
        return value === 'none' || value === 'auto' || value === 'metadata'
      }
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    muted: {
      type: Boolean,
      default: false
    }
  },
  mounted () {
    this.$nextTick(function () {
      this.audios = document.getElementsByClassName('vue-audio')
    });
    EventBus.$on("OnCurrentPageChanged", function (currentPage) {
      this.audios = document.getElementsByClassName('vue-audio')
      if (currentTarget){
        let audio = currentTarget.querySelector('audio')
        audio.pause()
        audio.currentTime = 0
      }
    });

  },
  computed: {
    loop () {
      return this.mode === constant.LOOP
    }
  },
  methods: {
    startPlay (e) {
      let target = e.currentTarget
      let audio = target.querySelector('audio')
      if (audio.paused || audio.ended) {
        audio.play()
      } else {
        audio.pause()
      }
    },
    _timeupdate (e) {
      this.$emit('timeupdate', e)
    },
    _playing (e) {
      this.$emit('playing', e)
      let ele = e.path ? e.path[1] : e.target.parentElement
      this._stopOther(ele)
    },
    _pause (e) {
      this.$emit('pause', e)
    },
    _waiting (e) {
      this.$emit('waiting', e)
    },
    _ended (e) {
      this.$emit('ended', e)
      this._modeControl()
    },
    _error (e) {
      this.$emit('error', e)
    },
    _modeControl () {
      // single mode
      if (this.mode === constant.SINGLE) {
        return
      }
      let index = this.index
      let nextIndex
      // order mode
      if (this.mode === constant.ORDER && index < this.audios.length - 1) {
        nextIndex = index + 1
        this.audios[nextIndex].play()
        return
      }

      // circulation mode
      if (this.mode === constant.CIRCULATION) {
        if (index === this.audios.length - 1) {
          nextIndex = 0
        } else {
          nextIndex = index + 1
        }
        this.audios[nextIndex].play()
        return
      }

      // random mode
      if (this.mode === constant.RANDOM) {
        nextIndex = Math.floor((this.audios.length - 1) * Math.random())
        if (nextIndex >= index) {
          nextIndex += 1
        }
        this.audios[nextIndex].play()
      }
    },
    _stopOther (target) {
      // stop other audio which is playing
      if (currentTarget && currentTarget !== target) {
        let audio = currentTarget.querySelector('audio')
        audio.pause()
        audio.currentTime = 0
      }
      currentTarget = target
    },
     stopAll () {
      // stop all audio which is playing
      console.log(currentTarget)
        let audio = currentTarget.querySelector('audio')
        audio.pause()
        audio.currentTime = 0
    }
  },

}
</script>
<style lang="less" scoped>
  .vue-audio-container {
    position: relative;
    display: inline-block;
  }
</style>

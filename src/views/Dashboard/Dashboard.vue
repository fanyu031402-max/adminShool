<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 左侧主区域 -->
      <el-col :xs="24" :sm="24" :md="24">
        <!-- 欢迎板块 -->
        <el-card class="welcome-card" shadow="hover">
          <div class="welcome-content">
            <div class="welcome-info">
              <h2>👋 欢迎回来，{{ username }}！</h2>
              <div class="time-info">
                <div class="current-date">{{ formattedDate }}</div>
                <div class="current-time">{{ currentTime }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- <el-row :gutter="12" class="device—total"> -->
        <!-- <el-col  v-for="(item,index) in deviceInfo" :key="index"> -->
        <div class="device—total">
          <div v-for="(item, index) in deviceInfo">
            <div class="data-card">
              <!-- <div class="card-icon"> -->
              <!-- <i :class="item.icon"></i> -->
              <span :class="'device_icon' + (index + 1)"></span>
              <!-- </div> -->
              <div class="card-content">
                <div class="value">{{ item.total }}</div>
                <div class="label">{{ item.label }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- </el-col> -->
        <!-- </el-row> -->

        <!-- 事件统计图 -->
        <el-card class="stat-card" shadow="hover">
          <h3>📊 事件报警趋势分析</h3>
          <div class="changeTime">
            <el-radio-group v-model="eventTime" size="medium" @change="handleEventTimeChange">
              <el-radio-button label="本周"></el-radio-button>
              <el-radio-button label="上周"></el-radio-button>
              <el-radio-button label="本月"></el-radio-button>
              <!-- <el-radio-button label="深圳"></el-radio-button> -->
            </el-radio-group>
          </div>
          <!-- 数据卡片组 -->
          <el-row :gutter="12" class="stats-row">
            <el-col :xs="12" :sm="8" :md="4" v-for="(item, index) in stats" :key="index">
              <div class="data-card" :class="'type-' + item.type">
                <div class="card-icon">
                  <!-- <i :class="item.icon"></i> -->
                  <svg-icon :icon-class="item.icon" class-name="card-panel-icon" />
                </div>
                <div class="card-content">
                  <div class="value">{{ item.value }}</div>
                  <div class="label">{{ item.label }}</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- 趋势分析图 -->
          <div class="chart-section">
            <div ref="chart" style="height: 280px;"></div>
          </div>
        </el-card>

         <!-- 事件统计图 -->
         <el-card class="stat-card" shadow="hover" style="margin-top: 20px;">
          <h3>⚠️ 报警房间TOP5</h3>
          <div class="changeTime">
            <el-radio-group v-model="roomRank" size="medium" @change="handleRoomRankChange">
              <el-radio-button label="本周"></el-radio-button>
              <el-radio-button label="上周"></el-radio-button>
              <el-radio-button label="本月"></el-radio-button>
              <!-- <el-radio-button label="深圳"></el-radio-button> -->
            </el-radio-group>
          </div>
          <!-- 趋势分析图 -->
          <div class="chart-section">
            <div ref="chartRank" style="height: 280px;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧侧边栏 -->
      <!-- <el-col :xs="24" :sm="24" :md="10">
        实时事件列表
        <el-card class="realtime-card" shadow="hover">
          <div class="card-header">
            <h3>⚠️ 最新事件</h3>
          </div>
          <div class="scroll-list">
            <div 
              v-for="(alert, index) in listData"
              :key="index"
              class="event-card"
              :class="'level-1'"
            >
              <div class="card-body">
                <div class="meta-info">
                  <div class="device-info">
                    <div class="event-time"> 设备：{{ alert.sn }}</div>
                    <div class="event-time"> 房间：{{ alert.room }}</div>
                    <div class="event-time">
                    <i class="el-icon-time"></i>
                    {{ alert.created_at }}
                  </div>
                  </div>
                </div>
                <div class="keywords-box">
                  <span class="keywords-list">
                    {{ getEvent(alert.event_type) + "[" + alert.keyword + "]" }}
                  </span>
                </div>
                <div class="audio-control">
                 事件音频：
                  <vue-audio
                    :source="alert.audio_url"
                    :index="alert.id"
                    :mode="mode"
                    @playing="playing"
                    @pause="pause"
                    @ended="ended"
                    @waiting="waiting"
                    @error="error">
                  <div class="player">
                    <svg class="progress" :width="svgOptions.width" :height="svgOptions.height">
                      <path :fill="svgOptions.fill" :stroke="svgOptions.stroke"
                            :stroke-width="svgOptions.strokeWidth"></path>
                    </svg>
                    <a class="play" href="javascript:void(0)">
                    </a>
                  </div>
                </vue-audio>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        最新通知
        <el-card shadow="hover" class="notice-box">
          <h3>📢 最新通知</h3>
          <div class="notice-list">
            <div 
              v-for="(notice, index) in notices"
              :key="index"
              class="notice-item"
            >
              <div class="notice-header">
                <el-tag 
                  size="mini" 
                  type="primary"
                >
                  消息
                </el-tag>
                <span class="notice-time">{{ notice.time }}</span>
              </div>
              <div class="notice-title">{{ notice.title }}</div>
              <p class="notice-content">{{ notice.content }}</p>
            </div>
          </div>
        </el-card>
      </el-col> -->
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
// import {GetDeviceList} from "@/api/device";
import vueAudio from "@/components/audio";
import * as constant from '@/components/constant'
import { getEventType } from "@/utils/common";
import { GetLatestEvent } from "@/api/event";
import * as apis from '@/api/console.js';

export default {
  components: {
    vueAudio
  },
  data() {
    return {
      eventTime: '本周',
      roomRank:'本周',
      deviceInfo: [
        {
          label: '设备总数',
          total: 0
        },
        {
          label: '在线设备',
          total: 0
        }
      ],
      listData: [],
      mode: constant.SINGLE,
      svgOptions: {
        width: 40,
        height: 40,
        fill: 'none',
        stroke: '#007aff',
        strokeWidth: 2
      },
      stats: [
        { type: 'total', label: '总报警', value: 0, icon: 'total' },
        { type: 'play', label: '玩闹', value: 0, icon: 'peoples' },
        { type: 'conflict', label: '冲突', value: 0, icon: 'fight' },
        { type: 'bully', label: '欺凌', value: 0, icon: 'danger' },
        { type: 'false', label: '误报', value: 0, icon: 'misreport' },
        { type: 'unknown', label: '不确定', value: 0, icon: 'unknown' }
      ],
      username: this.$store.state.userInfo.username,
      currentTime: '',
      formattedDate: '',
      currentAudio: null,
      audioState: {},
      chartLine: null,
      chartRankInst: null,
    }
  },
  mounted() {
    this.initChart()
    this.initChartRank()
    this.updateTime()
    this.getAlarmList()
    this.fetchTrendData()
    this.fetchRoomRank()
    setInterval(this.updateTime, 1000)
    window.addEventListener('resize', this.handleResize)


    // this.getLatestEvent();
    // let that = this;
    // EventBus.$on("parentHandleDevice", function (deviceId, isOnline) {
    //   that.parentHandleDevice(deviceId, isOnline);
    // });
    // EventBus.$on("parentHandleEvent", function (data) {
    //   that.parentHandleEvent(data);
    // });
  },
  methods: {
    async getAlarmList() {
      const { data } = await apis.realTimeDevAlarm()
      this.deviceInfo[0].total = data.data.deviceTotal.deviceCount
      this.deviceInfo[1].total = data.data.deviceTotal.online
    },
    /**
    * 获取事件类型
    */
    getEvent(event_type) {
      return getEventType(event_type)
    },
    /**
    * 获取最近消息列表
    */
    getLatestEvent() {
      let params = { pagesize: 20 };
      GetLatestEvent(params).then(response => {
        let data = response.data.data.data;
        data.forEach(item => {
          this.$set(item, 'hidden', true)
        })
        this.listData = data;
        console.log("listData: ", this.listData)
      })
    },
    playing(e) {
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.PLAY_CLASS
      // preEle.style.display = "none"
      console.log("开始了", ele)
    },
    pause(e) {
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.PAUSE_CLASS
      console.log("暂停了", ele.querySelector('a').className)
    },
    ended(e) {
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.PAUSE_CLASS
      console.log("停止了", ele.querySelector('a').className)
    },
    waiting(e) {
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.LOAD_CLASS
    },
    error(e) {

    },
    initChartRank(){
      const chart = echarts.init(this.$refs.chartRank)
      this.chartRankInst = chart
      const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '10%',
            right: '20px',
            top: '10%',
            bottom: '2%',
            containLabel: true
        },
        legend: {
            show: false,
        },
        xAxis: {
            type: 'category',
            data: [],
            splitLine: {
                show: false
            },
            axisTick: {
            },
            axisLabel: {
                color: '#ccc'
            },
            axisLine: {
                lineStyle: {
                    color: '#ccc'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '',
            nameTextStyle: {
                color: '#ccc'
            },
            axisTick: {
            },
          axisLine: { lineStyle: { color: '#ccc' } },
          splitLine: {
            show: true,
            lineStyle: {
              color: "rgba(28, 130, 197, .3)",
              type: "dashed",
            },
          },
        },

        series: [{
            name: '',
            type: 'bar',
            barWidth: 25,
            data: [],
            label: {
                show: true,
                position: 'top',
                color: '#ccc',
                formatter: '{c}'
            },
            itemStyle: {
                normal: {
                    barBorderRadius: [15, 15, 0, 0],
                    color: new echarts.graphic.LinearGradient(
                        0, 0, 0, 1, [{
                                offset: 1,
                                color: 'rgba(95, 175, 255, 0)'
                            },
                            {
                                offset: 0,
                                color: 'rgba(95, 175, 255, .9)'
                            }
                        ]
                    )
                }
            },
        }]
    }
      chart.setOption(option)
    },

    initChart() {
      const chart = echarts.init(this.$refs.chart)
      this.chartLine = chart
      const option = {
        grid: {
          left: '10%', //距离左侧边距
          right: '10%',
          top: '15%',
          bottom: '10%'
        },
        legend: {
          show: true,
          textStyle: {
            fontSize: 14, //字体大小
            color: '#ccc'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const alarm = params.find(p => p.seriesName === '报警数量')
            const unhandled = params.find(p => p.seriesName === '未处理数量')
            const alarmText = alarm ? `${alarm.seriesName}: ${alarm.data}次` : ''
            const unhandledText = unhandled ? `${unhandled.seriesName}: ${unhandled.data}次` : ''
            return [params[0].axisValue, alarmText, unhandledText].filter(Boolean).join('<br/>')
          }
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLine: { lineStyle: { color: '#ccc' } },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#ccc' } },
          splitLine: {
            show: true,
            lineStyle: {
              color: "rgba(28, 130, 197, .3)",
              type: "dashed",
            },
          },
        },
        series: [{
          name: '报警数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: 'rgba(95, 175, 255, .8)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(95, 175, 255, 0)' },
              { offset: 1, color: 'rgba(95, 175, 255, .5)' }
            ])
          },
          data: []
        },
        {
          name: '未处理数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: 'rgba(255, 116, 133, .8)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 116, 133, 0)' },
              { offset: 1, color: 'rgba(255, 116, 133, .5)' }
            ])
          },
          data: []
        }
        ]
      }
      chart.setOption(option)
      chart.on('click', (params) => {
        if (params.seriesName === '未处理数量') {
          this.$router.push({ name: 'events', params: { type: 1 } }); // 使用 Vue Router 跳转页面
        }
      });
    },
    async fetchTrendData() {
      try {
        const { data } = await apis.statsEvent({ type: this.eventTime=='本月'?3:this.eventTime=='上周'?2:1 })
        const payload = data.data || {}
        const xAxis = payload.infos.x || []
        const alarmData = payload.infos.y_totals || []
        const untreatedData = payload.infos.y_unhandled || []
        const totals = payload.totals || []

        // 更新顶部统计卡片
        this.stats = this.stats.map(stat => {
          const matched = totals.find(t => t.name === stat.label)
          return matched ? { ...stat, value: matched.value || 0 } : { ...stat, value: 0 }
        })

        if (this.chartLine) {
          this.chartLine.setOption({
            xAxis: { data: xAxis },
            series: [
              { name: '报警数量', data: alarmData },
              { name: '未处理数量', data: untreatedData },
            ]
          })
        }
      } catch (err) {
        console.error('获取趋势图数据失败', err)
      }
    },
    async fetchRoomRank() {
      try {
        const { data } = await apis.statsRoom({ type: this.eventTime=='本月'?3:this.eventTime=='上周'?2:1 })
        const payload = data.data || {}
        const categories = payload.x || []
        const values = payload.y || []
        if (this.chartRankInst) {
          this.chartRankInst.setOption({
            xAxis: { data: categories },
            series: [{ data: values }]
          })
        }
      } catch (err) {
        console.error('获取房间排行数据失败', err)
      }
    },
    handleEventTimeChange() {
      this.fetchTrendData()
    },
    handleRoomRankChange() {
      this.fetchRoomRank()
    },
    updateTime() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('zh-CN', { hour12: false })
      this.formattedDate = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    },
    handleAudio(index, url) {
      if (this.currentAudio === index) {
        this.stopAudio()
      } else {
        this.playAudio(index, url)
      }
    },
    playAudio(index, url) {
      this.stopAudio()
      this.currentAudio = index
      this.audioState = { ...this.audioState, [index]: 'playing' }
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => {
        this.audioState = { ...this.audioState, [index]: 'paused' }
        this.currentAudio = null
      }
    },
    stopAudio() {
      if (this.currentAudio !== null) {
        document.querySelectorAll('audio').forEach(audio => audio.pause())
        this.audioState = { ...this.audioState, [this.currentAudio]: 'paused' }
        this.currentAudio = null
      }
    },
    formatDuration(seconds) {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}:${s.toString().padStart(2, '0')}`
    },
    handleResize() {
      this.chartLine && this.chartLine.resize()
      this.chartRankInst && this.chartRankInst.resize()
    }
  },
  beforeDestroy() {
    this.chartLine && this.chartLine.dispose()
    this.chartRankInst && this.chartRankInst.dispose()
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="less" scoped>
.dashboard-container {
  background: #252a39;

  ::v-deep .el-radio-button__inner {
    background: #434b63;
    color: #ccc;
    border: 1px solid #575d6e;
  }

  ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner {
    background: #409EFF;
    color: #fff;
  }

  h3 {
    font-size: 18px;
    color: #ccc;
    font-weight: bold;
    display: inline-block;
  }

  .changeTime {
    display: inline-block;
    float: right;
    margin-top: 20px;
  }

  .el-card {
    border-radius: 8px;
    background-color: #2c3348;
    color: #ccc;
    border: none;
  }

  .welcome-card {
    margin-bottom: 20px;
    // background-image: linear-gradient(to bottom, #d9ecff, #ffffff);

    .welcome-content {
      display: flex;
      justify-content: space-between;

      .welcome-info {
        display: flex;
        justify-content: space-between;
        width: 100%;

        h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .time-info {
          margin-left: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;

          .current-date {
            color: #ccc;
          }

          .current-time {
            color: #ccc;
            font-size: 24px;
          }
        }

        .quick-stats {
          display: flex;
          gap: 30px;
          margin-top: 20px;
        }
      }

      .weather-card {
        text-align: center;
        padding: 15px;
        background: rgba(24, 144, 255, 0.1);

        .el-icon-sunny {
          font-size: 36px;
          color: #fadb14;
        }

        .temp {
          display: block;
          font-size: 24px;
        }

        .status {
          color: #606266;
        }
      }
    }
  }

  .realtime-card {
    margin-bottom: 20px;

    .scroll-list {
      max-height: 400px;
      overflow-y: auto;

      .event-card {
        margin: 12px 0;
        padding: 16px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-left: 4px solid;

        &.level-1 {
          border-color: #ff4d4f;
        }

        &.level-2 {
          border-color: #faad14;
        }

        .meta-info {
          display: flex;
          justify-content: space-between;
          // margin-bottom: 12px;

          .device-info .el-tag {
            margin-right: 8px;
          }

          .event-time {
            color: #909399;
            line-height: 22px;
          }
        }

        .keywords-box {
          margin: 5px 0 12px 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;

          .el-tag {
            margin-right: 8px;
          }

          .keywords-list {
            color: #ff4d4f;
          }
        }

        .audio-control {
          display: flex;
          // justify-content: space-between;
          align-items: center;
          color: #909399;

          .duration {
            color: #909399;
            font-size: 12px;
          }
        }
      }
    }
  }


  .notice-box {
    .notice-item {
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;

      .notice-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .notice-time {
          margin-left: auto;
          color: #909399;
          font-size: 12px;
        }
      }

      .notice-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .notice-content {
        margin: 0;
        color: #606266;
        font-size: 13px;
      }
    }
  }
}

.device—total {
  display: flex;
  justify-content: space-between;

  &>div {
    width: calc(50% - 12px);
  }

  margin-bottom: 20px;

  .data-card {
    padding: 0px 50px;
    // background: #ccc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    height: 115px;
    border-radius: 8px;
    color: #ccc;
    background-image: linear-gradient(to right, #31374b, #252a39);

    .device_icon1 {
      display: inline-block;
      width: 70px;
      height: 70px;
      background: url('../../assets/device_icon2.png') no-repeat center;
      background-size: 100%;
      margin-right: 40px;
    }

    .device_icon2 {
      display: inline-block;
      width: 70px;
      height: 70px;
      background: url('../../assets/device_icon1.png') no-repeat center;
      background-size: 100%;
      margin-right: 40px;
    }

    // .device_icon2{
    //   display:inline-block;
    //   width:50px;
    //   height:60px;
    //   background
    // }

    .svg-icon {
      width: 40px;
      height: 40px;
    }

    .card-content {
      .value {
        font-size: 28px;
        font-weight: bold;
        line-height: 40px;
        // font-family:electronicFont;
      }

      .label {
        font-size: 16px;
        font-weight: bold;
        // color: #666;
      }
    }
  }
}

.stats-row {
  margin-bottom: 20px;
  margin-top: 30px;

  .data-card {
    padding: 16px;
    background: #434b63;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;

    .svg-icon {
      width: 40px;
      height: 40px;
    }

    .card-icon {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;

      i {
        font-size: 20px;
        color: white;
      }
    }

    .card-content {
      .value {
        font-size: 18px;
        font-weight: 600;
      }

      .label {
        font-size: 12px;
        color: #ccc;
      }
    }

    // 卡片类型配色
    &.type-total .card-icon {
      color: #36a3f7;
    }

    &.type-play .card-icon {
      color: #40c9c6;
    }

    &.type-conflict .card-icon {
      color: #f56c6c;
    }

    &.type-bully .card-icon {
      color: #e6a23c;
    }

    &.type-false .card-icon {
      color: #909399;
    }

    &.type-unknown .card-icon {
      color: #b388ff;
    }
  }
}

.chart-section {
  h3 {
    margin: 0 0 20px 0;
    font-size: 16px;
  }
}
</style>

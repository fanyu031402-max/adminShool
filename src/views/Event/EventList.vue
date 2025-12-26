<template>
  <div class="app-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <el-form style="min-height: 40px" :inline="true" :model="searchForm" ref="searchForm">
            <!--  <el-form-item class="item-search" label="设备编号：" >
                <el-input v-model="searchForm.sn" class="search-min-width" placeholder="请输入设备编号"></el-input>
              </el-form-item>-->
         <el-form-item label="绑定房间：" prop="binding">
              <el-cascader
                  class="el-cascader"
                  size="small"
                  :options="options"
                  :props="{ checkStrictly: true }"
                  v-model="searchForm.binding"
                  @change="changeRoom"
                  ref="cascaderRoom"
                  collapse-tags
                  clearable></el-cascader>
            </el-form-item>
            <el-form-item class="item-search" label="发生时间：">
              <el-date-picker
                  style="width: 300px;"
                  size="small"
                  v-model="searchForm.date_value"
                  type="daterange"
                  format="yyyy-MM-dd"
                  value-format="yyyy-MM-dd"
                  align="right"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期">
              </el-date-picker>
            </el-form-item>


<!--            <el-form-item label="事件类型：" prop="value">
              <el-select v-model="searchForm.value" clearable placeholder="请选择">
                <el-option
                    v-for="item in categoryOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>-->

            <el-form-item>
              <el-button size="mini" type="primary" @click="search()">查询</el-button>
            </el-form-item>
            <el-form-item>
              <el-button size="mini" @click="resetData">重置</el-button>
            </el-form-item>
          </el-form>
        <!-- <el-select
          v-model="filterStatus"
          placeholder="处理状态"
          clearable
          class="filter-item"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-item"
        /> -->
      </div>

    <!-- 卡片列表 -->
    <el-row :gutter="20" class="card-list">
      <el-col v-for="(item, index) in listData" :key="index" :xs="24" :sm="12">
        <div class="data-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="device-id">
              <i class="el-icon-monitor"></i>
              {{ item.sn }}
            </div>
            <!-- :type="item.label=='0'?'danger':item.label=='1'?'warning':item.label=='2'?'success':''" -->
            <el-tag :type="item.label == '1' ? 'primary' : item.label == '2' ? 'danger' : item.label == '3' ? 'warning' : item.label == '4' ? 'success' : item.label == '5' ? 'no' : item.label == '0' ?'info':'info'" effect="dark" class="status-tag">
              {{
                item.label == '1' ? '玩闹' : item.label == '2' ? '谩骂欺凌' : item.label == '3' ? '冲突' : item.label == '4' ? '误报' : item.label == '5' ? '不确定' : item.label == '0' ?'未处理':'未处理'
              }}
            </el-tag>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body">
            <div class="content-row">
              <span class="label">敏感词：</span>
              <div class="sensitive-word">
                <!-- {{ item.keyword }} -->
                <span class="risk-level" :style="riskStyle('2')">
                  {{ item.keyword }}
                </span>
              </div>
            </div>

            <div class="content-row">
              <span class="label">发生地点：</span>
              <div class="location" :title="item.room">
                <i class="el-icon-location-outline"></i>
                <span class="room-text">{{ item.room }}</span>
              </div>
            </div>

            <div class="content-row">
              <span class="label">发生时间：</span>
              <div class="timestamp">
                <i class="el-icon-time"></i>
                {{ item.created_at }}
              </div>
            </div>

            <!-- 音频播放 -->
            <!-- <div class="audio-player">
                <div class="audio-control" @click="toggleAudio(item)">
                  <i :class="['el-icon', item.playing ? 'el-icon-video-pause' : 'el-icon-video-play']"></i>
                  <el-progress 
                    :percentage="item.progress"
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
                <span class="duration">{{ item.duration }}s</span>
              </div> -->
            <!-- <audio-player 
              :src="item.audio_url"
              :auto-stop="true"
              v-if="listData.length>0"
              :ref="`player_${item.id}`"
              @play-started="handleNewPlay(item.id)"
        /> -->
            <!-- <audio-player 
            ref="audioPlayers"
            :src="item.audio_url"
            @end="handleTrackEnd(item.id)"
          /> -->
            <audio-player ref="players" :src="item.audio_url" :active="activeIndex === index"
              @toggle="handleToggle(index, $event)" />

          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <el-button type="danger" icon="el-icon-phone-outline" class="detail-btn" @click="callOther(item)">
              对讲
            </el-button>
            <el-button type="primary" icon="el-icon-document" class="detail-btn" @click="showDetail(item)">
              详情
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    <div class="paging">
      <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :page-sizes="[10, 20, 30, 50, 100]" :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="pagination.total">
      </el-pagination>
    </div>
    <DialogChat :flag.sync="dialog_chat" :editData="editData" @update:flag="onDialogClose" />
    <DialogChatLocal :flag.sync="dialog_chat_local" :editData="editData" @update:flag="onDialogClose" />
  </div>
</template>

<script>
import AudioPlayer from './components/audio.vue'
import { webListEvent } from "@/api/event";
import DialogChat from "./components/chat";
import { checkBrowser } from "@/utils/common";
import { GetInfoById, IsTalk } from "@/api/event";
import { getServiceType } from "@/utils/serverConfig";
import DialogChatLocal from "./components/chatLocal.vue";
import {GetRoomsByBinding} from "@/api/room";
import { call, close, disconnect, initWebRTC3 } from "@/utils/imUtil";
import { EventBus } from "@/utils/event";
export default {
  filters: {
    formatTime(val) {
      return '2025-05-09 21:12:36'
    }
  },
  components: { AudioPlayer,DialogChat,DialogChatLocal },
  data() {
    return {
      // 搜索关键字
      searchForm: {
        // sn: "",
        date_value: '',
        binding: [],
        value: [],
        start_time:"",
        end_time:"",
        house:"",
        floor:"",
        room:"",
        type:0
      },
      currentPlayingId: null,  // 当前播放项的唯一标识
      audioElements: new Map(), // 存储音频实例
      filterStatus: '',
      filterDate: [],
      statusMap: {
        0: { type: 'danger', label: '未处理' },
        1: { type: 'warning', label: '处理中' },
        2: { type: 'success', label: '已处理' }
      },
      listData: [
      ],
      activeIndex: null,
      pagination: {
        pageSize: 10,
        pageNumber: 1,
        total: 0
      },
      talkTime: 10,
      sip_id:"",
      dialog_chat: false,
      dialog_chat_local:false,
      editData: {},
      options: [],
      localUid: -1,
    }
  },
  mounted() {
    this.fetchUserList()
    this.getRooms();
  },
  beforeDestroy() {
    // 确保组件销毁时清理事件监听
    this.unregisterTalkEvents();
  },
  computed: {
    filteredData() {
      // 实际过滤逻辑
      return this.listData
    },
    riskStyle() {
      return (level) => ({
        color: ['#67C23A', '#E6A23C', '#F56C6C'][level - 1],
        borderColor: ['#67C23A', '#E6A23C', '#F56C6C'][level - 1]
      })
    }
  },
  methods: {
     /**
     * 请求所有房间
     */
    getRooms() {
      this.binding = []
      let requestData = {is_binding: 0};
      if (this.binding.length === 0) {
        GetRoomsByBinding(requestData).then(response => {
          if (response.data.data.length === 0) {
            this.showPlaceholder = '暂无数据';
            return;
          }
          let arr=[]
          arr = response.data.data.map(house => {
      return {
        ...house,
        children: house.children.map(floor => {
          return {
            ...floor,
            children: floor.children.map(room => {
              return {
                ...room,
                value: room.label // 将第三层的value替换为label
            };
          }) || []
        };
      }) || []
    };
    
  })
  this.options = arr;
        })
      }
    },
    changeRoom(event){
      if(event.length==3){
        this.searchForm.type=3
        this.searchForm.room=event[2]
        this.searchForm.floor=event[1]
        this.searchForm.house=event[0]
      }else if(event.length==2){
        this.searchForm.type=2
        this.searchForm.room=""
        this.searchForm.floor=event[1]
        this.searchForm.house=event[0]
      }else if(event.length==1){
        this.searchForm.type=1
        this.searchForm.room=""
        this.searchForm.floor=""
        this.searchForm.house=event[0]
      }
    },
    search(){
      if (this.searchForm.date_value.length > 0) {
        this.searchForm.start_time = this.searchForm.date_value[0];
        this.searchForm.end_time = this.searchForm.date_value[1];
      }
      this.fetchUserList()
    },
    resetData(){
   this.searchForm={
        // sn: "",
        date_value: '',
        binding: [],
        value: [],
        start_time:"",
        end_time:"",
        house:"",
        floor:"",
        room:"",
        type:0
      }
      this.fetchUserList()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.fetchUserList()
    },
    handleCurrentChange(page) {
      this.pagination.pageNumber = page
      this.fetchUserList()
    },
    handleToggle(index, state) {
      if (this.activeIndex === index) {
        state ? this.resumeTrack() : this.pauseTrack()
      } else {
        this.playTrack(index)
      }
    },
    playTrack(index) {
      // 停止当前播放
      if (this.activeIndex !== null) {
        this.$refs.players[this.activeIndex].stop()
      }

      // 开始新播放
      this.activeIndex = index
      this.$nextTick(() => {
        this.$refs.players[index].play()
      })
    },
    pauseTrack() {
      this.$refs.players[this.activeIndex].pause()
    },
    resumeTrack() {
      this.$refs.players[this.activeIndex].play()
    },
    // 更新数据状态
    updateListData(id, newState) {
      this.listData = this.listData.map(item =>
        item.id === id ? { ...item, ...newState } : item
      )
    },
    async fetchUserList() {
      const { data } = await webListEvent({ pageSize: this.pagination.pageSize, pageNumber: this.pagination.pageNumber ,start_time:this.searchForm.start_time,end_time:this.searchForm.end_time,binding:this.searchForm.binding,house:this.searchForm.house,floor:this.searchForm.floor,room:this.searchForm.room,type:this.searchForm.type,date_value:this.searchForm.date_value})
      this.listData = data.data.data
      this.listData.map(item => ({
        ...item,
        playing: false
      }));
      this.pagination.total = data.data.total
    },
    showDetail(item) {
      this.$router.push('/events/' + item.id)
    },
     //打开对讲弹窗
    openChatDialog(params){
      if (getServiceType() === 'online') {
        this.dialog_chat = true;
      } else {
        this.dialog_chat_local = true;
      }
      // 子组件赋值
      this.editData = Object.assign({}, params);
    },
    // 注册对讲事件监听（点击对讲时调用）
    registerTalkEvents() {
      let that = this;
      // 先取消之前的监听，避免重复注册
      this.unregisterTalkEvents();
      
      // 3代报警器
      EventBus.$on("onAimAccept", function (event) {
        that.editData.nimChannelId = event.nimChannelId
        that.editData.sn = event.sn
        that.editData.talkTime = that.talkTime
        that.editData.localUid = that.localUid
        that.openChatDialog(that.editData)
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
    callOther(params){
      // 线上服务走公网接口，本地服务走局域网接口
      if (getServiceType() === 'online') {
        this.callOtherLine(params)
      } else {
        this.callOtherLocal(params)
      }
    },
     callOtherLine(item) {
      let params = { id: parseInt(item.id) };
      let sn = item.sn;
      // let yx_opp_accid;
      let localUid=Math.ceil(Math.random() * 1e5)
      //  GetInfoById(params).then(response => {
      //   yx_opp_accid=data.device.yx_accid
      // })
      // if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
      //   IsTalk(params).then(response => {
      //     let data = response.data.data;
      //     if (data.isTalk) {
      //       this.talkTime = data.talkTime;
      //       call(localUid, item.sn, yx_opp_accid, localUid)
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
            let userId = this.$store.state.userInfo.user_id;
            this.localUid=localUid
            console.log(localUid,'localUid')
            initWebRTC3(parseInt(item.id), item.sn, userId, localUid, 1, "company");
          } else {
            this.$message({
              message: "该事件已经过去一段时间了，不能发起对讲了",
              type: "error"
            })
          }

        })
      }

    },
     callOtherLocal(item) {
      let params = { id: parseInt(item.id) };
      let sn = item.sn;

       GetInfoById(params).then(response => {
        this.sip_id=data.device.sip_id
      })

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
      if (sn.includes("TSA010") || sn.includes("RSA010") || sn.includes("HSA010")) {
        IsTalk(params).then(response => {
          let data = response.data.data;
          if (data.isTalk) {
            this.talkTime = data.talkTime;
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              // this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
            this.openChatDialog({talkTime:this.talkTime,sn:item.sn,sip_id:this.sip_id})
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
  }
}
</script>

<style lang="less" scoped>
@import '@/styles/page.less';
.el-tag--no{
  background-color: #c68cea;
  border-color: #c68cea;
  color: #fff;
}
.app-container {
  // padding: 20px;
  // background: #f5f7fa;
  height: calc(100vh - 40px);

  .card-list {
    height: calc(100vh - 140px);
    overflow-y: auto;
  }

  .card-list::-webkit-scrollbar {
    width: 0;
  }

  .paging {
    margin-top: 20px;
  }
}

.filter-bar {
  padding: 0px 20px;
  // background: #fff;
  border-radius: 8px;
  // margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .filter-item {
    margin-right: 15px;
    width: 200px;
  }
  ::v-deep .el-range-editor--small .el-range-input{
    background: transparent;
  }
  ::v-deep .el-form-item__label {
    color: #d1cccc;
  }
  ::v-deep .el-date-editor .el-range-separator,::v-deep .el-range-editor--small .el-range-input{
    color: #ccc;
  }
  ::v-deep .el-form-item{
    margin-bottom: 0;
  }
}

.data-card {
  background: #2c3348;
  border-radius: 12px;
  margin: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  .device-id {
    font-size: 16px;
    color: #d1cccc;
    font-weight: 500;

    i {
      margin-right: 8px;
      color: #409EFF;
    }
  }

  .status-tag {
    border-radius: 12px;
    padding: 0 12px;
    height: 26px;
    line-height: 26px;
  }
}

.card-body {
  .content-row {
    display: flex;
    align-items: center;
    margin: 12px 0;
    font-size: 14px;

    .label {
      color: #909399;
      min-width: 80px;
    }

    .sensitive-word {
      color: #303133;
      font-weight: 500;

      .risk-level {
        // margin-left: 10px;
        font-size: 12px;
        border: 1px solid;
        border-radius: 4px;
        padding: 2px 6px;
      }
    }

    .location,
    .timestamp {
      color: #d1cccc;
      flex: 1;
      overflow: hidden;

      i {
        margin-right: 5px;
      }
      
      .room-text {
        display: inline-block;
        max-width: calc(100% - 20px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }
  }
}

.audio-player {
  margin: 20px 0;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;

  .audio-control {
    display: flex;
    align-items: center;
    cursor: pointer;

    i {
      font-size: 24px;
      color: #409EFF;
      margin-right: 15px;
    }

    ::v-deep .el-progress {
      flex: 1;
    }
  }

  .duration {
    display: block;
    text-align: right;
    color: #ccc;
    font-size: 12px;
    margin-top: 5px;
  }
}

.card-footer {
  // border-top: 1px solid #575d6e;
  padding-top: 15px;
  text-align: right;

  .detail-btn {
    padding: 10px 20px;
    border-radius: 20px;
  }
}

@media (max-width: 768px) {
  .data-card {
    margin: 8px;
    padding: 15px;
  }

  .card-header .device-id {
    font-size: 15px;
  }
}
</style>
<template>
  <div class="app-container">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <el-form style="height: 40px" :inline="true" :model="searchForm" ref="searchForm">
        <el-form-item class="item-search" label="设备编号：">
          <el-input size="small" v-model="searchForm.sn" class="search-min-width" placeholder="请输入设备编号"></el-input>
        </el-form-item>
        <el-form-item label="绑定房间：" class="item-search">
          <el-input size="small" v-model="searchForm.address" class="search-min-width" placeholder="请输入绑定房间"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" @click="search()">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button size="mini" @click="resetData">重置</el-button>
        </el-form-item>
      </el-form>
      <!-- <el-select
          v-model="filterStatus"
          placeholder="设备编号"
          clearable
          class="filter-item"
        >
          <el-option
            v-for="item in snOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select> -->
      <!-- <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-item"
        /> -->
      <div class="sortBtn">
        离在线： <i @click="sortTable('1')" class="el-icon-sort-up"></i> <i @click="sortTable('2')" class="el-icon-sort-down"></i>
      </div>
    </div>
    <!-- 卡片列表 -->
    <el-row class="card-list">
      <el-col v-for="(item, index) in listData" :key="index" :xs="24" :sm="12">
        <div class="data-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="device-id">
              <i class="el-icon-monitor"></i>
              {{ item.sn }}
            </div>
            <el-tag :type="item.isOnline == '1' ? 'success' : 'info'" effect="dark" class="status-tag">
              {{ item.isOnline == '1' ? '在线' : '离线' }}
            </el-tag>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body">
            <!-- <div class="content-row">
              <span class="label">敏感词：</span>
              <div class="sensitive-word">
                {{ item.keyword }}
                <span class="risk-level" :style="riskStyle(item.event_type)">
                  {{ item.event_type }}级
                </span>
              </div>
            </div> -->

            <div class="content-row">
              <span class="label">绑定房间：</span>
              <div class="location" :title="item.room">
                <i class="el-icon-location-outline"></i>
                <span class="room-text">{{ item.room }}</span>
              </div>
            </div>
            <div class="content-row">
              <span class="label">版本：</span>
              <div class="location">
                <i class="el-icon-tickets"></i>
                {{ item.app_version }}
              </div>
            </div>
            <div class="content-row">
              <span class="label">上线时间：</span>
              <div class="timestamp">
                <i class="el-icon-time"></i>
                {{ item.onlineTimer }}
              </div>
            </div>
            <div class="content-row">
              <span class="label">离线时间：</span>
              <div class="timestamp">
                <i class="el-icon-time"></i>
                {{ item.offlineTimer }}
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <!-- <audio-recorder></audio-recorder> -->
            <!-- @click="rebootDevice(item)" -->
             <el-button  type="primary"  class="detail-btn"
          @click="callOther(item)">对讲
        </el-button>
            <el-button type="danger"  @click="rebootDevice(item)" icon="el-icon-switch-button" class="detail-btn" >
              重启
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
    <BRTChatDialog :flag.sync="dialog_brtchat" :editData="brtData" />
  </div>
</template>

<script>
import {
  getDeviceList,
  RebootDevice
} from "@/api/device";
import {
  checkBrowser
} from "@/utils/common";
import BRTChatDialog from "./dialog/BRTChat";
import DialogChat from "./dialog/chat";
import { call, close, disconnect, initWebRTC3 } from "@/utils/imUtil";
import { EventBus } from "@/utils/event";
import DialogChatLocal from "../Event/components/chatLocal.vue";
import { GetInfoById, IsTalk } from "@/api/event";
import { getServiceType } from "@/utils/serverConfig";
export default {
  components: { BRTChatDialog,DialogChat,DialogChatLocal },
  data() {
    return {
      // 搜索关键字
      searchForm: {
        sn: "",
        address: ""
      },
      currentPlayingId: null,  // 当前播放项的唯一标识
      audioElements: new Map(), // 存储音频实例
      filterStatus: '',
      filterDate: [],
      listData: [],
      snOptions: [],
      activeIndex: null,
      pagination: {
        pageSize: 10,
        pageNumber: 1,
        total: 0
      },
      editData: {},
      localUid: -1,
      dialog_chat: false,
      dialog_chat_local:false,
      dialog_brtchat: false,
      talkTime: 10,
      brtData: {
        sn: '',
        task_id: '',
        user_id: -1,
        feed_id: -1,
        scene: 'xy',
        key: 'a',
      },
    }
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
    sortTable(type) {
      console.log('123')
      if (type == 1) {
        this.listData.sort((a, b) => {
          return (b.isOnline - a.isOnline)
        })
      } else {
        this.listData.sort((a, b) => {
          return (a.isOnline - b.isOnline)
        })
      }
    },
    resetData() {
      this.searchForm.sn = ''
      this.searchForm.address = ''
      this.fetchUserList()
    },
    search() {
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
    async fetchUserList() {
      const { data } = await getDeviceList({ pageSize: this.pagination.pageSize, pageNumber: this.pagination.pageNumber, sn: this.searchForm.sn, address: this.searchForm.address })
      this.listData = data.data.data
      this.listData.map(item => ({
        ...item,
      }));
      this.pagination.total = data.data.total
    },
    /**
     * 重启设备
     */
    rebootDevice(params) {
      let requestData = { type: 1, sn: params.sn }
      RebootDevice(requestData).then(response => {
        let data = response.data
        this.$message({
          message: data.msg,
          type: "success"
        })
      })
    },
     /**
     * 发起对讲
     */
    callOtherLine(params) {
      if(params.isOnline===0){
        this.$message({
          message: '设备不在线，无法接通',
          type: "info"
        });
        return;
      }

      let sn = params.sn;
      this.editData.sn=sn
      console.log(this.editData,sn,'123')
      // if (sn.includes("HSA") || sn.includes("SSA010")) {//AI呼叫器
      //   if(params.sn.includes("HSA010")){
      //      if (!checkBrowser('chrome') && !checkBrowser('safari')) {
      //         // this.isSupport = false;
      //         this.$message.error("对讲功能只支持Google浏览器72及以上版本")
      //         return;
      //       }
      //       // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
      //       let localUid = Math.ceil(Math.random() * 1e5);
      //       let userId = this.$store.state.userInfo.user_id;
      //       initWebRTC3(0, params.sn, userId, localUid, 2, "company");
      //   }else{
      //   // 子组件赋值
      //   this.brtData = Object.assign({}, params);
      //   // this.brtData.user_id = parseInt(getBdUserId()); 
      //   this.dialog_brtchat = true;
      //   }
      // } else if (sn.includes("TSA001") || sn.includes("RSA002") || sn.includes("RSA003")) {//校园防欺凌报警器2代
      //       call(this.localUid, params.sn, params.yx_accid, this.localUid)
      //         .then(response => {
      //           console.log('呼叫成功了')
      //         })
      // } else
       if (sn.includes("TSA010") || sn.includes("RSA010") || sn.includes("HSA010")) {
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              // this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
            // 点击对讲时注册事件监听
            this.registerTalkEvents();
            // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
            let localUid = Math.ceil(Math.random() * 1e5);
            let userId = this.$store.state.userInfo.user_id;
            initWebRTC3(0, params.sn, userId, localUid, 2, "company");
      }

    },
    callOtherLocal(params) {
      if(params.isOnline===0){
        this.$message({
          message: '设备不在线，无法接通',
          type: "info"
        });
        return;
      }

      let sn = params.sn;
      this.editData.sn=sn


       if (sn.includes("HSA") || sn.includes("SSA010")) {//AI呼叫器
        // 子组件赋值
        this.brtData.sn = sn;
        this.dialog_brtchat = true;
      }
      else if (sn.includes("TSA010") || sn.includes("RSA010")) {
        // IsTalk(params).then(response => {
          // let data = response.data.data;
          // if (data.isTalk) {
            // this.talkTime = data.talkTime;
            if (!checkBrowser('chrome') && !checkBrowser('safari')) {
              // this.isSupport = false;
              this.$message.error("对讲功能只支持Google浏览器72及以上版本")
              return;
            }
            this.openChatDialog({talkTime:this.talkTime,sn:params.sn,sip_id:params.sip_id})
            // initWebRTC3(0,'TSA010TEST000001', 0, Math.ceil(Math.random() * 1e5), 2, "company");
            // let localUid = Math.ceil(Math.random() * 1e5);
            // let userId = this.$store.state.app.user_id;
            // console.log(this.$store.state.app.user_id,'111')
            // initWebRTC3(parseInt(this.id), this.form.sn, userId, localUid, 1, "company");
          // } else {
          //   this.$message({
          //     message: "该事件已经过去一段时间了，不能发起对讲了",
          //     type: "error"
          //   })
          // }

        // })
      }

    },
    callOther(params){
      console.log(getServiceType(),'online')
      // 线上服务走公网接口，本地服务走局域网接口
      if (getServiceType() === 'online') {
        this.callOtherLine(params)
      } else {
        this.callOtherLocal(params)
      }
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
      
      // 2代报警器
      EventBus.$on("onNimAccept", function (event) {
        that.editData.nimChannelId = event.channelId
        that.editData.talkTime = 10
        that.editData.localUid = event.localUid
        that.openChatDialog(that.editData)
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
        that.editData.nimChannelId = that.editData.sn
        that.editData.talkTime = that.talkTime
        that.editData.localUid = event.localUid
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
    }
  },
    created() {
    this.localUid = Math.ceil(Math.random() * 1e5)
    // console.log(this.localUid)
  },
  mounted() {
    if (!checkBrowser('chrome') && !checkBrowser('safari')) {
      this.$message.error("对讲功能只支持Google浏览器72及以上版本")
      // 浏览器不兼容对讲，但设备列表仍可加载
    }
    this.fetchUserList()
  },
  beforeDestroy() {
    // 确保组件销毁时清理事件监听
    this.unregisterTalkEvents();
  },
}
</script>

<style lang="less" scoped>
@import '@/styles/page.less';

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
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .filter-item {
    margin-right: 15px;
    width: 200px;
  }

  .sortBtn {
    color: #ccc;
    font-size: 14px;
    position: absolute;
    right: 30px;
    display: inline-block;

    i {
      color: #409EFF;
      cursor: pointer;
    }
  }

  ::v-deep .el-form-item__label {
    color: #d1cccc;
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
        margin-left: 10px;
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
  border-top: 1px solid #575d6e;
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

<template>
  <div class="page-container">
    <smart-table
      :columns="columns"
    :data="tableData"
    :pagination="pagination"
    :show-selection="true"
    :show-index="true"
    @selection-change="handleSelection"
    @pagination-change="handlePagination">

    <template #label="{ row }">
    <el-tag>
          {{ row.label | labelText }}
        </el-tag>
      </template>
      <!-- 自定义状态列 -->
      <template #src="{ row }">
        <vue-audio
            v-show="row.event_type!=3"
            :source="row.audio_url"
            :index="row.id"
            :mode="mode"
            @timeupdate="timeupdate"
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
      </template>

      <!-- 自定义操作列 -->
      <template #actions="{ row }">
        <el-button 
          type="primary" 
          size="mini"
          @click="handleDetails(row)"
        >详情</el-button>
      </template>
    </smart-table>
  </div>
</template>

<script>
import SmartTable from '@/components/Table'
import {webListEvent} from "@/api/event";
import * as constant from "@/components/constant";
import vueAudio from "@/components/audio";
import {getLabelType} from "@/utils/common";

export default {
  components: { SmartTable,vueAudio},
  
  data() {
    return {
      svgOptions: {
        width: 40,
        height: 40,
        fill: 'none',
        stroke: '#007aff',
        strokeWidth: 2
      },
      mode: constant.SINGLE,
      pagination: {
        page: 1,
        size: 10,
        total: 0
      },
      columns: [
        { prop: 'sn', label: '设备编号' },
        { prop: 'keyword', label: '敏感词' },
        { prop: 'room', label: '发生地点' },
        { prop: 'src', label: '音频',slotName: 'src' },
        { prop: 'created_at', label: '发生时间' },
        { prop: 'label', label: '处理结果',slotName: 'label' }
      ],
      tableData: []
    }
  },
  mounted(){
  this.fetchUserList()
  },
  methods: {
    handlePagination(params) {
      this.fetchUserList(params)
    },
    async fetchUserList() {
      const {data} = await webListEvent()
      this.tableData=data.data.data
      this.pagination.total=data.data.total
    },
    
    handleDetails(row) {
     this.$router.push('/events/'+row.id)
    },
    // 处理多选
    handleSelection(selection) {
      console.log('当前选中:', selection)
      this.selectedData = selection
    },

    // ==============================音乐播放=======================================


    timeupdate(e) {
    },
    playing(e) {
      // this.element = e.path ? e.path[1] : e.target.parentElement
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.PLAY_CLASS
      // 获得点击元素的父级元素
      console.log("开始了", ele)
    },
    pause(e) {
      console.log(e)
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
      let ele = e.path ? e.path[1] : e.target.parentElement
      ele.querySelector('a').className = constant.PAUSE_CLASS
      console.log("停止了", ele.querySelector('a').className)
    },
  },
  
  filters: {
    labelText(label) {
      return getLabelType(label)
    }
  }
}
</script>

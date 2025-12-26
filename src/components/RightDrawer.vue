<template>
    <div class="right-side-panel-wrapper">
        <transition name="slide">
            <div class="right-side-panel" :class="{ 'slide-leave-to': isCollapsed, 'slide-leave': !isCollapsed }">
                <div class="panel-content">
                    <el-button size="mini" class="deleteAll" @click="deleteEvent('1')" round>一键删除</el-button>
                    <div class="scroll-list">
                        <div v-for="(alert, index) in listData" :key="index" class="event-card" :class="'level-1'">
                            <span class="closeBtn" @click="deleteEvent('2', alert.id)"><i class="el-icon-close"></i></span>
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
                                    <vue-audio :source="alert.audio_url" :index="alert.id" :mode="mode"
                                        @playing="playing" @pause="pause" @ended="ended" @waiting="waiting"
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
                                <!-- <el-descriptions title="" :column="1"> -->

                                <!-- <el-descriptions-item label="事件处理"> -->
                                <div style="margin-top: 20px;">
                                    <el-button size="mini" type="primary" round @click="handleAction(1, alert.id)">玩闹
                                    </el-button>
                                    <el-button size="mini" type="danger" round @click="handleAction(2, alert.id)">谩骂冲突
                                    </el-button>
                                    <el-button size="mini" type="warning" round @click="handleAction(3, alert.id)">欺凌
                                    </el-button>
                                    <el-button size="mini" type="success" round @click="handleAction(4, alert.id)">误报
                                    </el-button>
                                    <el-button size="mini" type="info" round @click="handleAction(5, alert.id)">不确定
                                    </el-button>
                                </div>
                                <!-- </el-descriptions-item> -->

                                <!-- </el-descriptions> -->
                            </div>
                        </div>
                        <el-empty v-if="listData.length == 0" :image-size="200"></el-empty>
                    </div>
                </div>
            </div>
        </transition>
        <div class="toggle-button" @click="togglePanel">
            <i :class="isCollapsed ? 'el-icon-arrow-left' : 'el-icon-arrow-right'"></i>
        </div>
    </div>
</template>

<script>
import { EventBus } from "@/utils/event";
import vueAudio from "@/components/audio";
import * as constant from '@/components/constant'
import { GetLatestEvent } from "@/api/event";
import { getEventType } from "@/utils/common";
import { HandlerEvent, IsTalk } from "@/api/event";
import { mapState } from 'vuex';
export default {
    name: 'RightSidePanel',
    components: {
        vueAudio
    },
    data() {
        return {
            isCollapsed: true,
            // listData: this.$store.state.userInfo.real_time_event,
            mode: constant.SINGLE,
            svgOptions: {
                width: 40,
                height: 40,
                fill: 'none',
                stroke: '#007aff',
                strokeWidth: 2
            },
        }
    },
    computed: mapState({
        listData: state => state.userInfo.real_time_event,
    }),
    //   },
    methods: {
        deleteEvent(type, id = '') {//1 关闭全部 2 单个关闭
            if (type == 1) {
                this.$store.commit("SET_REALTIMEEVENT", []);
            } else {
                const newData = this.listData.filter(item => item.id !== id);
                this.$store.commit("SET_REALTIMEEVENT", newData);
            }
        },
        togglePanel() {
            this.isCollapsed = !this.isCollapsed;
            if (this.isCollapsed) {

                // this.$store.commit("SET_REALTIMEEVENT", []);
            }
        },
        /**
            * 事件处理
            */
        handleAction(value, id) {
            let ret = { label: value, id: id };
            HandlerEvent(ret).then(response => {
                let data = response.data
                this.$message({
                    message: data.msg,
                    type: "success"
                })
                const newData = this.listData.filter(item => item.id !== id);
                this.$store.commit("SET_REALTIMEEVENT", newData);
            })
        },
        /**
    * 获取事件类型
    */
        getEvent(event_type) {
            return getEventType(event_type)
        },
        /**
    * 接收到事件消息
    */
        parentHandleEvent(content) {
            // this.$set(content, "hidden", false)
            let listMsg = this.$store.state.userInfo.real_time_event  || []
            let length = listMsg.length
            if (length >= 20) {
                listMsg.unshift(content)
                // listMsg.splice(20, length - 20);
                listMsg.splice(length-1, 1);
                // this.listData = listMsg;
                this.$store.commit("SET_REALTIMEEVENT", listMsg);
            } else {
                listMsg.unshift(content)
                this.$store.commit("SET_REALTIMEEVENT", listMsg);
            }
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
        togglePanel() {
            this.isCollapsed = !this.isCollapsed
        }
    },
    mounted() {
        // this.getLatestEvent();
        let that = this;
        EventBus.$off("parentHandleEvent");
        EventBus.$on("parentHandleEvent", function (data) {
            that.parentHandleEvent(data);
        });
    }
}
</script>

<style lang="less" scoped>
.right-side-panel-wrapper {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
}

.right-side-panel {
    width: 420px;
    height: calc(100vh - 60px);
    background: white;
    border-radius: 4px 0 0 4px;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    padding: 40px 20px 20px 20px;
    overflow-y: auto;
}

.toggle-button {
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 80px;
    background: #409EFF;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px 0 0 4px;
    cursor: pointer;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}

/* 动画效果 */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter,
.slide-leave-to {
    transform: translateX(100%);
    /* opacity: 0; */
    display: none;
}

.slide-enter-to,
.slide-leave {
    transform: translateX(0);
    /* opacity: 1; */
    display: block;
}

.deleteAll {
    position: absolute;
    top: 20px;
    right: 20px;
}

.scroll-list {
    //   max-height: 400px;
    overflow-y: auto;

    .event-card {
        margin: 12px 0;
        padding: 16px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-left: 4px solid;

        .closeBtn {
            display: block;
            float: right;
            color: #999;
        }

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
</style>
<template>
    <div>

        <el-container class="main-container">
            <!-- 左侧导航菜单 -->
            <el-aside :width="isCollapse ? '64px' : '160px'" class="left-menu">
                <!-- <div class="logo-container">
                <span v-if="!isCollapse">校园防欺凌管理系统</span>
                <i v-else class="el-icon-s-platform"></i>
            </div> -->

                <el-menu router :default-active="$route.path" background-color="#1c1d29" :collapse="isCollapse"
                    text-color="#909399" active-text-color="#ccc">
                    <!-- 处理data路由 -->
                    <el-menu-item v-if="menuRoutes.find(r => r.path === '/data')" index="/data">
                        <i class="el-icon-menu"></i>
                        <span>数据页面</span>
                    </el-menu-item>

                    <!-- 处理main的子路由 -->
                    <template v-for="route in menuRoutes">
                        <!-- 处理main路由及其子路由 -->
                        <template v-if="route.path === '/main' && route.children">
                            <template v-for="child in route.children">
                                <!-- 处理有子路由的菜单项 -->
                                <el-submenu v-if="child.meta?.showMenu && child.children" :index="child.path">
                                    <template #title>
                                        <i :class="child.meta?.icon || 'el-icon-menu'"></i>
                                        <span>{{ child.meta?.title }}</span>
                                    </template>
                                    <el-menu-item v-for="subChild in child.children" :key="subChild.path"
                                        :index="subChild.path" v-if="subChild.meta?.showMenu">
                                        <i :class="subChild.meta?.icon || 'el-icon-menu'"></i>
                                        <span>{{ subChild.meta?.title }}</span>
                                    </el-menu-item>
                                </el-submenu>

                                <!-- 处理无子路由的菜单项 -->
                                <el-menu-item v-if="child.meta?.showMenu && !child.children" :index="child.path">
                                    <i :class="child.meta?.icon || 'el-icon-menu'"></i>
                                    <span>{{ child.meta?.title }}</span>
                                </el-menu-item>
                            </template>
                        </template>
                    </template>
                </el-menu>
            </el-aside>

            <el-container>
                <!-- 顶部Header -->
                <!-- <el-header class="main-header">
                <div class="header-left">
                    <el-button 
            type="text" 
            :icon="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
            @click="toggleMenu">
          </el-button>
                </div>
                <div class="header-right">
                    <el-dropdown>
                        <span class="user-info">
                            <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                                size="small">
                            </el-avatar>
                            <span>管理员</span>
                        </span>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item>个人中心</el-dropdown-item>
                            <el-dropdown-item divided @click.native="logout">退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                </div>
            </el-header> -->
                <!-- <div class="tabs-container">
                <el-tabs v-model="activeTab" type="card" closable @tab-remove="removeTab" @tab-click="clickTab">
                    <el-tab-pane class="layoutTab" v-for="item in tabs" :key="item.path" :label="item.title"
                        :name="item.path">
                    </el-tab-pane>
                </el-tabs>
            </div> -->

                <!-- 主内容区域 -->
                <el-main class="main-content">
                    <!-- 路由视图 -->
                    <router-view></router-view>
                </el-main>
            </el-container>
            <audio controls="controls" :hidden="true" :src="src" ref="audio"></audio>
        </el-container>

        <!-- <div class="event" v-if="eventArr.length>0">  -->
        <alarm-popup :flag.sync="dialogFlag" :editData="editData" @close="handleClose"
            @componentCallback="componentCallbackFun" />
        <!-- </div> -->
        <right-drawer></right-drawer>
    </div>
</template>

<script>
import { EventBus } from "@/utils/event";
import RightDrawer from '@/components/RightDrawer.vue'
import { getSrc } from "@/utils/common";
import { getServiceType, getServerConfig } from "@/utils/serverConfig";

export default {
    components: {
        RightDrawer
    },
    data() {
        return {
            isExpanded: true,
            lockReconnect: false, // 是否真正建立连接
            isNeedConnect: true, // 是否需要重新连接
            websock: null,
            timeout: 30 * 1000, // 30秒一次心跳
            timeoutObj: null, // 心跳倒计时
            serverTimeoutObj: null, // 服务器心跳倒计时
            dialogFlag: true, // 对话框状态标志
            editData: {}, // 编辑数据
            token: this.$store.state.token, // WebSocket token
            src: '', // 音频源
            event: {
                created_at: "",
                event_type: "",
                handler_type: "",
                handler_name: "",
                audio_url: "",
                long_audio: "",
                keyword: "",
                label: 0,
                customer: [],
                sn: "",
                id: -1,
                room: "",
            },
            isCollapse: false,
            activeTab: '',
            tabs: [],
            eventArr: JSON.parse(localStorage.getItem('eventArr')) || []
        }
    },
    watch: {
        $route: {
            handler(route) {
                this.addTab(route);
            },
            immediate: true
        }
    },
    created() {
        // 从本地存储恢复标签页
        this.restoreTabsFromStorage();
    },
    computed: {
        menuRoutes() {
            // let arr = []
            // this.$router.options.routes.forEach(element => {
            //     if (element?.meta?.showMenu) {
            //         arr.push(element)
            //     }
            // });
            // console.log(arr.reverse(), 'route')
            return this.$router.options.routes
        }
    },
    mounted() {
        EventBus.$on("closeWebsocket", this.closeSocket); // 监听关闭 WebSocket 事件
    },
    destroyed() {
        EventBus.$off("closeWebsocket", this.closeSocket); // 清理事件监听器
    },
    methods: {
        getIMSocketURL() {
            let url = new URL("/v1/wsTalk", window.location);
            switch (url.protocol) {
                case "https:":
                    url.protocol = "wss:";
                    break;
                case "http:":
                    url.protocol = "ws:";
                    break;
            }
            return url.href; // ✅ 添加返回值
        },
        handleEventType(id) {
            let data = JSON.parse(localStorage.getItem('eventArr'))
            data.forEach((e, index) => {
                if (e.id == id) {
                    data.splice(index, 1)
                }
            })
            localStorage.setItem('eventArr', JSON.stringify(data))
            this.eventArr = data
        },
        toggleMenu() {
            this.isCollapse = !this.isCollapse
        },
        // 添加新标签页
        addTab(route) {
            this.restoreTabsFromStorage()
            let isExist = this.tabs.some(item => item.path === route.path);
            if (!isExist) {
                this.tabs.push({
                    title: route.meta.title,
                    path: route.path
                });
                // 保存标签页到本地存储
                this.saveTabsToStorage();
            }
            this.activeTab = route.path;
            // 保存当前激活的标签页到本地存储
            this.saveActiveTabToStorage();
        },

        // 移除标签页
        removeTab(targetPath) {
            let tabs = this.tabs;
            let activePath = this.activeTab;

            // 如果只剩一个标签页则不允许关闭
            if (tabs.length <= 1) {
                this.$message({
                    message: "至少保留一个标签页",
                    type: "warning"
                });
                return;
            }

            // 如果关闭的是当前激活的标签页
            if (activePath === targetPath) {
                // 找到要关闭的标签页的索引
                const targetIndex = tabs.findIndex(tab => tab.path === targetPath);

                // 优先选择后一个标签页,如果不存在则选择前一个
                const nextTab = tabs[targetIndex + 1] || tabs[targetIndex - 1];

                if (nextTab) {
                    activePath = nextTab.path;
                    // 跳转到新的标签页
                    this.$router.push(activePath);
                }
            }

            this.activeTab = activePath;
            this.tabs = tabs.filter(tab => tab.path !== targetPath);

            // 保存标签页到本地存储
            this.saveTabsToStorage();
            this.saveActiveTabToStorage();
        },

        // 点击标签页
        clickTab(tab) {
            this.$router.push(tab.name);
            this.activeTab = tab.name;
            // 保存当前激活的标签页到本地存储
            this.saveActiveTabToStorage();
        },

        // 保存标签页到本地存储
        saveTabsToStorage() {
            sessionStorage.setItem('tabs', JSON.stringify(this.tabs));
        },

        // 保存当前激活的标签页到本地存储
        saveActiveTabToStorage() {
            sessionStorage.setItem('activeTab', this.activeTab);
        },

        // 从本地存储恢复标签页
        restoreTabsFromStorage() {
            const savedTabs = sessionStorage.getItem('tabs');
            const savedActiveTab = sessionStorage.getItem('activeTab');

            if (savedTabs) {
                this.tabs = JSON.parse(savedTabs);
            }

            if (savedActiveTab) {
                this.activeTab = savedActiveTab;
            }
        },
        logout() {
            EventBus.$emit("closeWebsocket", "");
            this.$store.dispatch('logout').then(response => {
                if (response.code === 0) {
                    this.$message({
                        message: "退出成功！",
                        type: "success"
                    })
                    this.$router.push('/login')
                }
            })
        },
        handleNewAlarm(alarmData) {
            // 验证数据格式
            if (this.validateAlarm(alarmData)) {
                this.$nextTick(() => {
                    this.$children.find(c => c.$options.name === 'AlarmPopup').showAlarm(alarmData)
                })
            }
        },

        validateAlarm(data) {
            return ['deviceId', 'roomId', 'keywords'].every(field =>
                data.hasOwnProperty(field)
            )
        },

        handleAction({ alarmId, actionType }) {
            // 调用API处理操作
            this.$axios.post('/api/handle-alarm', {
                alarmId,
                actionType
            }).catch(error => {
                this.$message.error('操作提交失败')
            })
        },
        // 组件回调函数
        componentCallbackFun(params) {
            if (params.function) {
                this[params.function](params.data);
            }
        },

        // 根据协议获取 WebSocket URL
        getWebSocketURL() {
            const url = new URL("/v1/ws", window.location);
            url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
            return url.href;
        },
        // 初始化 WebSocket 连接
        initWebSocket() {
            let wsUrl;
            const serviceType = getServiceType(); // ✅ 修复：调用函数获取服务类型

            // 根据配置的服务类型选择 WebSocket 地址
            if (serviceType === 'local') {
                // 本地服务：使用配置的本地服务器地址
                const config = getServerConfig();
                const protocol = config.protocol === 'https' ? 'wss' : 'ws';
                const host = config.ip || '192.168.1.226';
                const port = config.port || '18001';
                wsUrl = `${protocol}://${host}:${port}/v1/ws`;
            } else {
                // 线上服务：使用当前页面协议自动生成的地址
                 wsUrl = "https://api.g2.aibabel.cn/v1/ws";
            }

            console.log('WebSocket 连接地址:', wsUrl);

            // 建立 WebSocket 连接
            this.websock = new WebSocket(wsUrl);

            this.websock.onopen = this.onOpen;
            this.websock.onerror = this.onError;
            this.websock.onmessage = this.onMessage;
            this.websock.onclose = this.onClose;
        },
        // 连接成功
        onOpen() {
            console.log("WebSocket连接成功");
            console.log(this.token);
            this.sendMessage(JSON.stringify({ "type": "login", "token": this.token }));
            this.heartCheck(); // 开启心跳检测
        },
        // 连接发生错误
        onError(e) {
            console.log('WebSocket连接发生错误: ' + e.code + ' ' + e.reason + ' ' + e.wasClean);
            this.reconnect(); // 尝试重连
        },
        // 接收数据
        onMessage(e) {
            let data;
            try {
                data = JSON.parse(e.data); // 解析 JSON 数据
            } catch (error) {
                console.error("解析消息失败:", error);
                return;
            }
            switch (data.type) {
                case 'login':
                    // 处理登录成功消息
                    break;
                case 'heartbeat':
                    this.reset(); // 收到心跳，重置心跳计时
                    break;
                case 'event':
                    this.handleEvent(data.content); // 处理事件消息
                    break;
                case 'device':
                    this.handleDevice(data.content); // 处理设备状态变更
                    break;
                case 'vp':
                    this.handleVoicePrint(data.content); // 处理声纹相关消息
                    break;
                case 'match':
                    this.handleMatch(data.content); // 处理声纹验证
                    break;
                case 'active':
                    this.handleActive(data.content); // 处理声纹打卡
                    break;
                case 'exp_reminder':
                    this.handleExpirationReminder(data.content); // 处理到期提醒
                    break;
                default:
                    console.warn("未知消息类型:", data.type);
            }
        },
        // 关闭连接
        onClose(e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean);
            if (this.isNeedConnect) {
                this.reconnect(); // 尝试重连
            }
        },
        // 发送数据
        sendMessage(text) {
            try {
                this.websock.send(text);
            } catch (err) {
                console.log("发送失败 (" + err.code + ")");
            }
        },
        // 重连
        reconnect() {
            if (this.lockReconnect) return; // 防止重复重连
            this.lockReconnect = true;
            clearTimeout(this.timeoutnum); // 清除之前的重连计时
            setTimeout(() => {
                console.info("尝试重连...");
                this.initWebSocket(); // 重新初始化 WebSocket
                this.lockReconnect = false;
            }, 15000); // 15秒后重连
        },
        // 开启心跳
        heartCheck() {
            const heartActions = { "type": "heartbeat", "token": this.token };
            clearTimeout(this.timeoutObj);
            clearTimeout(this.serverTimeoutObj);
            this.timeoutObj = setTimeout(() => {
                if (this.websock.readyState === 1) { // 如果连接正常
                    this.websock.send(JSON.stringify(heartActions)); // 发送心跳
                } else {
                    this.reconnect(); // 否则重连
                }
                this.serverTimeoutObj = setTimeout(() => {
                    this.websock.close(); // 超时关闭连接
                }, this.timeout);
            }, this.timeout);
        },
        // 重置心跳
        reset() {
            clearTimeout(this.timeoutObj);
            clearTimeout(this.serverTimeoutObj);
            this.heartCheck(); // 重新开启心跳检测
        },
        // 主动关闭连接
        closeSocket() {
            clearTimeout(this.timeoutObj);
            clearTimeout(this.serverTimeoutObj);
            this.sendMessage(JSON.stringify({ "type": "logout", "token": this.token }));
            this.isNeedConnect = false;
            this.websock.close();
        },
        // 播放音乐
        playMusic() {
            if (this.$refs.audio.paused) { // 判读是否播放
                const sound = this.$store.state.userInfo.sound; // 获取播放声音类型
                this.$refs.audio.src = getSrc(sound);
                this.$refs.audio.currentTime = 0; // 从头开始播放
                this.$refs.audio.play(); // 播放
            }
        },
        // 显示对话框
        showDialog(params) {
            console.log(params, 'params')
            if (this.dialogFlag) {
                this.handleClose(); // 如果对话框已打开，则先关闭
            }
            setTimeout(() => {
                this.dialogFlag = true;
                this.editData = { ...params }; // 使用展开运算符复制对象
            }, 500);
        },
        // 关闭对话框
        handleClose() {
            this.dialogFlag = false;
            // this.$refs.audio.pause(); // 停止音乐
        },
        // 到期提醒
        remindExpiration() {
            this.$router.push("/setting/index"); // 跳转到设置页面
        },
        // 处理事件消息
        handleEvent(content) {
            this.$notify({
                title: '收到一条告警通知',
                message: '房间：' + content.room
            });
            this.showDialog(content);
            EventBus.$emit("parentHandleEvent", content);
            if (this.$store.state.userInfo.voice == true) {
                this.playMusic(); // 播放音乐
            }
        },
        // 处理设备状态变更消息
        handleDevice(content) {
            const msgTitle = content.isOnline === 0 ? "有设备离线了" : "有设备上线了";
            this.$notify({
                title: msgTitle,
                message: '编号：' + content.sn
            });
            // EventBus.$emit("parentHandleDevice", content.sn, content.isOnline);
        },
        // 处理声纹相关消息
        handleVoicePrint(content) {
            if (content.code === -1) {
                this.$notify({
                    title: "声纹注册失败",
                    message: content.msg
                });
            }
            EventBus.$emit(content.type === "vpr" ? "changeIcon" : "changeState", content.index, content.code);
        },
        // 处理声纹验证消息
        handleMatch(content) {
            if (content.code === 0) {
                EventBus.$emit("setValue2List", content.matches);
            } else {
                this.$notify({
                    title: "验证失败了",
                    message: "验证失败了"
                });
            }
        },
        // 处理声纹打卡消息
        handleActive(content) {
            EventBus.$emit("showInfo", content.currentInfo);
        },
        // 处理SIM卡到期提醒消息
        handleExpirationReminder(content) {
            this.$notify.info({
                title: '到期提醒',
                message: '您的物联网卡将在一个月内到期，请及时续费以免影响使用，点击前往续费。',
                duration: 0, // 不自动关闭
                onClick: () => {
                    this.$router.push({ name: 'Setting' }); // 跳转到续费页面
                },
            });
        }
    },
    created() {
        this.initWebSocket(); // 创建 WebSocket 连接
    },
}
</script>
<style lang="less" scoped>
.event {
    position: fixed;
    width: 400px;
    max-height: 100vh;
    overflow-y: auto;
    top: 0;
    right: 0;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
    padding: 20px;
}

.main-container {
    height: 100vh;

    ::v-deep .el-menu-item {
        line-height: 70px;
        height: 70px;
        font-size: 16px;
    }

    ::v-deep .el-menu-item [class^=el-icon-] {
        font-size: 18px;
        color: #acadc2;
    }

    ::v-deep .el-menu-item.is-active i {
        color: #acadc2;
    }

    .left-menu {
        background-color: #1c1d29;
        transition: width 0.3s;

        .logo-container {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            background-color: #2b2f3a;
        }

        .el-menu {
            border-right: none;
        }
    }

    .main-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #fff;
        box-shadow: 0 1px 4px rgba(0, 21, 41, .08);

        .header-left {
            display: flex;
            align-items: center;

            .el-button {
                font-size: 20px;
                margin-right: 15px;
            }
        }

        .user-info {
            display: flex;
            align-items: center;
            cursor: pointer;

            span {
                margin-left: 8px;
            }
        }
    }

    .main-content::-webkit-scrollbar {
        width: 0;
    }

    .main-content {
        background-color: #252a39;

        .chart-container {
            background: #fff;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    }
}

.tabs-container {
    // padding: 5px;
    background: #fff;
    // border-bottom: 1px solid #dcdfe6;
    // position: fixed;
    // top: 100px;
    // right: 0;
    // left: $navMenu;
    // margin-right: 30px;
    height: 50px;
    z-index: 1000;
    background-color: #fff;
    line-height: 50px;
    margin-top: 5px;
    box-shadow: -5px -5px 8px rgba(0, 0, 0, .2);

    ::v-deep .el-tabs__item.is-active {
        border-top: solid 2px #409EFF !important;
        border-radius: 2px;
    }

    ::v-deep .el-tabs__item {
        line-height: unset;
    }

    ::v-deep .el-tabs__item:hover {
        border-top: solid 2px #409EFF !important;
        border-radius: 2px;
    }
}
</style>
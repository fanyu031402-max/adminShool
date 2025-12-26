// import NIM from '@/sdk/NIM_Web_NIM_v8.4.0'
import NIM from '@/sdk/NIM_Web_NIM_v9.6.3'
import config from '../../config'
import { Message } from "element-ui";
import { EventBus, onAimAccept } from "@/utils/event";
import { generateUUID } from "@/utils/common";
import { getCheckSum } from "@/utils/CheckSumBuilder";
import { GetAibabelRTCToken } from "@/api/im";

let nim;
console.log(process.env.NODE_ENV,'process.env.NODE_ENV');

/**
 * 初始化
 */
export function nimLogin(account, token) {
    nim = NIM.getInstance({
        appKey: config.appkey, // 在开发者管理控制台创建的应用的appKey
        account: account,     // IM帐号名称
        token: token,        // 登录IM所需的token
        onconnect: onConnect,
        onwillreconnect: onWillReconnect,
        ondisconnect: onDisconnect,
        onerror: onError,
        // 更多方法和回调请看IM即时通讯
    })
}

function onConnect() {
    console.log('IM登录成功');
    nim.on('signalingNotify', signalingNotifyHandler);
    EventBus.$emit("onLoginSuccess", true);
}

function onWillReconnect(obj) {
    // 此时说明 SDK 已经断开连接, 请开发者在界面上提示用户连接已断开, 而且正在重新建立连接
    console.log('即将重连', "重试次数：", obj.retryCount, "间隔时长：", obj.duration);
}

function onDisconnect(error) {
    // 此时说明 SDK 处于断开状态, 开发者此时应该根据错误码提示相应的错误信息, 并且跳转到登录页面
    console.log('断开连接');
    console.log(error);
    if (error) {
        switch (error.code) {
            // 账号或者密码错误, 请跳转到登录页面并提示错误
            case 302:
                break;
            // 重复登录, 已经在其它端登录了, 请跳转到登录页面并提示错误
            case 417:
                break;
            // 被踢, 请提示错误后跳转到登录页面
            case 'kicked':
                break;
            default:
                break;
        }
    }
}

function onError(error) {
    console.log(error);
}

/**
 * 信令回调
 *
 * @param event
 */
function signalingNotifyHandler(event) {
    console.log("signalingOnlineNotify: ", event)
    switch (event.eventType) {
        case 'ROOM_CLOSE':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
            */
            console.log("独立呼叫信令：频道关闭事件");
            break;
        case 'ROOM_JOIN':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
              event.attach 新加入的成员信息
              event.msgid 消息id
            */
            console.log("独立呼叫信令：加入频道事件");
            break;
        case 'INVITE':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
              event.to 接收者的账号
              event.requestId 邀请者邀请的请求id，用于被邀请者回传request_id_作对应的回应操作
              event.pushInfo 推送信息
            */
            console.log("独立呼叫信令： 邀请事件");
            break;
        case 'CANCEL_INVITE':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
              event.to 接收者的账号
              event.requestId 邀请者邀请的请求id，用于被邀请者回传request_id_作对应的回应操作
            */
            console.log("独立呼叫信令：取消邀请事件");
            break;
        case 'REJECT':
            EventBus.$emit("onNimReject", event);
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
              event.to 接收者的账号
              event.requestId 邀请者邀请的请求id，用于被邀请者回传request_id_作对应的回应操作
            */
            console.log("独立呼叫信令：拒绝邀请事件");
            break;
        case 'ACCEPT':
            EventBus.$emit("onNimAccept", event);
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
              event.to 接收者的账号
              event.requestId 邀请者邀请的请求id，用于被邀请者回传request_id_作对应的回应操作
            */
            console.log("独立呼叫信令：接受邀请事件");
            break;
        case 'LEAVE':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              event.to 接收者
              evnet.ext 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
            */
            console.log("独立呼叫信令：离开频道事件");
            break;
        case 'CONTROL':
            /* 该事件的通知内容
              event.eventType 事件类型
              event.channelName 频道名称
              event.channelId 频道ID
              event.channelCreateTime 频道创建时间
              event.channelExpireTime 频道过期时间
              event.creator 频道创建者
              event.from 操作者
              event.to 接收者
              evnet.attachExt 操作者附加的自定义信息，透传给你
              event.time 操作的时间戳
            */
            console.log("独立呼叫信令：自定义控制事件");
            break;
    }
}

export function logout() {
    if (nim) {
        nim = nim.destroy();
    }
}

/**
 * 邀请
 */
export async function call(uid, rtcRoomId, account, requestId) {

    let param = {
        type: 1,//通话类型,1:音频;2:视频;3:其他
        ext: rtcRoomId,//频道的自定义扩展信息，可缺省
        // channelId: channelId,//对应的频道id
        uid: uid,//自己在频道中对应的uid，大于零有效，无效时服务器会分配随机唯一的uid
        account: account,//邀请者的account账号
        requestId: requestId,//邀请者邀请的请求id，需要邀请者填写，之后取消邀请、拒绝、接受需要复用该requestId
        offlineEnabled: false,//是否存离线通知
        // attachExt: '',//操作者附加的自定义信息，透传给其他人，可缺省
        // pushInfo: pushInfo//推送信息
    }
console.log(param,'ppp')
    return new Promise((resolve, reject) => {
        nim.signalingCall(param).then(data => {
            resolve(data);
            console.warn("独立呼叫信令，呼叫成功：", data)
        }).catch(error => {
            console.warn("独立呼叫信令，呼叫失败：", error)
            if (error.code == 10405) {
                console.warn("独立呼叫信令：频道已存在");
                Message.error({ message: '频道已存在!' });
            } else if (error.code == 10201) {
                Message.error({ message: '对方不在线!' });
            } else if (error.code == 10202) {
                Message.error({ message: '对方不在线!' });
            }
        })
    })

}

/**
 * 接受对方邀请
 */
export function accept() {

}

/**
 * 关闭频道
 */
export function close(channelId) {
    let param = {
        channelId: channelId,
        offlineEnabled: false,
        ext: ""
    };
    // 关闭房间操作
    return new Promise((resolve, reject) => {
        nim.signalingClose(param)
            .then(data => {
                resolve(data)
                console.warn("独立呼叫信令，关闭房间成功，data：", data);
            })
            .catch(error => {
                console.warn("独立呼叫信令，关闭房间失败，error：", error);
                if (error.code == 10406) {
                    console.warn("独立呼叫信令：你不在房间内，无法关闭");
                }
            });
    })


}


/**
 * 离开频道
 */
export function disconnect(channelId) {
    let param = {
        channelId: channelId,
        offlineEnabled: false,
        attachExt: ''
    }
    // 清除实例
    nim.signalingLeave(param).then(data => {
        console.warn("独立呼叫信令，离开频道成功，data：", data)
    }).catch(error => {
        console.warn("独立呼叫信令，离开频道失败，error：", error)
        if (error.code == 10406) {
            console.warn("独立呼叫信令：不在频道内");
        }
    })
}

export function getStatus() {

}

//===============================以上为信令操作=======================================

// WebSocket 连接管理
let socket;
let isConnected = false; // 连接状态变量
// let reconnectInterval = 5000; // 初始重连间隔为 5 秒
// let maxReconnectInterval = 120000; // 最大重连间隔为 2 分钟
// let reconnectAttempts = 0; // 重连尝试次数
// let shouldReconnect = true; // 是否允许重连，默认允许
// let aibabelToken = ''; // 是否允许重连，默认允许

function createWebSocket(token, eventData) {
    // 导入服务器配置工具
    const { getServiceType, getServerConfig } = require('./serverConfig');
    
    let wsUrl;
    const serviceType = getServiceType();
    
    // 根据配置的服务类型选择 WebSocket 地址
    if (serviceType === 'local') {
        // 本地服务：使用配置的本地服务器地址
        const configeSrver = getServerConfig();
        const protocol = configeSrver.protocol === 'https' ? 'wss' : 'ws';
        const host = configeSrver.ip || '192.168.1.226';
        const port = configeSrver.port || '18001';
        wsUrl = `${protocol}://${host}:${port}/v1/wsTalk`;
    } else {
        // 线上服务：使用当前页面协议自动生成的地址
        // wsUrl = getIMSocketURL()
         wsUrl = "https://api.g2.aibabel.cn/v1/wsTalk";
    }
    
    // 建立 WebSocket 连接
    socket = new WebSocket(wsUrl);

    socket.onopen = function () {
        console.log('Aibabel WebSocket connection opened');
        isConnected = true; // 设置连接状态为 true
        // 立即发送 token
        sendToken(token);
    };

    socket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        // 根据消息类型进行处理
        if (message.socket_type === 'in') {//已经邀请对方了
            let data = { nimChannelId: eventData.sn, sn: eventData.sn }
            EventBus.$emit(onAimAccept, data);
        } else if (message.socket_type === 'out') {
            // console.log('Sending out message');
            // socket.send(JSON.stringify({ socket_type: 'out', token }));
            // socket.close();
        } else if (message.socket_type === 'token') {
            if (message.code === 200) {
                sendInMessage(token);
            } else if (message.code === -1) {
                console.log(message.msg);
            }
        }

    };

    socket.onclose = function () {
        console.log('Aibabel WebSocket connection closed');
        isConnected = false; // 设置连接状态为 false
        // if (this.shouldReconnect) {
        //     console.log('Attempting to reconnect...');
        //     reconnect();
        // } else {
        //     console.log('Manual close, not attempting to reconnect.');
        // }
    };

    socket.onerror = function () {
        console.error('WebSocket error:', error);
    };
}

function sendToken(token) {
    if (isConnected) { // 检查连接状态
        console.log('Sending token:');
        socket.send(JSON.stringify({ socket_type: 'token', token }));
    } else {
        console.log('Aibabel WebSocket connection closed，Please reconnect');
    }
}

function sendInMessage(token) {
    if (isConnected) {
        console.log('Sending in message');
        socket.send(JSON.stringify({ socket_type: 'in', token }));
    } else {
        console.log('Aibabel WebSocket connection closed，Please reconnect');
    }
}

function sendOutMessage() {
    if (isConnected) {
        console.log('Sending out message');
        socket.send(JSON.stringify({ socket_type: 'out', token }));
    } else {
        console.log('Aibabel WebSocket connection closed，Please reconnect');
    }
}

function sendHeartbeat() {
    console.log('Sending heartbeat');
    socket.send(JSON.stringify({ socket_type: 'heartbeat' }));
}


export function closeAibabelSignal() {
    console.log('closeAibabelSignal');
    sendOutMessage()
}

// function reconnect() {
//   reconnectAttempts++;
//
//     // 计算新的重连间隔
//     const interval = reconnectInterval < maxReconnectInterval ?
//        reconnectInterval : maxReconnectInterval;
//
//     setTimeout(() => {
//         console.log(`Reconnecting in ${interval / 1000} seconds...`);
//         createWebSocket(aibabelToken);
//         // 更新重连间隔，超过最大重连时间后保持为2分钟
//         reconnectInterval = (reconnectInterval < maxReconnectInterval) ?
//             reconnectInterval * 2 : maxReconnectInterval;
//     }, interval);
// }

// 手动关闭连接的方法
function closeAimSocket(token) {
    if (this.socket) {
        this.socket.close(); // 关闭 WebSocket 连接
    }
}

/**
 * 获取对讲长链接token并建立长链接
 * @param eventId，如果是基于事件的需要填入事件ID,无事件传0
 * @param sn，设备编号
 * @param uid，管理端的用户ID，可选传
 * @param localUid，云信的用户ID
 * @param type，类型 0 异常通话，1 基于事件的通话，2 基于无事件的通话
 * @param idType，发起人类型目前只有2个,company,customer
 */
export function initWebRTC3(eventId, sn, uid, localUid, type, idType) {
    console.log('参数：', eventId, sn, uid, localUid, type, idType);
    let cur_time = Math.floor(Date.now() / 1000).toString();
    let reqData = {
        event_id: eventId,
        id: uid,
        sn: sn,
        user_id: localUid,
        id_type: idType,
        type: type,
        task_id: generateUUID(),
        channel_name: sn,
        nonce: sn,
        cur_time: cur_time,
        check_sum: getCheckSum(config.aibabelSecret, sn, cur_time)
    };

    GetAibabelRTCToken(reqData).then(response => {
        let data = response.data.data;
        let token = data.token;
        let event = { localUid: localUid, sn: sn }
        // 调用创建 WebSocket 函数
        createWebSocket(token, event);
    });
}

// get WebSocket URL according to the protocol
function getIMSocketURL() {
    let url = new URL("/v1/wsTalk", window.location);
    switch (url.protocol) {
        case "https:":
            url.protocol = "wss:";
            break;
        case "http:":
            url.protocol = "ws:";
            break;
    }
    return url.href;
}

import service from "@/utils/request";


/**
 * 根据id获取详情
 */
export function GetInfoById(data){
    return service.request({
        method: "post",
        url: "/event/webInfoEvent",
        data
    })
}

/**
 * 处理事件
 */
export function HandlerEvent(data){
    return service.request({
        method: "post",
        url: "/event/webLabelEvent",
        data
    })
}

/**
 * 获取最近N条事件
 */
export function GetLatestEvent(data){
    return service.request({
        method: "post",
        url: "/event/webLastEvent",
        data
    })
}

/**
 * 能否允许对讲
 */
export function IsTalk(data){
    return service.request({
        method: "post",
        url: "/event/talkTimeEvent",
        data
    })
}

/**
 * 获取事件列表
 */
export function webListEvent(data){
    return service.request({
        method: "post",
        url: "/event/webListEvent",
        data
    })
}

/**
 * 对讲/呼叫
 */
export function webTalk(data){
    return service.request({
        method: "post",
        url: "/event/webTalk",
        data
    })
}





import service from "@/utils/request";


export function getJsonData (currentLevel) {
    return service.request({
        method: "get",
        url: "https://storage.cdn.aibabel.cn/g2/dl/map/" + currentLevel + ".json",
    })
}
/**
 * 统计半年内学校数据信息
 */
export function schoolAlarms (data) {
    return service.request({
        method: "post",
        url: "/page/schoolAlarms",
        data
    })
}
/**
 * 统计当前月每天的报警数和处理数
 */
export function monthlyEvents (data) {
    return service.request({
        method: "post",
        url: "/page/monthlyEvents",
        data
    })
}
/**
 * 统计关联学校的地图信息
 */
export function schoolMaps (data) {
    return service.request({
        method: "post",
        url: "/v1/edu/schoolMaps",
        data
    })
}
/**
 * 统计实时报警和设备总数以及在线数
 */
export function realTimeDevAlarm (data) {
    return service.request({
        method: "post",
        url: "/page/realTimeDevAlarm",
        data
    })
}
/**
 * 验证市区是否有数据
 */
export function verify (data) {
    return service.request({
        method: "post",
        url: "/v1/edu/verify",
        data
    })
}

/**
 * 统计各类型事件半年内每月数量
 */
export function eventType (data) {
    return service.request({
        method: "post",
        url: "/page/monthEventType",
        data
    })
}
/**
 * 最近7天内事件类型统计
 */
export function weekEventType (data) {
    return service.request({
        method: "post",
        url: "/page/weekEventType",
        data
    })
}
/**
 * 告警统计
 */
export function statsEvent (data) {
    return service.request({
        method: "post",
        url: "/page/statsEvent",
        data
    })
}
/**
 * 房间top5统计
 */
export function statsRoom (data) {
    return service.request({
        method: "post",
        url: "/page/statsRoom",
        data
    })
}

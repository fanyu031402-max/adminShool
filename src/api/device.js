import service from "@/utils/request";
/**
 * 获取事件列表
 */
export function getDeviceList(data){
    return service.request({
        method: "post",
        url: "/device/webListDevice",
        data
    })
}
/**
 * 设备状态
 */
export function RebootDevice(data) {
    return service.request({
        method: "post",
        url: "/device/webResetDevice",
        data
    })
}

/**
 * 通过 SN 获取 BRT 通话 Token
 */
export function GetBRTTokenBySN(data) {
    return service.request({
        method: "post",
        url: "/device/getBRTTokenBySN",
        data
    })
}
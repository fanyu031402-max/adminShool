import service from "@/utils/request";


/**
 * 获取imToken
 *
 * @param {
 *  事件ID；task_id: string
 * }
 *
 */
export function imToken(data){
    return service.request({
        method: "post",
        url: "/event/singleTalk",
        data
    })
}

/**
 * 请求RTC长链接Token，分音塔自己实现的信令
 */
export function GetAibabelRTCToken(data){
    return service.request({
        method: "post",
        url: "/yxToken",
        data
    })
}






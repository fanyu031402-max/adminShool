import service from "@/utils/request";
/**
 *
 *  根据参数类型获取房间列表
 *
 *  参数为：is_binding //0 默认  1 未绑定  2 已绑定
 *
 */
export function GetRoomsByBinding(data){
    return service.request({
        method: "post",
        url: "room/webBindingRoom",
        data
    })
}
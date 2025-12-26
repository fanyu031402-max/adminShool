import service from "@/utils/request";
/**
 * 设置提示音
 */
export function Save(data){
    return service.request({
        method: "post",
        url: "/user/webCompanySetting",
        data
    })
}
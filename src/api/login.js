import service from "@/utils/request";
/**
 * 退出
 */
export function Logout(data = {}){
    return service.request({
        method: "post",
        url: "user/webLogout",
        data
    })
}

/**
 * 登录
 */
export function Login(data){
    return service.request({
        method: "post",
        url: "user/webLogin",
        data
    })
}

/**
 * 获取用户角色
 */
export function getUserInfo(data = {}){
    return service.request({
        method: "post",
        url: "user/webInfoUser",
        data
    })
}

/**
 * 修改密码
 */
export function UserModify(data){
    return service.request({
        method: "post",
        url: "/user/webChangePwd",
        data
    })
}
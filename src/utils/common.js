import axios from "axios";
import JsSha from 'jssha'
// import { getCompanyType } from "@/utils/app";

export function timestampToTime(timestamp) {
    let now = new Date(timestamp * 1000);
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    return year + "-" + month + "-" + date + "   " + hour + ":" + minute + ":" + second;
}

export function getUrlKey(name) {
    let params = decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [, ""])[1].replace(/\+/g, '%20')) || null;
    return params;
}

/**
 * 事件分类
 */
export function getEventType(event_type) {
    let type
    switch (event_type) {
        case 1:
            type = "异常事件"
            break;
        case 2:
            type = "敏感词"
            break;
        case 3:
            type = "熄灯监测"
            break;
        case 4:
            type = "其他"
            break;
        default:
            type = "其他"
    }
    return type
}

/**
 * 事件处理类型
 */
export function getLabelType(label) {
    let type
    switch (label) {
        case 1:
            type = "玩闹"
            break;
        case 2:
            type = "谩骂欺凌"
            break;
        case 3:
            type = "冲突"
            break;
        case 4:
            type = "误报"
            break;
        case 5:
            type = "不确定"
            break;
        case 0:
            type = "未处理"
            break;
        default:
            type = "未处理"
    }
    return type
}


/**
 * 房间类型
 */
export function getRoomType(label) {
    let type
    switch (label) {
        case 1:
            type = "房间"
            break;
        case 2:
            type = "厕所"
            break;
        case 3:
            type = "其他"
            break;
    }
    return type
}


/**
 * 欺凌场景类型
 */
export function getBullyingType(label) {
    let type
    switch (label) {
        case 'sos':
            type = "主动呼救检测"
            break;
        case 'threat':
            type = "欺凌者呵斥威胁检测"
            break;
        case 'insult':
            type = "欺凌者谩骂声检测"
            break;
        case 'victim':
            type = "受害人声检测"
            break;
        case 'accomplice':
            type = "围观事件检测"
            break;
        case 'smoke':
            type = "吸烟词语检测"
            break;
    }
    return type
}


/**
 * 获取播放声音的声音源
 */
export function getSrc(value) {
    let src
    console.log("sound", value)
    switch (value) {
        case 0:
            src = 'https://api.g2.aibabel.cn/assets/native/9725.mp3'
            break;
        case 1:
            src = 'https://alarm.aibabel.cn/native/0001.wav'
            break;
        default:
            src = 'https://api.g2.aibabel.cn/assets/native/9725.mp3'
    }
    return src
}


/**
 * interface Options {
 *  uid: string // 用户账号
 *  channelName: string // 频道名称
 *  appkey: string // 你的 appkey
 *  appSecret: string // 你的 appsecret
 * }
 */
export const getToken = ({ uid, channelName, appkey, appSecret }) => {
    const getTokenUrl = 'https://api.yunxinapi.com/nimserver/user/getToken.action'
    const Nonce = Math.ceil(Math.random() * 1e9)
    const CurTime = Math.ceil(Date.now() / 1000)
    const aaa = `${appSecret}${Nonce}${CurTime}`
    const sha1 = new JsSha('SHA-1', 'TEXT', { encoding: 'UTF8' })
    sha1.update(aaa)
    const CheckSum = sha1.getHash('HEX')
    return new Promise((resolve, reject) => {
        axios.post(getTokenUrl, `uid=${uid}&channelName=${channelName}`, {
            // .post(getTokenUrl, `uid=${uid}&channelName=${channelName}&device_id=${channelName}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                AppKey: appkey,
                Nonce,
                CurTime,
                CheckSum,
            }
        })
            .then(function (data) {
                let d = data.data;
                if (d.code !== 200) {
                    // if (d.code !== 0) {
                    reject(new Error('getChecksum code: ' + d.code));
                    return
                }
                resolve(d.token)
            })
            .catch((error) => {
                reject(new Error('getChecksum error: ', error));
            });
    })
}

/**
 * 检查浏览器是否符合
 * @param type
 * @returns {*|boolean}
 */
export const checkBrowser = (type) => {
    const ua = navigator.userAgent.toLowerCase();
    const info = {
        ie: /msie/.test(ua) && !/opera/.test(ua),
        opera: /opera/.test(ua),
        safari: /version.*safari/.test(ua),
        chrome: /chrome/.test(ua),
        firefox: /gecko/.test(ua) && !/webkit/.test(ua)
    };
    return info[type] || false;
}

/**
 * 判定是否大于3.0.0并且小于3.4.9
 * @param version
 * @param minVersion
 * @param maxVersion
 * @returns {boolean}
 */
export function compareVersions(version, minVersion, maxVersion) {
    const currentVersion = version.split('.').map(Number);
    const min = minVersion.split('.').map(Number);
    const max = maxVersion.split('.').map(Number);

    if ((currentVersion[0] > min[0] || (currentVersion[0] === min[0] && (currentVersion[1] > min[1] || (currentVersion[1] === min[1] && currentVersion[2] >= min[2])))) &&
        (currentVersion[0] < max[0] || (currentVersion[0] === max[0] && (currentVersion[1] < max[1] || (currentVersion[1] === max[1] && currentVersion[2] < max[2]))))) {
        return true;
    } else {
        return false;
    }
}

/**
 * 判定当前版本号是位大于3.0.2并且小于3.0.5
 * @param version
 * @returns {boolean}
 */
export function compareVersion(version) {
    const versionArr = version.split('.').map(Number);
    const minVersion = [3, 0, 2];
    const maxVersion = [3, 5, 0];

    if (versionArr[0] > minVersion[0] || (versionArr[0] === minVersion[0] && versionArr[1] > minVersion[1]) ||
        (versionArr[0] === minVersion[0] && versionArr[1] === minVersion[1] && versionArr[2] >= minVersion[2])) {
        if (versionArr[0] < maxVersion[0] || (versionArr[0] === maxVersion[0] && versionArr[1] < maxVersion[1]) ||
            (versionArr[0] === maxVersion[0] && versionArr[1] === maxVersion[1] && versionArr[2] < maxVersion[2])) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// // 测试
/**
 * 判定大于等于目标版本号
 * @param version
 * @returns {boolean}
 */

export function isVersionGreaterOrEqual(version, targetVersion) {

    const currentVersion = version.split('.').map(Number);
    const target = targetVersion.split('.').map(Number);

    if (currentVersion[0] > target[0] ||
        (currentVersion[0] === target[0] &&
            (currentVersion[1] > target[1] ||
                (currentVersion[1] === target[1] &&
                    currentVersion[2] >= target[2])))) {
        return true;
    } else {
        return false;
    }
}

/**
 * 根据用户角色来获取菜单
 * @param routes
 * @param role
 * @returns {*}
 */
export function filterRoutesByRole(routes, role) {
    return routes.filter(route => {
        if (route.meta && route.meta.roles) {
            // 检查当前角色是否在允许的角色列表中
            if (route.meta.roles.includes(role)) {
                return true;
            }
        }
        return false;
    });
}


/**
 * 系统用户类型
 */
export function getCurrentUserRole() {
    let role = getCompanyType();
    let type;
    switch (parseInt(role)) {
        case 3:
        case 0:
            type = "user";
            break;
        case 5:
            type = "edu";
            break;
        default:
            type = "user";
            break;
    }
    return type
}

/**
 * SIM状态
 */
export function getSIMStatus(type, statusCode) {
    let status;
    if (type == -1) {
        status = "特殊卡商～未知"
    } else if (type == 1) {
        // 1停机，2正常，3待激活，4预销户，5销户,6休眠,7申请销户
        switch (statusCode) {
            case 1:
                status = "停机";
                break;
            case 2:
                status = "正常";
                break;
            case 3:
                status = "待激活";
                break;
            case 4:
                status = "预销户";
                break;
            case 5:
                status = "销户";
                break;
            case 6:
                status = "休眠";
                break;
            case 7:
                status = "申请销户";
                break;
            default:
                status = "未知";
                break;
        }
    } else if (type == 2) {
        // 0-库存,1-测试期,2-沉默期,3-正式使用,4-停机,6-未知,9-预销户,10-已销户
        switch (statusCode) {
            case 0:
                status = "库存";
                break;
            case 1:
                status = "测试期";
                break;
            case 2:
                status = "沉默期";
                break;
            case 3:
                status = "正常";
                break;
            case 4:
                status = "停机";
                break;
            case 9:
                status = "预销户";
                break;
            case 6:
                status = "未知";
                break;
            case 10:
                status = "已销户";
                break;
            default:
                status = "未知";
                break;
        }
    }

    return status
}


/**
 * 订单状态
 */
export function getOrderStatus(orderCode) {
    let status;
    //订单状态,0=代付款,1=关闭订单,2=付款完成,3=删除,4=退款,5=处理完成
    switch (orderCode) {
        case 0:
            status = "待付款";
            break;
        case 1:
            status = "关闭订单";
            break;
        case 2:
            status = "付款完成";
            break;
        case 3:
            status = "已删除";
            break;
        case 4:
            status = "已退款";
            break;
        case 5:
            status = "已完成";
            break;
        default:
            status = "未知";
            break;
    }


    return status
}


/**
 * 函数计算当前日期的上一个周的开始日期
 * @returns {string}
 */
export function getLastWeekOfYear() {
    // 获取当前日期
    const today = new Date();

    // 计算上周的日期
    const lastWeekDate = new Date(today);
    lastWeekDate.setDate(today.getDate() - 7);

    // 获取上周的年份
    const year = lastWeekDate.getFullYear();

    // 获取上周的第几周
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((lastWeekDate - startOfYear) / (24 * 60 * 60 * 1000));

    // 计算上周的周数
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    return year + "-" + weekNumber

}


/**
 * getISOWeekNumber
 * @param date
 * @returns {number}
 */
export function getISOWeekNumber(date) {
    const tempDate = new Date(date.getTime());
    // 将日期调整到最近的星期一
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
}

/**
 * 判定字符串是否为空
 * @param str
 * @returns {boolean}
 */
export function isStringEmpty(str) {
    return str === undefined || str === null || str.length === 0;
}

/**
 *  检查数组是否包含指定的字符串,不包含则添加到数组中
 * @param arr
 * @param str
 * @returns {*}
 */
export function addStringIfNotExists(arr, str) {
    // 检查数组是否包含指定的字符串
    if (!arr.includes(str)) {
        arr.push(str); // 如果不包含，则将字符串添加到数组中
    }
    return arr;
}


/**
 * 生成UUID
 * @returns {string}
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

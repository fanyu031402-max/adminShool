
const crypto = require('crypto');
/**
 * 功能说明：计算并获取 CheckSum
 * @param {String} appSecret 密码
 * @param {String} nonce 随机串
 * @param {String} curTime 当前时间戳
 * @return {String} 返回生成的验证码
 */
export function getCheckSum(appSecret, nonce, curTime) {
    return encode('sha1', appSecret + nonce + curTime);
}

/**
 * 功能说明：对参数进行 MD5 加密
 * @param {String} requestBody 要加密的内容
 * @return {String} 返回 MD5 加密后的字符串
 */
export function getMD5(requestBody) {
    return encode('md5', requestBody);
}

/**
 * 功能说明：使用指定加密算法对字符串进行加密
 * @param {String} algorithm 加密算法
 * @param {String} value 要加密的字符串
 * @return {String} 返回加密后的字符串
 */
function encode(algorithm, value) {
    if (value == null) {
        return null;
    }
    const hash = crypto.createHash(algorithm);
    hash.update(value);
    return getFormattedText(hash.digest());
}

/**
 * 功能说明：把字节数组格式化为16进制字符串
 * @param {Buffer} bytes 字节数组
 * @return {String} 返回格式化后的字符串
 */
function getFormattedText(bytes) {
    return bytes.toString('hex');
}

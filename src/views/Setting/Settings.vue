<template>
    <div class="settings-container">
        <!-- 主内容区域 -->
        <!-- <el-card class="settings-card" shadow="hover"> -->
        <!-- 标题 -->
        <!-- <div class="header">
          <i class="el-icon-setting"></i>
          <h2>系统偏好设置</h2>
        </div> -->

        <!-- 设置项分组 -->
        <div class="settings-group">
            <!-- 系统提示设置 -->
            <div class="setting-item">
                <div class="setting-content">
                    <i class="el-icon-message-solid" :style="{ color: '#409EFF' }"></i>
                    <div class="text">
                        <h3>新报警提醒</h3>
                        <p>接收系统报警提醒</p>
                    </div>
                </div>
                <el-switch v-model="form.voice" @change="changeVoice" :active-color="'#409EFF'" inactive-color="#dcdfe6" />
                <span style="color: #409EFF;margin-left: 15px;cursor: pointer;" @click="onSubmit">保存</span>
            </div>
            <div class="setting-item" v-if="form.voice"> 
                <div class="setting-content">
                    <i class="el-icon-mic" :style="{ color: '#E6A23C' }"></i>
                    <div class="text">
                        <h3>声音提示</h3>
                        <p>系统提醒音效</p>
                    </div>
                </div>

                <div style="float: right;margin-right: 30px;">
                    <el-radio-group v-model="form.sound" @change="change">
                        <el-radio :label="0">声音一</el-radio>
                        <el-radio :label="1">声音二</el-radio>
                    </el-radio-group>
                    <audio controls="controls" hidden :src="src" ref="audio" id="audio"></audio>
                </div>
                <!-- <el-switch v-model="soundEffects" :active-color="'E6A23C'" inactive-color="#dcdfe6" /> -->
            </div>


            <!-- 修改密码按钮 -->
            <div class="setting-item password-item">
                <div class="setting-content">
                    <i class="el-icon-lock" style="color: #f56c6c"></i>
                    <div class="text">
                        <h3>账户安全</h3>
                        <p>定期修改密码保障账户安全</p>
                    </div>
                </div>
                <el-button type="danger" icon="el-icon-edit" @click="showPasswordDialog">修改密码</el-button>
            </div>
            <!-- 清空服务器配置 -->
            <div class="setting-item">
                <div class="setting-content">
                    <i class="el-icon-delete" style="color: #E6A23C"></i>
                    <div class="text">
                        <h3>清空服务器配置</h3>
                        <p>清除已保存的服务器配置信息</p>
                    </div>
                </div>
                <el-button type="warning" icon="el-icon-delete" @click="clearServerConfig">清空配置</el-button>
            </div>
            <div class="setting-item" @click="loginOut"> 
                <div class="setting-content">
                    <i class="el-icon-switch-button" :style="{ color: '#F56C6C' }"></i>
                    <div class="text">
                        <h3>退出账号</h3>
                    </div>
                </div>
            </div>

            <!-- 版本信息 -->
            <div class="setting-item version-info">
                <div class="setting-content">
                    <i class="el-icon-info" :style="{ color: '#909399' }"></i>
                    <div class="text">
                        <h3>应用版本</h3>
                        <p>当前版本：{{ appVersion }}</p>
                    </div>
                </div>
            </div>

            <!-- 应用升级 -->
            <div class="setting-item">
                <div class="setting-content">
                    <i class="el-icon-upload2" :style="{ color: '#67C23A' }"></i>
                    <div class="text">
                        <h3>应用升级</h3>
                        <p v-if="!hasNewVersion">当前已是最新版本</p>
                        <p v-else class="new-version-tip">发现新版本：{{ newVersion }}</p>
                    </div>
                </div>
                <el-button 
                    :type="hasNewVersion ? 'success' : 'info'" 
                    :icon="checkingUpdate ? 'el-icon-loading' : 'el-icon-refresh'"
                    :loading="checkingUpdate"
                    @click="checkForUpdate"
                >
                    {{ checkingUpdate ? '检查中...' : (hasNewVersion ? '立即升级' : '检查更新') }}
                </el-button>
            </div>

        </div>
        <!-- </el-card> -->

        <!-- 密码修改弹窗 -->
        <el-dialog title="修改密码" :visible.sync="passwordDialogVisible" width="600px">
            <!-- custom-class="password-dialog" -->
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="120px">
                <el-form-item label="原密码" prop="oldPassword">
                    <el-input type="password" v-model="passwordForm.oldPassword" placeholder="请输入原密码"
                        show-password></el-input>
                </el-form-item>

                <el-form-item label="新密码" prop="newPassword">
                    <el-input type="password" v-model="passwordForm.newPassword" placeholder="8-16位，包含字母和数字"
                        show-password></el-input>
                </el-form-item>

                <el-form-item label="确认新密码" prop="confirmPassword">
                    <el-input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码"
                        show-password></el-input>
                </el-form-item>
            </el-form>

            <span slot="footer">
                <el-button class="cancel" @click="cancel">取消</el-button>
                <el-button type="primary" :loading="isSubmitting" @click="submitPasswordForm">确认修改</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { UserModify } from "@/api/login";
import md5 from 'js-md5';
import { getSrc } from "@/utils/common";
import { Save } from "@/api/common";
import { mapState } from 'vuex';
import { clearServerConfig as clearServerConfigUtil } from '@/utils/serverConfig';
export default {
    data() {
        const validatePassword = (rule, value, callback) => {
            if (!/(?=.*[A-Za-z])(?=.*\d).{8,16}/.test(value)) {
                callback(new Error('密码必须包含字母和数字，长度8-16位'));
            } else {
                callback();
            }
        };

        return {
            appVersion: require('../../../package.json').version, // 从 package.json 读取版本号
            // 升级相关
            checkingUpdate: false,
            hasNewVersion: false,
            newVersion: '',
            downloadUrl: '',
            form: {
        voice: this.$store.state.userInfo.voice,
        sound: this.$store.state.userInfo.sound,
      },
            src: "https://api.g2.aibabel.cn/assets/native/9725.mp3",
            soundEffects:true,
            passwordDialogVisible: false,
            isSubmitting: false,
            passwordForm: {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            passwordRules: {
                oldPassword: [
                    { required: true, message: '请输入原密码', trigger: 'blur' }
                ],
                newPassword: [
                    { required: true, message: '请输入新密码', trigger: 'blur' },
                    { validator: validatePassword, trigger: 'blur' }
                ],
                confirmPassword: [
                    { required: true, message: '请确认新密码', trigger: 'blur' },
                    {
                        validator: (rule, value, callback) => {
                            if (value !== this.passwordForm.newPassword) {
                                callback(new Error('两次输入密码不一致'));
                            } else {
                                callback();
                            }
                        },
                        trigger: 'blur'
                    }
                ]
            },
            systemSettings: [
                {
                    title: '新报警提醒',
                    desc: '接收系统报警提醒',
                    icon: 'el-icon-message-solid',
                    color: '#409EFF',
                    value: true,
                    soundEffects: false
                },
                //   {
                //     title: '桌面通知',
                //     desc: '重要事件桌面弹窗提醒',
                //     icon: 'el-icon-monitor',
                //     color: '#67C23A',
                //     value: false
                //   },
                {
                    title: '声音提示',
                    desc: '系统提醒音效',
                    icon: 'el-icon-mic',
                    color: '#E6A23C',
                    value: true,
                    soundEffects: true
                }
            ]
        };
    },
    // computed: mapState({
    //     voice: state => state.userInfo.voice,
    //     sound: state => state.userInfo.sound,
    // }),
    methods: {
        changeVoice(value){
            this.$store.commit("SET_VOICE", value);
        },
        /**
     * 修改声音
     */
    onSubmit() {
      let requestData = {
        voice: this.form.voice,
        is_sound_type: parseInt(this.form.sound)
      }
      Save(requestData).then(response => {
        this.$store.commit("SET_SOUND", this.form.sound);
        this.$message({
          message: response.data.msg,
          type: "success"
        });
      })
    },
        /**
     * 播放
     */
    playMusic() {
      this.$refs.audio.pause();//停止
      this.$refs.audio.currentTime = 0;//从头开始播放
      this.$refs.audio.play(); //播放
    },
        /**
     * 声音类型选项改变
     * @param value
     */
    change(value) {
      this.$refs.audio.src = getSrc(value)
      this.playMusic();
    },
        cancel(){
            this.passwordDialogVisible = false
            this.passwordForm={
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        },
        loginOut(){
       this.$router.push('/login')
        },
        /**
     * 修改密码
     * @param requestData
     */
    userModify(requestData) {
      UserModify(requestData).then(response => {
        let data = response.data
        this.$message({
          message: data.msg,
          type: "success"
        });
        this.$message.success("修改成功,2秒后跳转到登录页！");
        setTimeout(() => {
          this.loginOut();//调用跳转到登陆页的方法
          this.isSubmitting = false;
          this.passwordDialogVisible = false;
        }, 2000);

      })
    },
        showPasswordDialog() {
            this.passwordDialogVisible = true;
            this.$nextTick(() => {
                this.$refs.passwordForm.resetFields();
            });
        },
        submitPasswordForm() {
            this.$refs.passwordForm.validate(valid => {
                if (valid) {
                    this.isSubmitting = true;
                    // 模拟提交请求
                    let requestData = Object.assign({}, this.passwordForm); //
          requestData.password = md5(requestData.newPassword).toUpperCase();
          this.userModify(requestData);
                }
            });
        },
        /**
         * 清空服务器配置
         */
        clearServerConfig() {
            this.$confirm('确定要清空服务器配置吗？清空后需要重新配置服务器地址才能使用。', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                clearServerConfigUtil()
                this.$message.success('服务器配置已清空')
                // 延迟跳转到服务器配置页面
                setTimeout(() => {
                    this.$router.push('/server-config')
                }, 1000)
            }).catch(() => {
                // 用户取消操作
            })
        },
        /**
         * 检查更新
         */
        async checkForUpdate() {
            // 如果已有新版本，点击时直接下载
            if (this.hasNewVersion && this.downloadUrl) {
                this.downloadUpdate()
                return
            }
            
            this.checkingUpdate = true
            try {
                // 检查是否在 Electron 环境中
                if (window.electronAPI && window.electronAPI.checkForUpdate) {
                    // Electron 环境，使用 IPC 通信
                    const result = await window.electronAPI.checkForUpdate()
                    if (result.hasUpdate) {
                        this.hasNewVersion = true
                        this.newVersion = result.version
                        this.downloadUrl = result.downloadUrl
                        this.$message.success(`发现新版本 ${result.version}`)
                    } else {
                        this.$message.info('当前已是最新版本')
                    }
                } else {
                    // 非 Electron 环境或未配置，使用 HTTP 请求检查
                    await this.checkUpdateFromServer()
                }
            } catch (error) {
                console.error('检查更新失败:', error)
                this.$message.error('检查更新失败，请稍后重试')
            } finally {
                this.checkingUpdate = false
            }
        },
        /**
         * 从服务器检查更新
         */
        async checkUpdateFromServer() {
            try {
                // 从服务器获取最新版本信息
                // 你需要在服务器上提供一个版本检查接口
                const response = await fetch('/api/app/version')
                const data = await response.json()
                
                if (this.compareVersion(data.version, this.appVersion) > 0) {
                    this.hasNewVersion = true
                    this.newVersion = data.version
                    this.downloadUrl = data.downloadUrl
                    this.$message.success(`发现新版本 ${data.version}`)
                } else {
                    this.$message.info('当前已是最新版本')
                }
            } catch (error) {
                // 如果服务器接口不可用，提示用户
                this.$message.warning('暂无法检查更新，请稍后重试')
            }
        },
        /**
         * 比较版本号
         * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 = v2
         */
        compareVersion(v1, v2) {
            const parts1 = v1.split('.').map(Number)
            const parts2 = v2.split('.').map(Number)
            
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const num1 = parts1[i] || 0
                const num2 = parts2[i] || 0
                if (num1 > num2) return 1
                if (num1 < num2) return -1
            }
            return 0
        },
        /**
         * 下载更新
         */
        downloadUpdate() {
            if (window.electronAPI && window.electronAPI.downloadUpdate) {
                // Electron 环境，使用内置更新
                this.$confirm('是否立即下载并安装新版本？', '升级提示', {
                    confirmButtonText: '立即升级',
                    cancelButtonText: '稍后再说',
                    type: 'info'
                }).then(() => {
                    window.electronAPI.downloadUpdate()
                    this.$message.info('正在下载更新，下载完成后将自动安装...')
                }).catch(() => {})
            } else if (this.downloadUrl) {
                // 非 Electron 环境，打开下载链接
                this.$confirm(`是否下载新版本 ${this.newVersion}？`, '升级提示', {
                    confirmButtonText: '下载',
                    cancelButtonText: '取消',
                    type: 'info'
                }).then(() => {
                    window.open(this.downloadUrl, '_blank')
                }).catch(() => {})
            }
        }
    }
};
</script>

<style scoped>
.settings-container {
    background-color: #2c3348;
    /* background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); */
    /* min-height: 100vh; */
    padding: 40px;
    margin: 10px;
    border-radius: 10px;
}

.settings-card {
    max-width: 800px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
}

.header {
    display: flex;
    align-items: center;
    padding: 20px;
    background: linear-gradient(45deg, #409EFF, #337ecc);
    margin: -20px -20px 20px -20px;
    color: white;
}

.header i {
    font-size: 28px;
    margin-right: 15px;
}

.header h2 {
    margin: 0;
    font-weight: 500;
}

.settings-group {
    padding: 0 20px;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid #575d6e;
    transition: all 0.3s ease;
}

.setting-item:hover {
    /* background: rgba(236, 245, 255, 0.3); */
    /* transform: translateX(10px); */
}

.setting-content {
    display: flex;
    align-items: center;
    flex: 1;
}

.setting-content i {
    font-size: 24px;
    margin-right: 20px;
    width: 40px;
    text-align: center;
}

.text h3 {
    margin: 0;
    font-size: 16px;
    color: #d1cccc;
}
.el-radio{
    color: #d1cccc;
}

.text p {
    margin: 5px 0 0;
    font-size: 13px;
    color: #909090;
}

.password-item {
    /* border-bottom: none; */
    padding: 30px 0 30px;
}

.version-info {
    border-bottom: none !important;
    padding: 20px 0;
    opacity: 0.8;
}

.version-info .text p {
    color: #67C23A;
    font-weight: 500;
}

/* 自定义弹窗样式 */
::v-deep .password-dialog {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

::v-deep .password-dialog .el-dialog__header {
    background: linear-gradient(45deg, #409EFF, #337ecc);
    border-radius: 12px 12px 0 0;
    padding: 20px;
}

::v-deep .password-dialog .el-dialog__title {
    color: white;
    font-size: 18px;
}

::v-deep .password-dialog .el-dialog__headerbtn {
    top: 22px;
}

::v-deep .password-dialog .el-dialog__body {
    padding: 30px 25px;
}

::v-deep .password-dialog .el-form-item__label {
    font-weight: 500;
    color: #606266;
    padding-bottom: 8px;
}
::v-deep .el-dialog{
    background-color: #252a39;
}
::v-deep .el-dialog__title{
    color: #d1cccc;
}
::v-deep .el-form-item__label{
    color: #ccc;
}
::v-deep .el-input__inner{
    background-color: transparent;
    border: solid 1px #575d6e;
    color: #909090;
}
::v-deep .el-input__inner::placeholder{
    color: #575d6e;
}
.cancel{
    background-color: #434b63;
    border-color: #434b63;
    color: #ccc;
}

.new-version-tip {
    color: #67C23A !important;
    font-weight: 500;
}
</style>
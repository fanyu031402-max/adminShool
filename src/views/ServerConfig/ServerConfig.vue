<template>
  <div class="server-config">
    <div class="mask">
      <div class="config-container">
        <h2 class="title">服务器配置</h2>
        <div class="config-form">
          <el-form :rules="rules" ref="configForm" :model="ruleForm">
            <el-form-item label="服务类型" prop="serviceType">
              <el-select v-model="ruleForm.serviceType" placeholder="请选择服务类型" style="width: 100%;" @change="handleServiceTypeChange">
                <el-option label="线上服务" value="online"></el-option>
                <el-option label="本地服务" value="local"></el-option>
              </el-select>
            </el-form-item>
            <!-- 线上服务提示 -->
            <el-form-item v-if="ruleForm.serviceType === 'online'">
              <div style="color: #909090; font-size: 12px; text-align: left; padding-left: 10px;">
                <i class="el-icon-info"></i> 将使用项目配置的接口地址（根据开发/生产环境自动选择）
              </div>
            </el-form-item>
            <!-- 本地服务配置项，仅当选择本地服务时显示 -->
            <template v-if="ruleForm.serviceType === 'local'">
              <el-form-item label="协议" prop="protocol">
                <el-select v-model="ruleForm.protocol" placeholder="请选择协议" style="width: 100%;">
                  <el-option label="HTTP" value="http"></el-option>
                  <el-option label="HTTPS" value="https"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="IP地址/域名" prop="ip">
                <el-input 
                  v-model="ruleForm.ip" 
                  prefix-icon="el-icon-connection" 
                  placeholder="请输入服务器IP地址或域名"
                  @input="handleIPChange"
                ></el-input>
              </el-form-item>
              <el-form-item v-if="showPortInput" label="端口" prop="port">
                <el-input 
                  v-model="ruleForm.port" 
                  prefix-icon="el-icon-connection" 
                  placeholder="请输入端口号"
                ></el-input>
              </el-form-item>
            </template>
            <el-form-item label="" style="margin-top: 20px;">
              <el-button type="primary" style="width:100%;" @click="saveConfig">保存配置</el-button>
            </el-form-item>
            <!-- <el-form-item label="" style="margin-top: 10px;">
              <el-button type="text" style="width:100%; color: #409eff;" @click="goToLogin">返回登录</el-button>
            </el-form-item> -->
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getServerConfig, saveServerConfig } from '@/utils/serverConfig'
import { updateBaseURL } from '@/utils/request'

export default {
  name: 'ServerConfig',
  data() {
    // 验证IP地址或域名（仅在本地服务时验证）
    let validateIP = (rule, value, callback) => {
      // 如果服务类型是线上服务，不需要验证
      if (this.ruleForm.serviceType === 'online') {
        callback()
        return
      }
      
      if (value === '') {
        callback(new Error('请输入IP地址或域名'))
      } else {
        // 简单的IP地址或域名验证
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^localhost$|^[\w.-]+$/
        if (!ipPattern.test(value)) {
          callback(new Error('请输入有效的IP地址或域名'))
        } else {
          callback()
        }
      }
    }
    
    // 验证协议（仅在本地服务时验证）
    let validateProtocol = (rule, value, callback) => {
      // 如果服务类型是线上服务，不需要验证
      if (this.ruleForm.serviceType === 'online') {
        callback()
        return
      }
      
      if (!value) {
        callback(new Error('请选择协议'))
      } else {
        callback()
      }
    }

    return {
      ruleForm: {
        serviceType: 'online', // 默认选择线上服务
        protocol: 'http',
        ip: '192.168.1.154',
        port: '8080'
      },
      rules: {
        serviceType: [
          { required: true, message: '请选择服务类型', trigger: 'change' }
        ],
        protocol: [
          { validator: validateProtocol, trigger: 'change' }
        ],
        ip: [
          { validator: validateIP, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    /**
     * 判断是否显示端口输入框
     * 如果是IP地址则显示，如果是域名则不显示
     */
    showPortInput() {
      if (this.ruleForm.serviceType !== 'local') {
        return false
      }
      const ip = this.ruleForm.ip || ''
      // 判断是否为IP地址（格式：xxx.xxx.xxx.xxx）
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      return ipPattern.test(ip.trim())
    }
  },
  mounted() {
    // 加载已保存的配置
    const savedConfig = getServerConfig()
    if (savedConfig) {
      this.ruleForm = {
        serviceType: savedConfig.serviceType || 'online',
        protocol: savedConfig.protocol || 'http',
        ip: savedConfig.ip || '192.168.1.154',
        port: savedConfig.port || '8080'
      }
    }
  },
  methods: {
    /**
     * 服务类型改变时的处理
     */
    handleServiceTypeChange(value) {
      // 当切换到线上服务时，清空本地配置的验证错误
      if (value === 'online') {
        this.$nextTick(() => {
          this.$refs.configForm.clearValidate(['protocol', 'ip', 'port'])
        })
      }
    },
    /**
     * IP地址/域名输入改变时的处理
     */
    handleIPChange() {
      // 触发计算属性重新计算，更新端口输入框的显示状态
      this.$forceUpdate()
    },
    /**
     * 保存配置
     */
    saveConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          const configToSave = {
            serviceType: this.ruleForm.serviceType
          }
          
          // 如果是本地服务，保存本地配置
          if (this.ruleForm.serviceType === 'local') {
            configToSave.protocol = this.ruleForm.protocol
            configToSave.ip = this.ruleForm.ip
            configToSave.port = this.ruleForm.port
          } else {
            // 线上服务保留之前的本地配置作为默认值（用于下次切换到本地服务时使用），但不使用
            configToSave.protocol = this.ruleForm.protocol || 'http'
            configToSave.ip = this.ruleForm.ip || 'localhost'
            configToSave.port = this.ruleForm.port || '8080'
          }
          
          const success = saveServerConfig(configToSave)
          if (success) {
            // 更新请求的 baseURL
            updateBaseURL()
            this.$message.success('服务器配置保存成功！')
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
              this.$router.push('/login')
            }, 500)
          } else {
            this.$message.error('保存配置失败，请重试')
          }
        } else {
          this.$message.error('请填写正确的配置信息')
          return false
        }
      })
    },
    /**
     * 返回登录页面
     */
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style lang="less" scoped>
.server-config {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  text-align: center;
}

.mask {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #1c1d29;
}

.config-container {
  overflow: hidden;
  position: relative;
  width: 430px;
  max-width: 100%;
  padding-bottom: 16px;
  margin: 0 auto;
  background: #2c3348;
  border-radius: 8px;
  box-shadow: 0 0 6px #2c3348;
}

.config-container .title {
  margin-top: 32px;
  margin-bottom: 24px;
  font-size: 26px;
  font-weight: bold;
  color: #d1cccc;
}

.config-container .config-form {
  width: 60%;
  margin: 0 auto;
  padding-bottom: 10px;
}

::v-deep .el-input__inner {
  background-color: transparent;
  border: solid 1px #575d6e;
  color: #909090;
}

::v-deep .el-input__inner::placeholder {
  color: #575d6e;
}

::v-deep .el-select .el-input__inner {
  background-color: transparent;
  border: solid 1px #575d6e;
  color: #909090;
}

::v-deep .el-form-item__label {
  color: #ccc;
}

::v-deep .el-dialog {
  background-color: #252a39;
}

::v-deep .el-dialog__title {
  color: #d1cccc;
}
</style>


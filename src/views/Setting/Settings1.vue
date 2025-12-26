<template>
  <div class="system-settings" :class="{ 'dark-mode': isDark }">
    <!-- 头部区域 -->
    <div class="header-bar">
      <h1 class="system-title">
        <i class="el-icon-setting"></i>
        系统设置
      </h1>
      <div class="window-controls">
        <div class="control-btn minimize" @click="minimizeWindow">
          <i class="el-icon-minus"></i>
        </div>
        <div class="control-btn close" @click="closeWindow">
          <i class="el-icon-close"></i>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="settings-container">
      <!-- 左侧导航 -->
      <div class="settings-nav">
        <div 
          v-for="(item, index) in navItems"
          :key="index"
          class="nav-item"
          :class="{ active: activeNav === index }"
          @click="activeNav = index"
        >
          <i :class="item.icon"></i>
          {{ item.label }}
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="settings-content">
        <transition name="fade-slide" mode="out-in">
          <!-- 账户设置 -->
          <div v-if="activeNav === 0" class="settings-section">
            <el-card class="setting-card">
              <div slot="header" class="card-header">
                <i class="el-icon-user"></i>
                <span>账户设置</span>
              </div>
              
              <el-form 
                ref="passwordForm"
                :model="form"
                :rules="rules"
                label-position="top"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input
                    v-model="form.oldPassword"
                    type="password"
                    prefix-icon="el-icon-lock"
                    placeholder="请输入原密码"
                  ></el-input>
                </el-form-item>

                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="form.newPassword"
                    type="password"
                    prefix-icon="el-icon-key"
                    placeholder="8-16位字母数字组合"
                  ></el-input>
                </el-form-item>

                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="form.confirmPassword"
                    type="password"
                    prefix-icon="el-icon-circle-check"
                    placeholder="请再次输入新密码"
                  ></el-input>
                </el-form-item>

                <el-button 
                  type="primary" 
                  class="submit-btn"
                  @click="submitForm"
                >
                  <i class="el-icon-upload2"></i>
                  提交修改
                </el-button>
              </el-form>
            </el-card>
          </div>

          <!-- 系统偏好 -->
          <div v-else class="settings-section">
            <el-card class="setting-card">
              <div slot="header" class="card-header">
                <i class="el-icon-s-operation"></i>
                <span>系统偏好</span>
              </div>

              <div class="preference-item">
                <div class="preference-label">
                  <i class="el-icon-chat-dot-round"></i>
                  消息通知
                </div>
                <el-switch
                  v-model="settings.notification"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                ></el-switch>
              </div>

              <div class="preference-item">
                <div class="preference-label">
                  <i class="el-icon-moon"></i>
                  暗黑模式
                </div>
                <el-switch
                  v-model="isDark"
                  active-color="#2d2d2d"
                  inactive-color="#dcdfe6"
                  @change="toggleDarkMode"
                ></el-switch>
              </div>

              <div class="preference-item">
                <div class="preference-label">
                  <i class="el-icon-refresh-right"></i>
                  自动更新
                </div>
                <el-switch
                  v-model="settings.autoUpdate"
                  active-color="#13ce66"
                ></el-switch>
              </div>

              <div class="preference-item">
                <div class="preference-label">
                  <i class="el-icon-data-analysis"></i>
                  数据统计
                </div>
                <el-switch
                  v-model="settings.analytics"
                  active-color="#13ce66"
                ></el-switch>
              </div>
            </el-card>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    const validatePass = (rule, value, callback) => {
      if (value !== this.form.newPassword) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      activeNav: 0,
      navItems: [
        { label: '账户安全', icon: 'el-icon-lock' },
        { label: '系统偏好', icon: 'el-icon-s-tools' }
      ],
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      settings: {
        notification: true,
        autoUpdate: true,
        analytics: false
      },
      isDark: false,
      rules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 8, max: 16, message: '长度在 8 到 16 个字符', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, 
            message: '必须包含字母和数字' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validatePass, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.passwordForm.validate(valid => {
        if (valid) {
          this.$message.success('密码修改成功');
          this.resetForm();
        } else {
          this.$message.error('请检查输入内容');
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.passwordForm.resetFields();
    },
    toggleDarkMode(val) {
      document.body.classList.toggle('dark-mode', val);
      // 此处可添加保存主题偏好的逻辑
    },
    minimizeWindow() {
      this.$electron.ipcRenderer.send('window-minimize');
    },
    closeWindow() {
      this.$electron.ipcRenderer.send('window-close');
    }
  }
}
</script>

<style lang="less" scoped>
.system-settings {
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;

  &.dark-mode {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: #fff;

    .setting-card {
      background: rgba(0, 0, 0, 0.6);
      border: none;
    }

    .preference-label {
      color: #e0e0e0;
    }
  }
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.1);
  -webkit-app-region: drag;

  .system-title {
    margin: 0;
    font-size: 24px;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      font-size: 28px;
      color: #409EFF;
    }
  }

  .window-controls {
    display: flex;
    gap: 12px;
    -webkit-app-region: no-drag;

    .control-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1);
      }

      &.minimize {
        background: #f0f0f0;
        &:hover { background: #e0e0e0; }
      }

      &.close {
        background: #ff5f56;
        color: white;
      }
    }
  }
}

.settings-container {
  display: flex;
  height: calc(100vh - 80px);
}

.settings-nav {
  width: 240px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 0 20px 0 0;

  .nav-item {
    padding: 15px 20px;
    margin: 8px 0;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s;
    color: #606266;

    &:hover {
      background: #409EFF20;
      transform: translateX(10px);
    }

    &.active {
      background: #409EFF;
      color: white;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    }

    i {
      font-size: 18px;
    }
  }
}

.settings-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.setting-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
  margin-bottom: 24px;

  ::v-deep .el-card__header {
    border-bottom: none;
    padding: 24px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      color: #303133;

      i {
        font-size: 24px;
        color: #409EFF;
      }
    }
  }

  .submit-btn {
    width: 100%;
    padding: 15px;
    font-size: 16px;
    border-radius: 12px;
    margin-top: 20px;
  }
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  .preference-label {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;

    i {
      font-size: 20px;
      color: #409EFF;
    }
  }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter, .fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

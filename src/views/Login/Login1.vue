<template>
  <div class="login-container">
    <el-card class="login-box">
      <div class="logo">
        <!-- <img src="../../assets/icon_logo.png" alt="App Logo"> -->
      </div>

      <!-- <el-tabs v-model="activeTab" stretch @tab-click="handleTabClick"> -->
        <!-- 账号密码登录 -->
        <!-- <el-tab-pane label="账号登录" name="account"> -->
          <el-form ref="accountForm" :model="accountForm" :rules="accountRules">
            <el-form-item prop="username">
              <el-input v-model="accountForm.username" placeholder="请输入账号" prefix-icon="el-icon-user"></el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="accountForm.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock"
                show-password></el-input>
            </el-form-item>
          </el-form>
        <!-- </el-tab-pane> -->

        <!-- 手机验证码登录
        <el-tab-pane label="手机登录" name="phone">
          <el-form ref="phoneForm" :model="phoneForm" :rules="phoneRules">
            <el-form-item prop="phone">
              <el-input v-model="phoneForm.phone" placeholder="请输入手机号" prefix-icon="el-icon-mobile-phone"></el-input>
            </el-form-item>

            <el-form-item prop="code">
              <div class="code-input">
                <el-input v-model="phoneForm.code" placeholder="请输入验证码" prefix-icon="el-icon-message"></el-input>
                <el-button :disabled="codeDisabled" @click="sendCode" class="code-btn">
                  {{ codeBtnText }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane> -->
      <!-- </el-tabs> -->

      <el-button type="primary" class="login-btn" @click="handleLogin">
        立即登录
      </el-button>
    </el-card>
  </div>
</template>

<script>
import md5 from 'js-md5';
export default {
  data() {
    // 手机号验证规则
    const validatePhone = (rule, value, callback) => {
      if (!/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号码'));
      } else {
        callback();
      }
    };

    return {
      activeTab: 'account',
      // 账号登录表单
      accountForm: {
        username: '',
        password: ''
      },
      // 手机登录表单
      phoneForm: {
        phone: '',
        code: ''
      },
      // 验证码按钮状态
      codeDisabled: false,
      codeBtnText: '获取验证码',
      countdown: 60,
      // 验证规则
      accountRules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      phoneRules: {
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    // 发送验证码
    sendCode() {
      this.$refs.phoneForm.validateField('phone', valid => {
        console.log(valid, 'valid')
        if (!valid) {
          this.codeDisabled = true;
          this.codeBtnText = `${this.countdown}秒后重发`;

          const timer = setInterval(() => {
            this.countdown--;
            this.codeBtnText = `${this.countdown}秒后重发`;

            if (this.countdown <= 0) {
              clearInterval(timer);
              this.codeDisabled = false;
              this.codeBtnText = '获取验证码';
              this.countdown = 60;
            }
          }, 1000);

          // 这里调用发送验证码接口
          console.log('发送验证码到:', this.phoneForm.phone);
        }
      });
    },
    // 处理登录
    handleLogin() {
      if (this.activeTab === 'account') {
        this.$refs.accountForm.validate(valid => {
          if (valid) {
            // 调用账号登录接口
            let requestData = {
              password: md5(this.accountForm.password).toUpperCase(),
              username: this.accountForm.username,
            }
            this.$store.dispatch('login', requestData).then(() => {

            this.$router.push('/dashboard')
              console.log('登录成功')
            })
          }
        });
      } else {
        this.$refs.phoneForm.validate(valid => {
          console.log(valid, 'valid1')
          if (valid) {
            // 调用手机验证码登录接口
            console.log('手机登录:', this.phoneForm);
            this.login(this.accountForm).then(() => {
              // 数据自动保存到 localStorage
            })
            this.$router.push('/dashboard')
          }
        });
      }
    },
    handleTabClick(tab) {
      this.activeTab = tab.name;
    }
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.logo {
  text-align: center;
  margin-bottom: 24px;
}

.logo img {
  width: 80px;
  height: 80px;
}

.code-input {
  display: flex;
  align-items: center;
}

.code-btn {
  margin-left: 10px;
  width: 120px;
}

.login-btn {
  width: 100%;
  margin-top: 20px;
  letter-spacing: 2px;
}

.el-tabs__item {
  font-size: 16px;
}

.el-input__inner {
  height: 45px;
}
</style>

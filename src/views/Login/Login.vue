<template>
    <div class="login">
      <div class="mask">
        <div class="login-container">
          <h2 class="title">校园防欺凌管理系统</h2>
          <div class="login-form">
            <el-form :rules="rules" ref="loginForm" :model="ruleForm">
              <el-form-item label="" prop="username">
                <el-input v-model="ruleForm.username" prefix-icon="el-icon-user" placeholder="请输入账号"></el-input>
              </el-form-item>
              <el-form-item label="" prop="password" style="margin-bottom: 10px;">
                <el-input
                    v-on:keyup.enter.native="login"
                    v-model="ruleForm.password"
                    :show-password="true"
                    prefix-icon="el-icon-lock"
                    placeholder="请输入密码"
                ></el-input>
              </el-form-item>
              <el-form-item prop="rememberMe" style="margin-bottom: 0px;">
                <el-checkbox style="float: left" v-model="rememberMe">记住密码</el-checkbox>
                <div class="right">
                  <el-tooltip placement="top">
                    <template #content> 请联系客服重置登录密码<br/>联系电话：400-996-6525</template>
                    <div>忘记密码？</div>
                  </el-tooltip>
                </div>
              </el-form-item>
              <div style="float: left; height: 40px; line-height: 40px;">
                <el-checkbox v-model="ruleForm.checked">仔细阅读并同意
                  <span style="color: #409eff; cursor: pointer;" @click.stop="showAgreementDialog">《用户协议》</span>
                </el-checkbox>
              </div>
              <el-form-item label="" style="margin-top: 44px">
                <el-button type="primary" style="width:100%;" @click="login">登录</el-button>
              </el-form-item>
              <el-form-item label="" style="margin-top: 10px;">
                <el-button type="text" style="width:100%; color: #409eff;" @click="goToConfig">配置服务器</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <!-- 用户协议弹窗 -->
      <el-dialog
        title="用户协议"
        :visible.sync="agreementDialogVisible"
        width="70%"
        :close-on-click-modal="false"
        :before-close="closeAgreementDialog"
        class="agreement-dialog">
        <div class="agreement-content">
          <div class="agreement-header">「校园防欺凌AI报警器」用户协议</div>
          <div class="agreement-text">
            <p>
              欢迎您使用校园防欺凌AI报警器及服务！
              <br><br>
              请您在使用校园防欺凌AI报警器（以下统称为"本设备"）及软件和服务（以下统称为"本服务"）前，务必仔细阅读并确认已充分理解本协议的全部内容，
              您点击"同意"、"下一步"及您的安装、使用等行为，即视为您已阅读并已充分理解且完全同意本协议的全部内容及条款，包括接受北京分音塔科技有限公司（以下简称"分音塔"）对用户协议所做的任何修改及更新，以及同意分音塔所发布或随时更新的隐私声明，本协议即在您与分音塔之间产生法律效力，成为对双方具有约束力的法律文件。
              如果您是非中国大陆地区的用户，您订立或履行本协议以及使用本设备和/或本服务的行为还需要同时遵守您所属和/或所处国家或地区的法律。
              <br><br>
              <strong>一、协议内容及生效</strong><br>
              1.1 本协议是您与分音塔之间关于您注册、安装、登录、使用本设备，以及使用本服务所订立的协议。<br>
              1.2 本协议内容包括所有以下正文及分音塔已经发布或将来可能发布的各类规则、规范、解释、声明及通告等，所有上述规则、规范、解释、声明及通告等均为本协议不可分割的组成部分，具有同等法律效力。<br>
              1.3 分音塔有权在必要时单方修改用户协议不再另行通知，修改后的协议一经发布即自动更新为您与分音塔之间的适用协议，您的继续使用即视为已完全了解、接受并同意遵守更新后的协议全部内容。<br>
              1.4 所有服务的所有权、运营权和解释权均归【北京分音塔科技有限公司】所有。一旦您完成注册程序，视为您已确认自己具备完全民事行为能力，明确自己应享有的相应权利，能够独立承担法律责任。<br>
              1.5 您/用户特此声明，已经完全理解本用户协议所有内容，并不存在任何重大误解；同时认可本用户协议并不存在显失公平的情形。
              <br><br>
              <strong>二、用户信息及隐私保护提醒</strong><br>
              2.1 本协议用户信息包括用户个人信息及非用户个人信息。用户个人信息包括但不限于用户真实姓名、年龄、身份证号、手机电话、银行账号、第三方支付账号、电子邮件以及个人健康信息等；非用户个人信息指除用户个人信息范围以外的其他所有信息，包括用户在本设备上操作、浏览、使用记录、使用习惯等全部记录信息。<br>
              2.2 分音塔基于为您提供设备、软件及服务的需要，有权在合理范围内获取、使用、储存及展示用户信息。您一旦注册、登录或使用本设备和/或本服务，将被视为分音塔已获得包括但不限于收集、统计、分析、商业用途等方式使用您的用户信息的权利。分音塔对用户信息的使用无需其他意思表示，无需向您支付任何费用。<br>
              2.3 您安装了我们的产品,您可能会采集使用者的声音、邮箱、电话等个人信息，您应该确保已经告知每一个使用者并获得了他们的充分授权。在使用产品过程中,您需要遵守所在地区或国家的隐私保护法律法规要求,并妥善管理，保障他人的合法权益。<br>
              2.4 您需保证所提供的信息合法、真实、准确、完整，不得出现违法及不良信息，如因您自行提供的信息存在非法、虚假、错误、侵犯他人隐私等问题，您需自行承担因此引发的后果及相应的责任，同时分音塔保留根据上述情形采取相应措施的权利，包括但不限于警示、限制使用及终止服务等。
              <br><br>
              <strong>三、用户行为规范</strong><br>
              3.1 您在使用本设备和/或本服务的过程中，应当遵守中国法律法规、行政规章、地方性法规及其他规范性文件；遵守所有用户协议、通知、声明等文件。<br>
              3.2 您不得利用本设备和/或本服务实施任何违法、犯罪行为，不得利用本设备传输及发布任何违法违规信息、严重违背社会公德、以及其他违反法律禁止性规定或国家相关强制管理规范的信息。<br>
              3.3 您同意分音塔可以自行或由第三方通过短信、电子邮件或电子信息等多种方式向您发送、展示广告或其他信息（包括商业与非商业信息），广告或其他信息的具体发送及展示形式、频次及内容等以分音塔实际提供为准。
              <br><br>
              <strong>四、知识产权声明</strong><br>
              4.1 分音塔是本软件的知识产权权利人。本设备的著作权、商标权、专利权、商业秘密等知识产权，以及与本软件相关的所有信息内容（包括但不限于文字、图片、音频、视频、图表、界面设计、版面框架、有关数据或电子文档等）均受法律法规和相应的国际条约保护，分音塔依法享有上述相关知识产权，但相关权利人依照法律规定应享有的权利除外。<br>
              4.2 未经分音塔或相关权利人书面同意，您不得为任何商业或非商业目的自行或许可任何第三方实施、利用、转让上述知识产权。
              <br><br>
              <strong>五、有限担保与责任限制</strong><br>
              5.1 您理解并同意，本设备和/或本服务同大多数互联网软件、服务一样，可能会受多种因素影响（包括但不限于用户原因、网络服务质量、社会环境等）；也可能会受各种安全问题的侵扰，因此，您应加强信息安全及个人信息的保护意识，注意密码保护及信息备份，并由您自行承担一切相关风险。<br>
              5.2 维护设备和软件安全与正常使用是分音塔和您的共同责任，分音塔将合理审慎地采取必要技术措施保护您的终端信息和数据安全，但是您承认和同意分音塔不能就此提供任何保证。
              <br><br>
              <strong>六、其他事项</strong><br>
              6.1 本协议的订立、执行、解释及争议的解决均应适用中国人民共和国法律及法规。<br>
              6.2 如协议缔约双方就本协议内容或其执行发生任何争议，双方应共同勉力友好协商解决；协商不成时，任何一方可向分音塔所在地所属的有管辖权的人民法院提起诉讼。
              <br><br>
              感谢您对校园防欺凌AI报警器产品和服务的信任和使用！
            </p>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="closeAgreementDialog">关闭</el-button>
          <el-button type="primary" @click="agreeAndClose">同意并关闭</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  <script>
  import md5 from 'js-md5';
  import {stripscript, validatePass} from '@/utils/validate';
  import { getBaseURL, getServiceType } from '@/utils/serverConfig'
  
  export default {
    name: 'login',
    data() {
      // 验证用户名
      let validateUsername = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入用户名'));
        } else {
          callback(); //true
        }
      };
      // 验证密码
      let validatePassword = (rule, value, callback) => {
        // 过滤后的数据
        this.ruleForm.password = stripscript(value);
        value = this.ruleForm.password;
        if (value === '') {
          callback(new Error("请输入密码"));
        } else if (validatePass(value)) {
          callback(new Error("密码为6至20位数字+字母"));
        } else {
          callback();
        }
      };
  
      return {
        // 模块值
        model: 'login',
        isDisabled: false,
        isChecked: false,
        rememberMe: true,
        agreementDialogVisible: false, // 用户协议弹窗显示状态
        checkedBeforeDialog: false, // 打开弹窗前的勾选状态
        // 表单绑定数据
        ruleForm: {
          username: '',
          password: '',
          checked: false
        },
        // 表单的验证
        rules: {
          username: [
            {validator: validateUsername, trigger: 'blur'}
          ],
          password: [
            {validator: validatePassword, trigger: 'blur'}
          ]
        }
      }
    },
    beforeCreate() {
    },
    created() {
    },
    beforeMount() {
    },
    mounted() {
      // 页面加载时检查 localStorage 是否有保存的用户名和密码
      const savedUsername = localStorage.getItem("username");
      const savedPassword = localStorage.getItem("password");
      const rememberMe = localStorage.getItem("rememberMe");
  
      if (savedUsername) {
        this.ruleForm.username = savedUsername;
      }
      if (savedPassword) {
        this.ruleForm.password = savedPassword;
      }
      if (rememberMe) {
        this.ruleForm.rememberMe = rememberMe;
      }
    },
    beforeUpdate() {
    },
    updated() {
    },
    beforeDestroy() {
    },
    destroyed() {
    },
    methods: {
      /**
       * 未勾选协议时逻辑
       */
       notSelectAgreement(){
        this.$confirm('是否已仔细阅读《用户协议》并确认继续登录?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal:false,
            type: 'warning'
          }).then(() => {
            this.ruleForm.checked=true
            this.login()
          }).catch(() => {
                    
          });
      },
      getLoginFullUrl() {
        const base = (getBaseURL() || process.env.VUE_APP_API || '').replace(/\/+$/, '')
        let path = 'user/webLogin'

        if (getServiceType() !== 'online') {
          if (path.startsWith('/v1/')) {
            // 已经以 /v1 开头
          } else if (path.startsWith('/')) {
            path = '/v1' + path
          } else {
            path = '/v1/' + path
          }
        } else {
          if (!path.startsWith('/')) {
            path = '/' + path
          }
        }

        return base + path
      },
      /**
       * 登录
       */
      login() {
        if (!this.ruleForm.checked) {
          this.notSelectAgreement()
          // this.$message.error("请仔细阅读并同意用户使用协议")
          return
        }
        // 如果勾选了“记住密码”，则将用户名和密码存储到 localStorage
        if (this.rememberMe) {
          localStorage.setItem("username", this.ruleForm.username);
          localStorage.setItem("password", this.ruleForm.password);
          localStorage.setItem("rememberMe", this.ruleForm.rememberMe);
        } else {
          // 如果没有勾选，则清除 localStorage 中的用户名和密码
          localStorage.removeItem("username");
          localStorage.removeItem("password");
          localStorage.removeItem("rememberMe");
        }
  
  
        let requestData = {
          password: md5(this.ruleForm.password).toUpperCase(),
          username: this.ruleForm.username,
        }
        const fullUrl = this.getLoginFullUrl()
        this.$alert(fullUrl, '登录接口地址', {
          confirmButtonText: '确定',
          callback: () => {
            this.$store.dispatch('login', requestData).then(response => {
              console.log("登录成功！用户名:", this.ruleForm.username);
              this.$router.push('/dashboard')
              this.$store.dispatch('getLatestEvent');
            }).catch(error => {
              console.log(error)
            });
          }
        })
      },
      //通过methods来定义需要的方法
      handleDisabled: function () {
        this.isChecked = !this.isChecked;
        if (this.isChecked == true) {
          this.isDisabled = true;
        } else {
          this.isDisabled = false;
        }
      },
      /**
       * 跳转到服务器配置页面
       */
      goToConfig() {
        this.$router.push('/server-config')
      },
      /**
       * 显示用户协议弹窗
       */
      showAgreementDialog() {
        // 保存打开弹窗前的勾选状态
        this.checkedBeforeDialog = this.ruleForm.checked
        this.agreementDialogVisible = true
      },
      /**
       * 关闭用户协议弹窗（不勾选，恢复原状态）
       */
      closeAgreementDialog() {
        // 恢复打开弹窗前的勾选状态
        this.ruleForm.checked = this.checkedBeforeDialog
        this.agreementDialogVisible = false
      },
      /**
       * 同意协议并关闭弹窗（勾选）
       */
      agreeAndClose() {
        this.ruleForm.checked = true
        this.agreementDialogVisible = false
        this.$message.success('已同意用户协议')
      }
  
    }
  }
  </script>
  <style lang="less" scoped>
  .login {
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
  
  .login-container {
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
  
  .login-container .title {
    margin-top: 32px;
    margin-bottom: 24px;
    font-size: 26px;
    font-weight: bold;
    color: #d1cccc;
  }
  ::v-deep .el-checkbox{
    color: #909090;
  }
  
  .login-container .login-form {
    width: 60%;
    margin: 0 auto;
    padding-bottom: 10px;
  }
  
  .right {
    text-align: center;
    font-size: 14px;
    float: right;
    color: #409eff;
    width: 80px;
    /* margin-bottom: 20px;*/
  }
  ::v-deep .el-input__inner{
    background-color: transparent;
    border: solid 1px #575d6e;
    color: #909090;
}
::v-deep .el-input__inner::placeholder{
    color: #575d6e;
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

/* 用户协议弹窗样式 */
::v-deep .agreement-dialog .el-dialog {
  background-color: #252a39;
}

::v-deep .agreement-dialog .el-dialog__header {
  background-color: #252a39;
  border-bottom: 1px solid #575d6e;
}

::v-deep .agreement-dialog .el-dialog__title {
  color: #d1cccc;
  font-size: 18px;
  font-weight: bold;
}

::v-deep .agreement-dialog .el-dialog__body {
  background-color: #252a39;
  max-height: 60vh;
  overflow-y: auto;
}

::v-deep .agreement-dialog .el-dialog__footer {
  background-color: #252a39;
  border-top: 1px solid #575d6e;
}

.agreement-content {
  color: #d1cccc;
}

.agreement-header {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #d1cccc;
}

.agreement-text {
  line-height: 1.8;
  color: #d1cccc;
}

.agreement-text strong {
  color: #409eff;
  font-weight: bold;
}

.agreement-text p {
  margin: 0;
  text-align: justify;
}

/* 弹窗滚动条样式 */
::v-deep .agreement-dialog .el-dialog__body::-webkit-scrollbar {
  width: 6px;
}

::v-deep .agreement-dialog .el-dialog__body::-webkit-scrollbar-track {
  background: #575d6e;
  border-radius: 3px;
}

::v-deep .agreement-dialog .el-dialog__body::-webkit-scrollbar-thumb {
  background: #409eff;
  border-radius: 3px;
}

::v-deep .agreement-dialog .el-dialog__body::-webkit-scrollbar-thumb:hover {
  background: #66b1ff;
}
  </style>
  <!--
  密码加密：
  1、在前端预先加密一次
  登录的密码：123456（普通字符串）
  经过加密后：sha1('123456') == '541216ad5s4f5ds1f5asd4f65asd4' （加密后的字符串）
  
  
  2、后台加密
  接收到字符串：'541216ad5s4f5ds1f5asd4f65asd4'
  后台再次加密：md5('541216ad5s4f5ds1f5asd4f65asd4') == '8f9qwersd3g165y4d1sf3s1f6aew4'（最终的加密后的密码）
  最终新的字符串写入数据库：8f9qwersd3g165y4d1sf3s1f6aew4
  
  
  3、登录
  用户名与加密后的密码进行匹配，成功则登录，失败则提示
  -->
  
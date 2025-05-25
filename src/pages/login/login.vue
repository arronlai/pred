<template>
  <view class="container">
    <view class="header">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="title">AI健身教练</text>
      <text class="subtitle">您的专属智能健身助手</text>
    </view>
    
    <view class="login-form">
      <button class="login-btn" @click="handleLogin">
        <image class="wechat-icon" src="/static/images/wechat.png" mode="aspectFit"></image>
        <text>微信一键登录</text>
      </button>
      
      <view class="agreement">
        <checkbox-group @change="handleAgreementChange">
          <label class="agreement-item">
            <checkbox :checked="isAgreed" color="#4CAF50" />
            <text class="agreement-text">我已阅读并同意</text>
          </label>
        </checkbox-group>
        <view class="agreement-links">
          <text class="link" @click="showUserAgreement">《用户协议》</text>
          <text class="link" @click="showPrivacyPolicy">《隐私政策》</text>
        </view>
      </view>
    </view>
    
    <!-- 用户协议弹窗 -->
    <uni-popup ref="userAgreementPopup" type="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">用户协议</text>
          <text class="close-btn" @click="closePopup">×</text>
        </view>
        <scroll-view class="popup-body" scroll-y>
          <text class="agreement-content">
            欢迎使用AI健身教练服务。本协议是您与AI健身教练之间关于使用本服务的协议。
            
            1. 服务内容
            AI健身教练为您提供个性化的健身计划制定、营养建议和训练指导服务。
            
            2. 用户责任
            - 提供真实、准确的个人信息
            - 遵守训练计划，注意安全
            - 如有身体不适，及时就医
            
            3. 隐私保护
            我们重视您的隐私，承诺保护您的个人信息安全。
            
            4. 免责声明
            本服务提供的建议仅供参考，不构成医疗建议。
          </text>
        </scroll-view>
      </view>
    </uni-popup>
    
    <!-- 隐私政策弹窗 -->
    <uni-popup ref="privacyPolicyPopup" type="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">隐私政策</text>
          <text class="close-btn" @click="closePopup">×</text>
        </view>
        <scroll-view class="popup-body" scroll-y>
          <text class="agreement-content">
            隐私政策
            
            1. 信息收集
            - 基本信息：身高、体重、年龄等
            - 健身数据：训练记录、目标等
            - 设备信息：设备型号、系统版本等
            
            2. 信息使用
            - 提供个性化服务
            - 改进服务质量
            - 发送服务通知
            
            3. 信息保护
            - 数据加密存储
            - 访问权限控制
            - 定期安全审计
          </text>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isAgreed: false
    }
  },
  methods: {
    handleAgreementChange(e) {
      this.isAgreed = e.detail.value.length > 0;
    },
    
    async handleLogin() {
      if (!this.isAgreed) {
        uni.showToast({
          title: '请先同意用户协议和隐私政策',
          icon: 'none'
        });
        return;
      }
      
      try {
        // 获取微信登录凭证
        const { code } = await uni.login();
        
        // 调用云函数进行登录
        const result = await uniCloud.callFunction({
          name: 'login',
          data: { code }
        });
        
        if (result.result.code === 0) {
          // 保存用户信息
          uni.setStorageSync('userId', result.result.data.openid);
          uni.setStorageSync('userInfo', result.result.data.userInfo);
          
          // 跳转到首页
          uni.reLaunch({
            url: '/pages/index/index'
          });
        } else {
          throw new Error(result.result.message);
        }
      } catch (error) {
        console.error('登录失败：', error);
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    },
    
    showUserAgreement() {
      this.$refs.userAgreementPopup.open();
    },
    
    showPrivacyPolicy() {
      this.$refs.privacyPolicyPopup.open();
    },
    
    closePopup() {
      this.$refs.userAgreementPopup.close();
      this.$refs.privacyPolicyPopup.close();
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
  
  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 24rpx;
  }
  
  .title {
    font-size: 48rpx;
    color: #ffffff;
    font-weight: bold;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .subtitle {
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.9);
    display: block;
  }
}

.login-form {
  width: 100%;
  
  .login-btn {
    width: 100%;
    height: 96rpx;
    background-color: #ffffff;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    
    .wechat-icon {
      width: 48rpx;
      height: 48rpx;
    }
    
    text {
      font-size: 32rpx;
      color: #333333;
    }
  }
}

.agreement {
  text-align: center;
  
  .agreement-item {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16rpx;
    
    .agreement-text {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-left: 8rpx;
    }
  }
  
  .agreement-links {
    .link {
      font-size: 26rpx;
      color: #ffffff;
      text-decoration: underline;
      margin: 0 8rpx;
    }
  }
}

.popup-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  
  .popup-header {
    padding: 32rpx;
    border-bottom: 2rpx solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .popup-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .close-btn {
      font-size: 48rpx;
      color: #999999;
      padding: 0 16rpx;
    }
  }
  
  .popup-body {
    height: 800rpx;
    padding: 32rpx;
    
    .agreement-content {
      font-size: 28rpx;
      color: #666666;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
}
</style>

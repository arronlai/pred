<template>
  <view class="container">
    <view class="header">
      <text class="title">FP电子教练</text>
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
            <checkbox :checked="isAgreed" color="#4CAF50" style="transform: scale(0.8);" />
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
          <view class="agreement-section">
            <text class="section-title">欢迎使用AI健身教练服务</text>
            <text class="section-content">本协议是您与AI健身教练之间关于使用本服务的协议。</text>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">1. 服务内容</text>
            <text class="section-content">AI健身教练为您提供个性化的健身计划制定、营养建议和训练指导服务。我们致力于通过AI技术为您提供专业的健身指导，帮助您实现健身目标。</text>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">2. 用户责任</text>
            <view class="section-list">
              <text class="list-item">• 提供真实、准确的个人信息，包括但不限于身高、体重、年龄等基础数据</text>
              <text class="list-item">• 如实告知身体状况、运动经验和可能的健康风险</text>
              <text class="list-item">• 遵守训练计划，注意安全，循序渐进</text>
              <text class="list-item">• 如有身体不适，立即停止训练并咨询医生</text>
              <text class="list-item">• 定期更新个人信息，确保建议的准确性</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">3. 隐私保护</text>
            <text class="section-subtitle">我们重视您的隐私，承诺保护您的个人信息安全：</text>
            <view class="section-list">
              <text class="list-item">• 严格保护您的个人数据，未经授权不会向第三方披露</text>
              <text class="list-item">• 采用加密技术保护数据传输和存储</text>
              <text class="list-item">• 定期进行安全审计和更新</text>
              <text class="list-item">• 您有权随时查看、更正或删除个人信息</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">4. 免责声明</text>
            <view class="section-list">
              <text class="list-item">• 本服务提供的建议仅供参考，不构成医疗建议</text>
              <text class="list-item">• 在开始任何健身计划前，建议咨询医生</text>
              <text class="list-item">• 我们不对因使用本服务导致的任何伤害负责</text>
              <text class="list-item">• 用户应自行承担训练风险</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">5. 服务变更</text>
            <view class="section-list">
              <text class="list-item">• 我们保留随时修改或终止服务的权利</text>
              <text class="list-item">• 重要变更将提前通知用户</text>
              <text class="list-item">• 继续使用服务即表示接受变更</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">6. 知识产权</text>
            <view class="section-list">
              <text class="list-item">• 本服务的所有内容均受知识产权法保护</text>
              <text class="list-item">• 未经授权，不得复制、传播或用于商业用途</text>
            </view>
          </view>
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
          <view class="agreement-section">
            <text class="section-title">隐私政策</text>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">1. 信息收集</text>
            <text class="section-subtitle">我们收集的信息包括但不限于：</text>
            <view class="section-list">
              <text class="list-item">• 基本信息：身高、体重、年龄、性别等</text>
              <text class="list-item">• 健身数据：训练记录、目标、进度等</text>
              <text class="list-item">• 设备信息：设备型号、系统版本、网络状态等</text>
              <text class="list-item">• 使用数据：使用时长、功能偏好等</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">2. 信息使用</text>
            <text class="section-subtitle">我们使用收集的信息用于：</text>
            <view class="section-list">
              <text class="list-item">• 提供个性化健身计划和营养建议</text>
              <text class="list-item">• 改进服务质量和用户体验</text>
              <text class="list-item">• 发送服务通知和更新提醒</text>
              <text class="list-item">• 进行数据分析和研究</text>
              <text class="list-item">• 预防和处理安全问题</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">3. 信息保护</text>
            <text class="section-subtitle">我们采取以下措施保护您的信息：</text>
            <view class="section-list">
              <text class="list-item">• 数据加密存储和传输</text>
              <text class="list-item">• 严格的访问权限控制</text>
              <text class="list-item">• 定期安全审计和更新</text>
              <text class="list-item">• 员工保密培训</text>
              <text class="list-item">• 安全事件响应机制</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">4. 信息共享</text>
            <text class="section-subtitle">我们不会出售您的个人信息。仅在以下情况下可能共享信息：</text>
            <view class="section-list">
              <text class="list-item">• 获得您的明确同意</text>
              <text class="list-item">• 遵守法律法规要求</text>
              <text class="list-item">• 保护我们的合法权益</text>
              <text class="list-item">• 与授权服务提供商合作</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">5. 您的权利</text>
            <text class="section-subtitle">您对个人信息拥有以下权利：</text>
            <view class="section-list">
              <text class="list-item">• 访问和查看</text>
              <text class="list-item">• 更正和更新</text>
              <text class="list-item">• 删除</text>
              <text class="list-item">• 撤回同意</text>
              <text class="list-item">• 投诉和举报</text>
            </view>
          </view>
          
          <view class="agreement-section">
            <text class="section-title">6. 政策更新</text>
            <view class="section-list">
              <text class="list-item">• 我们可能不时更新本隐私政策</text>
              <text class="list-item">• 更新后将通过适当方式通知您</text>
              <text class="list-item">• 继续使用服务即表示接受更新</text>
            </view>
          </view>
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
          uni.setStorageSync('userId', result.result.data.userInfo.openid);
          uni.setStorageSync('userInfo', result.result.data.userInfo);
          uni.setStorageSync('token', result.result.data.token);
          
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
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 32rpx;
  }
  
  .title {
    font-size: 52rpx;
    color: #ffffff;
    font-weight: bold;
    margin-bottom: 20rpx;
    display: block;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  }
  
  .subtitle {
    font-size: 34rpx;
    color: rgba(255, 255, 255, 0.95);
    display: block;
  }
}

.login-form {
  width: 100%;
  
  .login-btn {
    width: 100%;
    height: 100rpx;
    background-color: #ffffff;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin-bottom: 48rpx;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    
    &:active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
    }
    
    .wechat-icon {
      width: 52rpx;
      height: 52rpx;
    }
    
    text {
      font-size: 34rpx;
      color: #333333;
      font-weight: 500;
    }
  }
}

.agreement {
  text-align: center;
  
  .agreement-item {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
    
    .agreement-text {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.95);
      margin-left: 8rpx;
    }
  }
  
  .agreement-links {
    .link {
      font-size: 28rpx;
      color: #ffffff;
      text-decoration: underline;
      margin: 0 12rpx;
      padding: 8rpx 0;
    }
  }
}

.agreement-section {
  margin-bottom: 40rpx;
  
  .section-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .section-subtitle {
    font-size: 30rpx;
    color: #666666;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .section-content {
    font-size: 30rpx;
    color: #666666;
    line-height: 1.6;
    display: block;
  }
  
  .section-list {
    .list-item {
      font-size: 30rpx;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 12rpx;
      display: block;
      padding-left: 24rpx;
    }
  }
}

.popup-content {
  width: 680rpx;
  background-color: #ffffff;
  border-radius: 32rpx;
  overflow: hidden;
  
  .popup-header {
    padding: 36rpx;
    border-bottom: 2rpx solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f8f8;
    
    .popup-title {
      font-size: 40rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .close-btn {
      font-size: 52rpx;
      color: #999999;
      padding: 0 20rpx;
      line-height: 1;
    }
  }
  
  .popup-body {
    height: 900rpx;
    padding: 36rpx;
    background-color: #ffffff;
  }
}
</style>

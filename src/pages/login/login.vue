<template>
  <view class="container">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0; --top: 30%; --left: 80%; --size: 1; --brightness: 1"></view>
    <view class="shooting-star" style="--delay: 2.5; --top: 15%; --left: 70%; --size: 0.7; --brightness: 0.9"></view>
    <view class="shooting-star" style="--delay: 5.7; --top: 45%; --left: 90%; --size: 1.2; --brightness: 0.8"></view>
    <view class="shooting-star" style="--delay: 8.3; --top: 10%; --left: 60%; --size: 0.8; --brightness: 1.1"></view>
    <view class="shooting-star" style="--delay: 12.1; --top: 60%; --left: 75%; --size: 1.3; --brightness: 0.7"></view>
    
    <view class="login-card">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="title">问问AI</view>
      <view class="subtitle"></view>

      <!-- 使用新的授权方式 -->
      <button class="login-btn" @click="handleGetUserProfile">
        微信一键登录
      </button>

      <!-- 或使用头像昵称填写组件 -->
      <view class="profile-area" v-if="showProfileInput">
        <button
          class="avatar-btn"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            class="avatar-preview"
            :src="avatarUrl"
            mode="aspectFill"
          ></image>
          <text class="avatar-text">点击选择头像</text>
        </button>

        <view class="nickname-input">
          <text class="input-label">昵称</text>
          <input
            type="nickname"
            v-model="nickName"
            placeholder="请输入昵称"
            @blur="onNicknameChange"
          />
        </view>

        <button class="confirm-btn" @click="confirmUserInfo">确认</button>
      </view>

      <!-- 添加协议声明文字 -->
      <view class="agreement-text">
        登录即代表您同意
        <text class="link" @click="showAgreement">《服务协议》</text>
        和
        <text class="link" @click="showPrivacy">《免责声明》</text>
      </view>
    </view>
    
    <!-- 协议弹窗 -->
    <view class="popup" v-if="showPopup">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">{{ popupTitle }}</text>
          <text class="popup-close" @click="closePopup">×</text>
        </view>
        <scroll-view class="popup-body" scroll-y="true">
          <view v-if="popupType === 'agreement'" class="content-wrapper">
            <!-- <view class="popup-subtitle">用户服务协议</view> -->
            <view class="popup-text">
              <view class="popup-item">1. 服务介绍：本服务是一款基于人工智能的数字预测工具，旨在提供娱乐和参考用途。</view>
              <view class="popup-item">2. 账号注册：用户需使用微信登录授权，我们可能获取您的头像和昵称信息用于服务提供。</view>
              <view class="popup-item">3. 使用规则：每位用户每日有基础使用次数限制，通过分享可获得额外使用次数。</view>
              <view class="popup-item">4. 信息保护：我们会对用户提供的信息进行保密，不会将您的个人信息用于服务之外的用途。</view>
              <view class="popup-item">5. 内容所有权：本应用内容的所有权归开发者所有，用户不得进行商业用途的复制或传播。</view>
              <view class="popup-item">6. 用户内容：用户提交的信息不得包含违法、侵权等内容，否则我们有权删除并追究相关责任。</view>
              <view class="popup-item">7. 服务变更：我们有权随时修改或中断服务，修改后的协议在公布后立即生效。</view>
            </view>
          </view>
          <view v-else-if="popupType === 'privacy'" class="content-wrapper">
            <!-- <view class="popup-subtitle">免责声明</view> -->
            <view class="popup-text">
              <view class="popup-item">1. 预测结果仅供娱乐参考：本应用生成的所有预测内容仅供娱乐和参考，不构成任何建议或决策依据。</view>
              <view class="popup-item">2. 不承担决策责任：用户基于本应用内容做出的任何决策所产生的后果，由用户自行承担。</view>
              <view class="popup-item">3. 服务中断免责：因不可抗力、设备故障、网络问题等原因导致服务中断，我们不承担责任。</view>
              <view class="popup-item">4. 内容准确性：我们不对AI生成内容的准确性、适用性或完整性作出任何明示或暗示的保证。</view>
              <view class="popup-item">5. 第三方链接：本应用可能包含第三方链接，对于第三方的内容、隐私政策及行为不承担任何责任。</view>
              <view class="popup-item">6. 用户投诉处理：我们会尽力处理用户反馈的问题，但不保证能满足所有用户的要求。</view>
            </view>
          </view>
        </scroll-view>
        <view class="popup-footer">
          <button class="popup-btn" @click="closePopup">我已阅读并同意</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 重定向地址
const redirect = ref('');
// 用户信息
const avatarUrl = ref('/static/default-avatar.png');
const nickName = ref('');
// 是否显示头像昵称输入区域
const showProfileInput = ref(false);

// 弹窗状态
const showPopup = ref(false);
const popupType = ref('');
const popupTitle = ref('');

// 页面加载获取重定向地址
onLoad((options) => {
  if (options.redirect) {
    redirect.value = decodeURIComponent(options.redirect);
  }
});

// 获取用户信息 - 新API
const handleGetUserProfile = () => {
  // 旧版API，不推荐使用
  if (uni.getUserProfile) {
    uni.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        handleLogin(res.userInfo);
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        // 如果用户拒绝，切换到填写方式
        showProfileInput.value = true;
      },
    });
  } else {
    // 如果不支持getUserProfile，使用登录+输入方式
    showProfileInput.value = true;
    // 直接登录，稍后再补充用户资料
    getLoginCode();
  }
};

// 头像选择回调
const onChooseAvatar = (e) => {
  avatarUrl.value = e.detail.avatarUrl;
};

// 昵称输入回调
const onNicknameChange = (e) => {
  nickName.value = e.detail.value;
};

// 确认用户信息
const confirmUserInfo = () => {
  if (!nickName.value) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none',
    });
    return;
  }

  // 使用用户填写的信息登录
  handleLogin({
    avatarUrl: avatarUrl.value,
    nickName: nickName.value,
    gender: 0,
  });
};

// 获取登录code
const getLoginCode = () => {
  return new Promise((resolve, reject) => {
    uni.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
        } else {
          reject(new Error('获取code失败'));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

// 处理登录
const handleLogin = async (userInfo) => {
  uni.showLoading({
    title: '登录中...',
  });

  try {
    // 获取code
    const code = await getLoginCode();

    // 调用云函数登录
    const result = await uniCloud.callFunction({
      name: 'login',
      data: {
        code,
        userInfo,
      },
    });

    if (result.result.code === 0) {
      // 登录成功，保存用户信息
      uni.setStorageSync('userInfo', result.result.data.userInfo);
      uni.setStorageSync('token', result.result.data.token);

      uni.hideLoading();
      uni.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 登录成功后跳转
      setTimeout(() => {
        if (redirect.value) {
          // 跳转到重定向地址
          uni.redirectTo({
            url: redirect.value,
            fail: () => {
              // 如果跳转失败，返回上一页或首页
              uni.navigateBack({
                fail: () => {
                  uni.switchTab({
                    url: '/pages/index/index',
                  });
                },
              });
            },
          });
        } else {
          // 没有重定向地址则返回上一页或首页
          uni.navigateBack({
            fail: () => {
              uni.switchTab({
                url: '/pages/index/index',
              });
            },
          });
        }
      }, 1500);
    } else {
      throw new Error(result.result.message);
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
    });
  }
};

// 显示服务协议
const showAgreement = () => {
  popupType.value = 'agreement';
  popupTitle.value = '服务协议';
  showPopup.value = true;
};

// 显示隐私政策
const showPrivacy = () => {
  popupType.value = 'privacy';
  popupTitle.value = '免责声明';
  showPopup.value = true;
};

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false;
};
</script>

<style>
.container {
  height: 100vh;
  overflow: hidden;
box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.login-card {
  width: 80%;
  max-width: 800rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 40rpx;
  padding: 80rpx 60rpx;
  text-align: center;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40rpx;
}

.login-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  border: none;
  color: white;
  padding: 12rpx 0;
  width: 90%;
  font-size: 34rpx;
  border-radius: 40rpx;
  margin: 40rpx auto;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-area {
  margin-top: 40rpx;
  width: 90%;
  margin: 40rpx auto 0;
}

.avatar-btn {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.avatar-preview {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 10rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.avatar-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.nickname-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 30rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: left;
}

.input-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10rpx;
}

.nickname-input input {
  width: 100%;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  color: white;
}

.confirm-btn {
  background: linear-gradient(45deg, #00a3ff, #00ff88);
  border: none;
  color: white;
  padding: 24rpx 0;
  width: 100%;
  font-size: 34rpx;
  border-radius: 40rpx;
  margin-top: 20rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.2);
}

.agreement-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 40rpx;
  line-height: 1.5;
}

.link {
  color: #56ccf2;
  text-decoration: underline;
}

/* 流星效果 */
.stars {
  width: 4rpx;
  height: 4rpx;
  background: transparent;
  box-shadow: 
    3608rpx 2530rpx #FFF, 730rpx 664rpx #FFF, 172rpx 3776rpx #FFF, 3776rpx 968rpx #FFF,
    398rpx 2978rpx #FFF, 2918rpx 2020rpx #FFF, 1614rpx 776rpx #FFF, 1710rpx 1116rpx #FFF;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
}

.stars:after {
  content: " ";
  position: absolute;
  top: 4000rpx; 
  width: 4rpx;
  height: 4rpx;
  background: transparent;
  box-shadow: 
    3608rpx 2530rpx #FFF, 730rpx 664rpx #FFF, 172rpx 3776rpx #FFF, 3776rpx 968rpx #FFF,
    398rpx 2978rpx #FFF, 2918rpx 2020rpx #FFF, 1614rpx 776rpx #FFF, 1710rpx 1116rpx #FFF;
}

.stars2 {
  width: 6rpx;
  height: 6rpx;
  background: transparent;
  box-shadow: 
    3628rpx 2550rpx #FFF, 750rpx 684rpx #FFF, 192rpx 3796rpx #FFF, 3796rpx 988rpx #FFF;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
}

.stars2:after {
  content: " ";
  position: absolute;
  top: 4000rpx;
  width: 6rpx;
  height: 6rpx;
  background: transparent;
  box-shadow: 
    3628rpx 2550rpx #FFF, 750rpx 684rpx #FFF, 192rpx 3796rpx #FFF, 3796rpx 988rpx #FFF;
}

.stars3 {
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow: 
    3648rpx 2570rpx #FFF, 770rpx 704rpx #FFF, 212rpx 3816rpx #FFF, 3816rpx 1008rpx #FFF;
  animation: animStar 150s linear infinite;
  opacity: 1;
}

.stars3:after {
  content: " ";
  position: absolute;
  top: 4000rpx;
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow: 
    3648rpx 2570rpx #FFF, 770rpx 704rpx #FFF, 212rpx 3816rpx #FFF, 3816rpx 1008rpx #FFF;
}

@keyframes animStar {
  from {
    transform: translateY(0rpx);
  }
  to {
    transform: translateY(-4000rpx);
  }
}

.shooting-star {
  position: absolute;
  top: var(--top, 50%);
  left: var(--left, 80%);
  width: calc(200rpx * var(--size, 1));
  height: calc(4rpx * var(--size, 1));
  background: linear-gradient(90deg, rgba(255, 255, 255, var(--brightness, 1)), transparent);
  animation: shootingStar 8s infinite;
  animation-delay: calc(var(--delay) * 1s);
  opacity: 0;
  z-index: 2;
  filter: blur(calc(2rpx * var(--size, 1)));
}

@keyframes shootingStar {
  0% {
    transform: translate(0, 0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  2% {
    transform: translate(-40rpx, 40rpx) rotate(-45deg) scale(var(--size, 1));
    opacity: var(--brightness, 1);
  }
  8% {
    transform: translate(-400rpx, 400rpx) rotate(-45deg) scale(var(--size, 1));
    opacity: 0;
  }
  100% {
    transform: translate(-400rpx, 400rpx) rotate(-45deg) scale(var(--size, 1));
    opacity: 0;
  }
}

/* 弹窗样式 */
.popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.popup-content {
  width: 80%;
  max-width: 600rpx;
  background: rgba(27, 38, 54, 0.95);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.popup-header {
  padding: 30rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.popup-close {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
}

.popup-body {
  max-height: 60vh;
  box-sizing: border-box;
}
.popup-body  .content-wrapper {
  padding: 30rpx;
}

.popup-subtitle {
  font-size: 32rpx;
  font-weight: bold;
  color: #56ccf2;
  margin-bottom: 20rpx;
}

.popup-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
  line-height: 1.6;
}

.popup-item {
  margin-bottom: 20rpx;
}

.popup-footer {
  padding: 30rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.popup-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 30rpx;
  padding: 20rpx 0;
  width: 100%;
}
</style>

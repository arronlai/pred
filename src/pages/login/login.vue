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

const showAgreement = () => {
  uni.navigateTo({
    url: '/pages/agreement/agreement?type=user',
  });
};

const showPrivacy = () => {
  uni.navigateTo({
    url: '/pages/agreement/agreement?type=privacy',
  });
};
</script>

<style>
.container {
  height: 100vh;
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
  padding: 24rpx 0;
  width: 90%;
  font-size: 34rpx;
  border-radius: 40rpx;
  margin: 40rpx auto;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.2);
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
</style>

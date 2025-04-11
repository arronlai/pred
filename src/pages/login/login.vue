<template>
  <view class="container">
    <view class="login-card">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="title">答案之数</view>
      <view class="subtitle">探索数字的奥秘</view>

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
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.login-card {
  width: 80%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  color: #fff;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.login-btn {
  width: 100%;
  height: 44px;
  background-color: #07c160;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 20px;
}

.profile-area {
  margin: 20px 0;
}

.avatar-btn {
  background: none;
  padding: 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-btn::after {
  border: none;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 8px;
}

.avatar-text {
  font-size: 14px;
  color: #fff;
}

.nickname-input {
  margin-bottom: 20px;
  text-align: left;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #fff;
  margin-bottom: 8px;
}

.nickname-input input {
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 8px;
  padding: 0 12px;
  width: 100%;
  box-sizing: border-box;
}

.confirm-btn {
  width: 100%;
  height: 44px;
  background-color: #00a3ff;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.agreement {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.link {
  color: #00a3ff;
}
</style>

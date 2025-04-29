<template>
  <view class="content">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view
      class="shooting-star"
      style="--delay: 0; --top: 30%; --left: 80%; --size: 1; --brightness: 1"
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 2.5;
        --top: 15%;
        --left: 70%;
        --size: 0.7;
        --brightness: 0.9;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 5.7;
        --top: 45%;
        --left: 90%;
        --size: 1.2;
        --brightness: 0.8;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 8.3;
        --top: 10%;
        --left: 60%;
        --size: 0.8;
        --brightness: 1.1;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 12.1;
        --top: 60%;
        --left: 75%;
        --size: 1.3;
        --brightness: 0.7;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 15.5;
        --top: 25%;
        --left: 85%;
        --size: 0.6;
        --brightness: 1.2;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 19.2;
        --top: 55%;
        --left: 65%;
        --size: 1.1;
        --brightness: 0.9;
      "
    ></view>

    <view class="header">
      <text class="title">问问AI</text>
      <text class="subtitle">✨ 抛出硬币的时候，希望你找到答案 ✨</text>
    </view>

    <view class="input-section">
      <view class="instruction-text">
        <icon
          type="info"
          class="info-icon"
          color="rgb(250 173 20)"
          size="20"
          font-size="20rpx"
        />
        <text>想着您的问题，填入三个数字</text>
      </view>
      <view class="input-group">
        <view class="input-row">
          <view class="input-wrapper">
            <text class="input-label">数字 ①</text>
            <input
              type="number"
              v-model="numbers[0]"
              class="number-input"
              placeholder="1-100"
              maxlength="3"
              @input="focusNextInput(0)"
              ref="inputOne"
            />
          </view>

          <view class="input-wrapper">
            <text class="input-label">数字 ②</text>
            <input
              type="number"
              v-model="numbers[1]"
              class="number-input"
              placeholder="1-100"
              maxlength="3"
              @input="focusNextInput(1)"
              ref="inputTwo"
            />
          </view>

          <view class="input-wrapper">
            <text class="input-label">数字 ③</text>
            <input
              type="number"
              v-model="numbers[2]"
              class="number-input"
              placeholder="1-100"
              maxlength="3"
              @input="focusNextInput(2)"
              ref="inputThree"
            />
          </view>
        </view>
      </view>

      <button
        @click="handleStartPrediction"
        class="predict-btn"
        :disabled="isLoading || (usageInfo && usageInfo.remaining <= 0)"
        :class="{ 'predict-btn-loading': isLoading }"
      >
        <text class="predict-btn-text">{{
          isLoading ? '正在推算...' : '开始预测'
        }}</text>
        <view class="btn-glow"></view>
      </button>
    </view>

    <view class="usage-info" v-if="usageInfo">
      <template
        v-if="usageInfo.used_count >= usageInfo.base_limit && !usageInfo.shared"
      >
        <text class="usage-text"
          >今日已用 {{ usageInfo.used_count }}/{{
            usageInfo.base_limit
          }}
          次</text
        >
        <button class="share-btn" open-type="share">
          <text class="share-text">分享获取更多次数</text>
        </button>
      </template>

      <template v-else-if="usageInfo.shared">
        <text class="usage-text"
          >今日已用 {{ usageInfo.used_count }}/{{
            usageInfo.total_limit
          }}
          次</text
        >
      </template>

      <template v-else>
        <text class="usage-text"
          >今日已用 {{ usageInfo.used_count }}/{{
            usageInfo.base_limit
          }}
          次</text
        >
      </template>
    </view>

    <view class="history-link" @click="goToHistory">
      <text class="history-text">查看历史记录</text>
    </view>

    <view v-if="prediction" class="prediction-section">
      <view class="prediction-title">
        <text class="prediction-icon">🌟</text>
        <text>预测结果</text>
      </view>
      <view class="prediction-content">{{ prediction }}</view>
    </view>

    <feedback-btn></feedback-btn>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { checkLogin } from '@/utils/auth.js';
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app';

const numbers = ref(['', '', '']);
const prediction = ref('');
const isLoading = ref(false);
const usageInfo = ref(null);
const isSharing = ref(false);

const inputOne = ref(null);
const inputTwo = ref(null);
const inputThree = ref(null);

const focusNextInput = (index) => {
  if (
    numbers.value[index] &&
    Number(numbers.value[index]) >= 1 &&
    Number(numbers.value[index]) <= 100
  ) {
    if (index === 0) {
      setTimeout(() => {
        inputTwo.value.focus();
      }, 100);
    } else if (index === 1) {
      setTimeout(() => {
        inputThree.value.focus();
      }, 100);
    }
  }
};

onShareAppMessage(() => {
  isSharing.value = true;

  return {
    title: '问问AI',
    path: '/pages/index/index',
    imageUrl: '/static/logo.png',
    success: function () {
      console.log('分享成功回调触发，记录分享行为');
      recordShareAction();
      isSharing.value = false;
    },
  };
});

const recordShareAction = async () => {
  try {
    console.log('开始记录分享行为');

    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.token) {
      console.error('记录分享失败: 用户未登录');
      return;
    }

    console.log('调用云函数记录分享...');
    const result = await uniCloud.callFunction({
      name: 'recordShare',
      data: {
        token: userInfo.token,
        shareType: 'wechat',
        shareContent: 'app',
      },
    });

    console.log('分享云函数返回结果:', JSON.stringify(result.result));

    if (result.result && result.result.code === 0) {
      if (!result.result.data.already_shared) {
        uni.showToast({
          title: '分享成功，获得额外使用次数',
          icon: 'none',
        });
      } else {
        console.log('用户今日已分享过');
      }

      if (result.result.data.usage) {
        usageInfo.value = result.result.data.usage;
      } else {
        checkUsageInfo();
      }
    } else {
      console.error('云函数调用成功但返回错误:', result.result);
      checkUsageInfo();
    }
  } catch (error) {
    console.error('记录分享失败具体错误:', error);
    checkUsageInfo();
  }
};

const checkUsageInfo = async () => {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.token) return;

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    ).getTime();

    const predictionResult = await uniCloud.callFunction({
      name: 'getPredictionHistory',
      data: {
        token: userInfo.token,
        timeRange: {
          start: startOfDay,
          end: endOfDay,
        },
      },
    });

    if (predictionResult.result && predictionResult.result.code === 0) {
      const usedCount = predictionResult.result.data.total || 0;

      const shareResult = await uniCloud.callFunction({
        name: 'recordShare',
        data: {
          token: userInfo.token,
          checkOnly: true,
        },
      });

      console.log('分享状态检查结果:', JSON.stringify(shareResult.result));

      const baseLimit = 1;
      const hasShared =
        shareResult.result &&
        shareResult.result.code === 0 &&
        shareResult.result.data &&
        shareResult.result.data.already_shared === true;

      console.log('判断分享状态:', {
        resultCode: shareResult.result?.code,
        dataExists: !!shareResult.result?.data,
        alreadyShared: shareResult.result?.data?.already_shared,
        finalHasShared: hasShared,
      });

      const totalLimit = hasShared ? 2 : 1;

      usageInfo.value = {
        used_count: usedCount,
        base_limit: baseLimit,
        shared: hasShared,
        total_limit: totalLimit,
        remaining: Math.max(0, totalLimit - usedCount),
      };

      console.log('最终使用信息:', JSON.stringify(usageInfo.value));
    }
  } catch (error) {
    console.error('获取使用情况失败:', error);
  }
};

onLoad(() => {
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo) {
    uni.navigateTo({
      url:
        '/pages/login/login?redirect=' +
        encodeURIComponent('/pages/index/index'),
    });
  } else {
    checkUsageInfo();
  }
});

onShow(() => {
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo && userInfo.token) {
    console.log('页面显示，刷新使用情况');

    if (isSharing.value) {
      console.log('检测到从分享返回，记录分享行为');
      recordShareAction();
      isSharing.value = false;
    }

    checkUsageInfo();
  }
});

const testWithMockData = () => {
  const mockData = {
    code: 0,
    content:
      '### 预测结果\n当前时间2025年4月9日18:12，数字4、5、6的组合显示你正处于一个充满变化和机遇的时期。近期你可能会遇到一些挑战，但同时也将迎来新的成长机会。保持开放的心态，灵活应对变化，将有助于你顺利度过这一阶段。\n\n### 具体建议\n1. **灵活应对变化**：近期可能会有一些突发情况，保持灵活的心态，及时调整计划，将有助于你更好地应对挑战。\n2. **加强沟通**：在人际关系中，多与他人沟通，尤其是与家人和同事，避免误解和冲突。\n3. **抓住学习机会**：这是一个适合学习和提升自我的时期，可以考虑参加一些培训或课程，提升自己的技能。\n4. **注意健康**：在忙碌的同时，不要忽视身体健康，合理安排作息，保持良好的生活习惯。\n\n### 分析过程\n1. **结合当前年月日时，分析数字在不同时间段的能量变化**：\n   - 2025年4月9日18:12，属于乙巳年，辰月，己亥日，酉时。乙木生巳火，辰土生己土，亥水克酉金，整体能量较为平衡，但存在一定的冲突和变化。\n   - 数字4代表稳定和基础，5代表变化和自由，6代表和谐和平衡。在当前时间背景下，数字4的能量受到挑战，5和6的能量则较为活跃，预示着近期可能会有一些变化和调整。\n\n2. **运用易经的阴阳五行理论，解读数字的卦象含义**：\n   - 数字4对应震卦，象征雷，代表行动和变动。数字5对应巽卦，象征风，代表灵活和变化。数字6对应坎卦，象征水，代表智慧和流动。\n   - 震卦与巽卦结合，预示着近期可能会有一些突发的变化和挑战，需要灵活应对。坎卦的出现则提示你，在处理问题时需要运用智慧和策略，保持冷静和理性。\n\n3. **分析事情发展趋势、人际关系变化、事业发展方向、个人成长机遇**：\n   - **近期事情发展趋势**：整体趋势是变化和调整，可能会遇到一些突发情况，但同时也将迎来新的机遇。\n   - **人际关系或家庭变化**：在人际关系中，多与他人沟通，避免误解和冲突。家庭方面，可能会有一些小的变动，但整体和谐。\n   - **事业发展方向**：事业上可能会有一些新的机会，但也需要面对一些挑战。保持灵活的心态，及时调整计划，将有助于你抓住机遇。\n   - **个人成长机遇**：这是一个适合学习和提升自我的时期，可以考虑参加一些培训或课程，提升自己的技能。\n\n通过以上分析，可以看出当前时间背景下，数字4、5、6的组合预示着变化和机遇并存。保持开放的心态，灵活应对变化，将有助于你顺利度过这一阶段，并抓住新的成长机会。',
  };

  uni.navigateTo({
    url: `/pages/result/result?prediction=${encodeURIComponent(
      mockData.content
    )}`,
  });
};

const handleStartPrediction = async () => {
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || !userInfo.token) {
    uni.removeStorageSync('userInfo');
    uni.navigateTo({
      url:
        '/pages/login/login?redirect=' +
        encodeURIComponent('/pages/index/index'),
    });
    return;
  }

  if (usageInfo.value && usageInfo.value.remaining <= 0) {
    if (usageInfo.value.shared || usageInfo.value.used_count > 1) {
      uni.showModal({
        title: '提示',
        content: '您今日的使用次数已达上限，明天再来试试吧！',
        showCancel: false,
        confirmText: '知道了',
      });
    } else {
      uni.showModal({
        title: '提示',
        content: '您的基础次数已用完，分享小程序可获取更多使用次数！',
        confirmText: '去分享',
        success: (res) => {
          if (res.confirm) {
            uni.showShareMenu({
              withShareTicket: true,
              menus: ['shareAppMessage', 'shareTimeline'],
            });
          }
        },
      });
    }
    return;
  }

  if (!numbers.value[0] || !numbers.value[1] || !numbers.value[2]) {
    uni.showToast({
      title: '请在心里想着您的问题，输入3个数字（1-100之间）',
      icon: 'none',
    });
    return;
  }

  if (prediction.value) {
    uni.showModal({
      title: '提示',
      content: '您已经进行过预测，是否重新预测？',
      success: (res) => {
        if (res.confirm) {
          getPrediction();
        }
      },
    });
  } else {
    getPrediction();
  }
};

const getPrediction = async () => {
  if (!checkLogin()) return;

  if (
    numbers.value.some((num) => !num || Number(num) < 1 || Number(num) > 100)
  ) {
    uni.showToast({
      title: '请输入1-100之间的数字',
      icon: 'none',
    });
    return;
  }

  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || !userInfo.token) {
    uni.removeStorageSync('userInfo');
    uni.showToast({
      title: '用户信息不完整，请重新登录',
      icon: 'none',
    });
    uni.navigateTo({
      url:
        '/pages/login/login?redirect=' +
        encodeURIComponent('/pages/index/index'),
    });
    return;
  }

  isLoading.value = true;

  try {
    const result = await uniCloud.callFunction({
      name: 'generatePrediction',
      data: {
        number: numbers.value.join(','),
        token: userInfo.token,
      },
    });

    if (result.result) {
      if (result.result.code === 0) {
        const prediction = result.result.content;

        if (result.result.usage) {
          usageInfo.value = result.result.usage;
        }

        uni.navigateTo({
          url: `/pages/result/result?prediction=${encodeURIComponent(
            prediction
          )}`,
        });
      } else if (result.result.code === -2) {
        uni.showModal({
          title: '使用次数已达上限',
          content: result.result.message,
          confirmText: '去分享',
          success: (res) => {
            if (
              res.confirm &&
              result.result.data &&
              result.result.data.can_share
            ) {
              uni.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline'],
              });
            }
          },
        });

        if (result.result.data) {
          usageInfo.value = {
            used_count: result.result.data.used_count,
            daily_limit: result.result.data.daily_limit,
            remaining: result.result.data.remaining,
            can_share: result.result.data.can_share,
          };
        }
      } else {
        throw new Error(result.result.message || '生成预测失败');
      }
    } else {
      throw new Error('生成预测失败');
    }
  } catch (error) {
    uni.showToast({
      title: error.message || '生成预测失败，请重试',
      icon: 'none',
    });
    console.error('生成预测失败：', error);
  } finally {
    isLoading.value = false;
  }
};

const goToHistory = () => {
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || !userInfo.token) {
    uni.removeStorageSync('userInfo');
    uni.showToast({
      title: '用户信息不完整，请重新登录',
      icon: 'none',
    });
    uni.navigateTo({
      url:
        '/pages/login/login?redirect=' +
        encodeURIComponent('/pages/index/index'),
    });
    return;
  }

  uni.navigateTo({
    url: '/pages/history/history',
  });
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 40rpx 40rpx;
  padding-top: 90rpx;
  height: 100vh;
  box-sizing: border-box;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;
  overflow: hidden;
}

.usage-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20rpx 0 60rpx 0;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 40rpx;
  gap: 20rpx;
  width: auto;
  max-width: 600rpx;
  position: absolute;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
}

.usage-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.share-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  border: none;
  border-radius: 60rpx;
  font-size: 24rpx;
  color: white;
  padding: 8rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
  height: 56rpx;
  min-height: unset;
  margin: 0;
}

.share-text {
  font-size: 24rpx;
}

.instruction-text {
  margin-bottom: 80rpx;
  /* padding: 20rpx 30rpx; */
  /* background: rgba(255, 255, 255, 0.07); */
  border-radius: 40rpx;
  /* text-align: center; */
  max-width: 640rpx;
  display: flex;
  align-items: center;
}
.instruction-text .info-icon {
  margin-right: 10rpx;
}

.instruction-text text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.input-section {
  width: 640rpx;
  margin-top: 40rpx;
  margin-bottom: 60rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 32rpx;
  padding: 50rpx 40rpx 80rpx 40rpx;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.2);
  animation: slideUp 0.8s ease-out;
}

.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 160rpx;
  align-items: center;
}

.input-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 24rpx;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  position: relative;
  flex: 1;
}

.input-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  padding-left: 4rpx;
  letter-spacing: 0;
}

.number-input {
  height: 88rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  text-align: center;
  font-size: 30rpx;
  color: #fff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
  letter-spacing: 0;
}

.number-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 24rpx;
}

.number-input:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: #4a90e2;
  box-shadow: 0 0 30rpx rgba(74, 144, 226, 0.3);
  outline: none;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #00ff88, #00a3ff);
  transition: width 0.3s ease;
}

.number-input:focus + .input-border {
  width: 100%;
}

.predict-btn {
  width: 560rpx;
  height: 92rpx;
  background: linear-gradient(45deg, #0066cc, #00a3ff);
  border: none;
  border-radius: 46rpx;
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 163, 255, 0.4);
  margin-top: 100rpx;
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 70%
  );
  transform: rotate(45deg);
  transition: all 0.3s ease;
  pointer-events: none;
}

.predict-btn:active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 163, 255, 0.4);
}

.predict-btn:active .btn-glow {
  transform: rotate(45deg) scale(0.95);
}

.predict-btn[disabled] {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.predict-btn-loading {
  animation: glowPulse 1.5s infinite;
}

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 10rpx rgba(0, 163, 255, 0.5),
      0 0 20rpx rgba(0, 102, 204, 0.5);
  }
  50% {
    box-shadow: 0 0 40rpx rgba(0, 163, 255, 0.8),
      0 0 60rpx rgba(0, 102, 204, 0.8);
  }
  100% {
    box-shadow: 0 0 10rpx rgba(0, 163, 255, 0.5),
      0 0 20rpx rgba(0, 102, 204, 0.5);
  }
}

.stars {
  width: 4rpx;
  height: 4rpx;
  background: transparent;
  box-shadow: 3608rpx 2530rpx #fff, 730rpx 664rpx #fff, 172rpx 3776rpx #fff,
    3776rpx 968rpx #fff, 398rpx 2978rpx #fff, 2918rpx 2020rpx #fff,
    1614rpx 776rpx #fff, 1710rpx 1116rpx #fff, 166rpx 2190rpx #fff,
    2836rpx 754rpx #fff, 1354rpx 1772rpx #fff, 1724rpx 3418rpx #fff,
    2116rpx 2170rpx #fff, 100rpx 3544rpx #fff, 3882rpx 3088rpx #fff,
    754rpx 1800rpx #fff, 368rpx 1424rpx #fff, 3594rpx 3856rpx #fff,
    1014rpx 3722rpx #fff, 3698rpx 38rpx #fff, 2798rpx 400rpx #fff,
    1944rpx 994rpx #fff, 1590rpx 2218rpx #fff, 1492rpx 1940rpx #fff,
    3048rpx 1944rpx #fff, 3262rpx 778rpx #fff, 2052rpx 2032rpx #fff,
    2590rpx 1724rpx #fff, 2516rpx 3752rpx #fff, 1582rpx 378rpx #fff,
    3168rpx 930rpx #fff, 1730rpx 1864rpx #fff, 1372rpx 3776rpx #fff,
    2576rpx 968rpx #fff, 398rpx 2978rpx #fff, 2918rpx 2020rpx #fff,
    1614rpx 776rpx #fff, 1710rpx 1116rpx #fff, 166rpx 2190rpx #fff,
    2836rpx 754rpx #fff;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
}

.stars:after {
  content: ' ';
  position: absolute;
  top: 4000rpx;
  width: 4rpx;
  height: 4rpx;
  background: transparent;
  box-shadow: 3608rpx 2530rpx #fff, 730rpx 664rpx #fff, 172rpx 3776rpx #fff,
    3776rpx 968rpx #fff, 398rpx 2978rpx #fff, 2918rpx 2020rpx #fff,
    1614rpx 776rpx #fff, 1710rpx 1116rpx #fff, 166rpx 2190rpx #fff,
    2836rpx 754rpx #fff, 1354rpx 1772rpx #fff, 1724rpx 3418rpx #fff,
    2116rpx 2170rpx #fff, 100rpx 3544rpx #fff, 3882rpx 3088rpx #fff,
    754rpx 1800rpx #fff, 368rpx 1424rpx #fff, 3594rpx 3856rpx #fff,
    1014rpx 3722rpx #fff, 3698rpx 38rpx #fff, 2798rpx 400rpx #fff,
    1944rpx 994rpx #fff, 1590rpx 2218rpx #fff, 1492rpx 1940rpx #fff,
    3048rpx 1944rpx #fff, 3262rpx 778rpx #fff, 2052rpx 2032rpx #fff,
    2590rpx 1724rpx #fff, 2516rpx 3752rpx #fff, 1582rpx 378rpx #fff,
    3168rpx 930rpx #fff, 1730rpx 1864rpx #fff, 1372rpx 3776rpx #fff,
    2576rpx 968rpx #fff, 398rpx 2978rpx #fff, 2918rpx 2020rpx #fff,
    1614rpx 776rpx #fff, 1710rpx 1116rpx #fff, 166rpx 2190rpx #fff,
    2836rpx 754rpx #fff;
}

.stars2 {
  width: 6rpx;
  height: 6rpx;
  background: transparent;
  box-shadow: 3628rpx 2550rpx #fff, 750rpx 684rpx #fff, 192rpx 3796rpx #fff,
    3796rpx 988rpx #fff, 3168rpx 930rpx #fff, 1730rpx 1864rpx #fff,
    1372rpx 3776rpx #fff, 2576rpx 968rpx #fff, 2798rpx 400rpx #fff,
    1944rpx 994rpx #fff, 1590rpx 2218rpx #fff, 1492rpx 1940rpx #fff,
    3048rpx 1944rpx #fff, 3262rpx 778rpx #fff, 2052rpx 2032rpx #fff,
    2590rpx 1724rpx #fff;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
}

.stars2:after {
  content: ' ';
  position: absolute;
  top: 4000rpx;
  width: 6rpx;
  height: 6rpx;
  background: transparent;
  box-shadow: 3628rpx 2550rpx #fff, 750rpx 684rpx #fff, 192rpx 3796rpx #fff,
    3796rpx 988rpx #fff, 3168rpx 930rpx #fff, 1730rpx 1864rpx #fff,
    1372rpx 3776rpx #fff, 2576rpx 968rpx #fff, 2798rpx 400rpx #fff,
    1944rpx 994rpx #fff, 1590rpx 2218rpx #fff, 1492rpx 1940rpx #fff,
    3048rpx 1944rpx #fff, 3262rpx 778rpx #fff, 2052rpx 2032rpx #fff,
    2590rpx 1724rpx #fff;
}

.stars3 {
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow: 3648rpx 2570rpx #fff, 770rpx 704rpx #fff, 212rpx 3816rpx #fff,
    3816rpx 1008rpx #fff, 3188rpx 950rpx #fff, 1750rpx 1884rpx #fff,
    1392rpx 3796rpx #fff, 2596rpx 988rpx #fff;
  animation: animStar 150s linear infinite;
  opacity: 1;
}

.stars3:after {
  content: ' ';
  position: absolute;
  top: 4000rpx;
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow: 3648rpx 2570rpx #fff, 770rpx 704rpx #fff, 212rpx 3816rpx #fff,
    3816rpx 1008rpx #fff, 3188rpx 950rpx #fff, 1750rpx 1884rpx #fff,
    1392rpx 3796rpx #fff, 2596rpx 988rpx #fff;
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
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, var(--brightness, 1)),
    transparent
  );
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

.header {
  text-align: center;
  margin: 30rpx 0 50rpx;
  animation: fadeIn 1s ease-out;
  width: 100%;
}

.title {
  font-size: 64rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.5),
    0 0 40rpx rgba(255, 255, 255, 0.3), 0 0 60rpx rgba(255, 255, 255, 0.2);
  letter-spacing: 4rpx;
}

.subtitle {
  display: block;
  margin-top: 20rpx;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 6rpx;
}

.prediction-section {
  width: 80%;
  max-width: 800rpx;
  margin-top: 60rpx;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 40rpx;
  padding: 60rpx;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeIn 0.8s ease-out;
}

.prediction-title {
  display: flex;
  align-items: center;
  gap: 24rpx;
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 40rpx;
  text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3);
}

.prediction-icon {
  font-size: 56rpx;
}

.prediction-content {
  font-size: 34rpx;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
  padding: 40rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 30rpx;
  border-left: 8rpx solid #3949ab;
  letter-spacing: 1rpx;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(80rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.test-btn {
  width: 560rpx;
  height: 84rpx;
  background: linear-gradient(45deg, #00a3ff, #00ff88);
  border: none;
  border-radius: 42rpx;
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  letter-spacing: 2rpx;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 30rpx auto 0;
  display: block;
  box-shadow: 0 8rpx 30rpx rgba(0, 163, 255, 0.4);
}

.test-btn-text {
  position: relative;
  z-index: 1;
}

.test-btn:active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 163, 255, 0.4);
}

.history-link {
  position: absolute;
  bottom: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  margin: 0 0 80rpx 0;
  text-align: center;
  z-index: 10;
  transition: all 0.3s ease;
}

.history-text {
  color: #2979ff;
  font-size: 28rpx;
  text-decoration: underline;
}
</style>

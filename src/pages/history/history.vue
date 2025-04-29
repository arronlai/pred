<template>
  <view class="history-container">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view
      class="shooting-star"
      style="
        --delay: 1.2;
        --top: 20%;
        --left: 75%;
        --size: 1.5;
        --brightness: 1;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 3.8;
        --top: 40%;
        --left: 85%;
        --size: 1.2;
        --brightness: 0.9;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 6.5;
        --top: 5%;
        --left: 65%;
        --size: 1.8;
        --brightness: 0.8;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 9.7;
        --top: 60%;
        --left: 90%;
        --size: 1.4;
        --brightness: 1.1;
      "
    ></view>
    <view
      class="shooting-star"
      style="
        --delay: 13.3;
        --top: 30%;
        --left: 70%;
        --size: 2;
        --brightness: 0.7;
      "
    ></view>

    <view class="header">
      <text class="title">历史记录</text>
    </view>

    <view class="history-list">
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="records.length === 0" class="empty">暂无历史记录</view>
      <view v-else class="record-list">
        <view
          v-for="(record, index) in records"
          :key="index"
          class="record-item"
        >
          <view class="record-header">
            <text class="record-time">{{ formatTime(record.createTime) }}</text>
            <text class="record-numbers">{{
              record.input.numbers.join(', ')
            }}</text>
          </view>
          <button class="view-detail-btn" @click="viewDetail(record)">
            查看详情
          </button>
        </view>
      </view>
    </view>

    <view v-if="hasMore" class="load-more" @click="loadMore">
      <text>加载更多</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const records = ref([]);
    const loading = ref(false);
    const hasMore = ref(true);
    const currentPage = ref(1);
    const pageSize = 10;

    const loadHistory = async (page = 1) => {
      loading.value = true;
      try {
        // 获取用户信息
        const userInfo = uni.getStorageSync('userInfo');
        if (!userInfo || !userInfo.token) {
          // 清空不完整的用户信息
          uni.removeStorageSync('userInfo');
          uni.showToast({
            title: '用户信息不完整，请重新登录',
            icon: 'none',
          });
          // 跳转到登录页
          uni.navigateTo({
            url:
              '/pages/login/login?redirect=' +
              encodeURIComponent('/pages/history/history'),
          });
          return;
        }

        const res = await uniCloud.callFunction({
          name: 'getPredictionHistory',
          data: {
            page,
            pageSize,
            token: userInfo.token,
          },
        });

        if (res.result.code === 0) {
          if (page === 1) {
            records.value = res.result.data.records;
          } else {
            records.value = [...records.value, ...res.result.data.records];
          }
          hasMore.value = records.value.length < res.result.data.total;
        } else {
          uni.showToast({
            title: res.result.message || '获取历史记录失败',
            icon: 'none',
          });
        }
      } catch (error) {
        uni.showToast({
          title: '获取历史记录失败',
          icon: 'none',
        });
      } finally {
        loading.value = false;
      }
    };

    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        currentPage.value++;
        loadHistory(currentPage.value);
      }
    };

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(date.getDate()).padStart(2, '0')} ${String(
        date.getHours()
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const viewDetail = (record) => {
      uni.navigateTo({
        url: `/pages/result/result?prediction=${encodeURIComponent(
          JSON.stringify({ code: 0, content: record.result })
        )}`,
      });
    };

    onMounted(() => {
      loadHistory();
    });

    return {
      records,
      loading,
      hasMore,
      loadMore,
      formatTime,
      viewDetail,
    };
  },
};
</script>

<style>
.history-container {
  padding: 40rpx;
  height: 100vh;
  box-sizing: border-box;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.header {
  margin-bottom: 60rpx;
  text-align: center;
  position: relative;
  z-index: 1;
}

.title {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3);
  letter-spacing: 4rpx;
}

.history-list {
  margin-bottom: 40rpx;
  position: relative;
  z-index: 1;
}

.loading,
.empty {
  text-align: center;
  padding: 48rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  margin: 20rpx 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.record-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  height: 84rpx;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.record-item:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.record-time {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2rpx;
}

.record-numbers {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.record-numbers::before {
  content: '所选数字：';
  font-size: 28rpx;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.7);
}

.view-detail-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  color: white;
  border: none;
  border-radius: 32rpx;
  font-size: 28rpx;
  padding: 8rpx 24rpx;
  height: 60rpx;
  line-height: 60rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0;
}

.load-more {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 20rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
  position: relative;
  z-index: 1;
}

.load-more:active {
  opacity: 0.8;
}

/* Star Styles */
.stars {
  width: 4rpx;
  height: 4rpx;
  background: transparent;
  box-shadow: 3608rpx 2530rpx #fff, 730rpx 664rpx #fff, 172rpx 3776rpx #fff,
    3776rpx 968rpx #fff, 398rpx 2978rpx #fff, 2918rpx 2020rpx #fff,
    1614rpx 776rpx #fff, 1710rpx 1116rpx #fff, 166rpx 2190rpx #fff,
    2836rpx 754rpx #fff, 1354rpx 1772rpx #fff, 1724rpx 3418rpx #fff;
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
    2836rpx 754rpx #fff, 1354rpx 1772rpx #fff, 1724rpx 3418rpx #fff;
}

.stars2 {
  width: 6rpx;
  height: 6rpx;
  background: transparent;
  box-shadow: 3628rpx 2550rpx #fff, 750rpx 684rpx #fff, 192rpx 3796rpx #fff,
    3796rpx 988rpx #fff, 3168rpx 930rpx #fff, 1730rpx 1864rpx #fff,
    1372rpx 3776rpx #fff, 2576rpx 968rpx #fff;
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
    1372rpx 3776rpx #fff, 2576rpx 968rpx #fff;
}

.stars3 {
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow: 3648rpx 2570rpx #fff, 770rpx 704rpx #fff, 212rpx 3816rpx #fff,
    3816rpx 1008rpx #fff;
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
    3816rpx 1008rpx #fff;
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
  width: calc(240rpx * var(--size, 1));
  height: calc(6rpx * var(--size, 1));
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
</style>

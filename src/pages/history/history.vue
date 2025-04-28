<template>
  <view class="history-container">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0"></view>
    <view class="shooting-star" style="--delay: 1"></view>
    <view class="shooting-star" style="--delay: 2"></view>
    <view class="shooting-star" style="--delay: 3"></view>

    <view class="header">
      <text class="title">预测历史</text>
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
  padding: 20px;
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.header {
  margin-bottom: 30px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
}

.history-list {
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.loading,
.empty {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 10px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  height: 42px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.record-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.record-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
}

.record-numbers {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-numbers::before {
  content: '所选数字：';
  font-size: 14px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.7);
}

.view-detail-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(41, 121, 255, 0.4);
  transition: all 0.3s ease;
  width: auto;
  min-width: 80px;
  text-align: center;
  height: 32px;
  line-height: 20px;
  margin: 0;
}

.view-detail-btn:active {
  transform: translateY(-50%) scale(0.95);
  box-shadow: 0 2px 8px rgba(41, 121, 255, 0.4);
}

.load-more {
  text-align: center;
  padding: 16px;
  color: #56ccf2;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(86, 204, 242, 0.3);
  position: relative;
  z-index: 1;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.load-more:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* 星星背景 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 1804px 1265px #fff, 365px 332px #fff, 86px 1888px #fff,
    1888px 484px #fff, 199px 1489px #fff, 1459px 1010px #fff, 807px 388px #fff,
    855px 558px #fff;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
}

.stars2 {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 1814px 1275px #fff, 375px 342px #fff, 96px 1898px #fff,
    1898px 494px #fff;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
}

.stars3 {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 1824px 1285px #fff, 385px 352px #fff, 106px 1908px #fff,
    1908px 504px #fff;
  animation: animStar 150s linear infinite;
  opacity: 1;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}

/* 流星效果 */
.shooting-star {
  position: absolute;
  top: 50%;
  left: 80%;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, #fff, transparent);
  animation: shootingStar 4s infinite;
  animation-delay: calc(var(--delay) * 1s);
  opacity: 0;
  z-index: 0;
}

@keyframes shootingStar {
  0% {
    transform: translate(0, 0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  10%,
  20% {
    transform: translate(-200px, 200px) rotate(-45deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-400px, 400px) rotate(-45deg) scale(0.2);
    opacity: 0;
  }
}
</style>

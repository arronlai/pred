<template>
  <view class="history-container">
    <view class="header">
      <text class="title">预测历史</text>
    </view>
    
    <view class="history-list">
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="records.length === 0" class="empty">暂无历史记录</view>
      <view v-else class="record-list">
        <view v-for="(record, index) in records" :key="index" class="record-item">
          <view class="record-header">
            <text class="record-time">{{ formatTime(record.createTime) }}</text>
            <text class="record-numbers">{{ record.input.numbers.join(', ') }}</text>
          </view>
          <button class="view-detail-btn" @click="viewDetail(record)">查看详情</button>
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
            icon: 'none'
          });
          // 跳转到登录页
          uni.navigateTo({
            url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/history/history')
          });
          return;
        }

        const res = await uniCloud.callFunction({
          name: 'getPredictionHistory',
          data: {
            page,
            pageSize,
            token: userInfo.token
          }
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
            icon: 'none'
          });
        }
      } catch (error) {
        uni.showToast({
          title: '获取历史记录失败',
          icon: 'none'
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
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const viewDetail = (record) => {
      uni.navigateTo({
        url: `/pages/result/result?prediction=${encodeURIComponent(JSON.stringify({code: 0, content: record.result}))}`
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
      viewDetail
    };
  }
};
</script>

<style>
.history-container {
  padding: 20px;
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  color: #fff;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

.history-list {
  margin-bottom: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 20px;
  color: rgba(255,255,255,0.7);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-time {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.record-numbers {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.view-detail-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(41,121,255,0.4);
}

.load-more {
  text-align: center;
  padding: 15px;
  color: #56ccf2;
  font-size: 16px;
}
</style> 

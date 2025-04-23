<template>
  <view class="content">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0"></view>
    <view class="shooting-star" style="--delay: 1"></view>
    <view class="shooting-star" style="--delay: 2"></view>
    <view class="shooting-star" style="--delay: 3"></view>
    
    <view class="header">
      <text class="title">平替好物</text>
      <text class="subtitle">✨ 帮你找到更实惠的选择 ✨</text>
    </view>
    
    <view class="input-section">
      <view class="input-group">
        <view class="input-wrapper">
          <text class="input-label">商品名称或链接</text>
          <input 
            type="text" 
            v-model="productInput" 
            class="product-input"
            placeholder="请输入商品名称或粘贴商品链接"
          />
          <view class="input-border"></view>
        </view>
      </view>
      <button @click="handleSearch" class="predict-btn" :disabled="isLoading" :class="{'predict-btn-loading': isLoading}">
        <text class="predict-btn-text">{{ isLoading ? '正在查找...' : '开始查找' }}</text>
        <view class="btn-glow"></view>
      </button>
    </view>
    
    <view v-if="searchResult" class="result-section">
      <view class="result-title">
        <text class="result-icon">🔍</text>
        <text>查找结果</text>
      </view>
      <view class="result-content">
        <view class="original-product">
          <text class="product-title">原商品</text>
          <view class="product-info">
            <image :src="searchResult.original.image" mode="aspectFit" class="product-image"></image>
            <view class="product-details">
              <text class="product-name">{{ searchResult.original.name }}</text>
              <text class="product-price">¥{{ searchResult.original.price }}</text>
            </view>
          </view>
        </view>
        
        <view class="alternative-products">
          <text class="product-title">平替推荐</text>
          <view class="product-list">
            <view v-for="(product, index) in searchResult.alternatives" :key="index" class="product-item">
              <image :src="product.image" mode="aspectFit" class="product-image"></image>
              <view class="product-details">
                <text class="product-name">{{ product.name }}</text>
                <text class="product-price">¥{{ product.price }}</text>
                <text class="product-savings">节省: ¥{{ product.savings }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="comparison-section">
          <text class="comparison-title">详细对比</text>
          <view class="comparison-table">
            <view class="table-header">
              <text class="header-item">特性</text>
              <text class="header-item">原商品</text>
              <text class="header-item">平替商品</text>
            </view>
            <view v-for="(feature, index) in searchResult.comparison" :key="index" class="table-row">
              <text class="row-item">{{ feature.name }}</text>
              <text class="row-item">{{ feature.original }}</text>
              <text class="row-item">{{ feature.alternative }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app';

const productInput = ref('')
const searchResult = ref(null)
const isLoading = ref(false)

onLoad(() => {
    // 检查用户是否已登录
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo) {
        // 未登录，跳转到登录页
        uni.navigateTo({
            url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
        });
    }
});

const handleSearch = async () => {
    // 检查用户是否已登录
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo) {
        uni.navigateTo({
            url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
        });
        return;
    }

    if (!productInput.value) {
        uni.showToast({
            title: '请输入商品名称或链接',
            icon: 'none'
        });
        return;
    }

    isLoading.value = true;
    try {
        const result = await uniCloud.callFunction({
            name: 'findAlternative',
            data: {
                product: productInput.value
            }
        });
        
        if (result.result && result.result.code === 0) {
            searchResult.value = result.result.data;
        } else {
            throw new Error(result.result?.message || '查找失败');
        }
    } catch (error) {
        uni.showToast({
            title: error.message || '查找失败，请重试',
            icon: 'none'
        });
    } finally {
        isLoading.value = false;
    }
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  position: relative;
  overflow: hidden;
}

.input-section {
  width: 280px;
  margin-bottom: 30px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  animation: slideUp 0.8s ease-out;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
  align-items: center;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  width: 100%;
}

.input-label {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  padding-left: 4px;
  letter-spacing: 1px;
}

.product-input {
    height: 42px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    padding: 0 15px;
    font-size: 16px;
    color: #fff;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(5px);
    letter-spacing: 1px;
    width: 100%;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00ff88, #00a3ff);
  transition: width 0.3s ease;
}

.number-input:focus + .input-border {
  width: 100%;
}

.predict-btn {
  width: 280px;
  height: 42px;
  background: linear-gradient(45deg, #0066cc, #00a3ff);
  border: none;
  border-radius: 21px;
  font-size: 16px;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  box-shadow: 0 4px 15px rgba(0, 163, 255, 0.4);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: rotate(45deg);
  transition: all 0.3s ease;
  pointer-events: none;
}

.predict-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(0, 163, 255, 0.4);
}

.predict-btn:active .btn-glow {
  transform: rotate(45deg) scale(0.95);
}

.predict-btn[disabled] {
  background: rgba(255,255,255,0.1);
  box-shadow: none;
}

.predict-btn-loading {
  animation: glowPulse 1.5s infinite;
}

@keyframes glowPulse {
  0% { box-shadow: 0 0 5px rgba(0, 163, 255, 0.5), 0 0 10px rgba(0, 102, 204, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 163, 255, 0.8), 0 0 30px rgba(0, 102, 204, 0.8); }
  100% { box-shadow: 0 0 5px rgba(0, 163, 255, 0.5), 0 0 10px rgba(0, 102, 204, 0.5); }
}

.stars {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 
    1804px 1265px #FFF, 365px 332px #FFF, 86px 1888px #FFF, 1888px 484px #FFF,
    199px 1489px #FFF, 1459px 1010px #FFF, 807px 388px #FFF, 855px 558px #FFF,
    83px 1095px #FFF, 1418px 377px #FFF, 677px 886px #FFF, 862px 1709px #FFF,
    1058px 1085px #FFF, 50px 1772px #FFF, 1941px 1544px #FFF, 377px 900px #FFF,
    184px 712px #FFF, 1797px 1928px #FFF, 507px 1861px #FFF, 1849px 19px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF,
    1258px 1876px #FFF, 791px 189px #FFF, 1584px 465px #FFF, 865px 932px #FFF,
    686px 1888px #FFF, 1288px 484px #FFF, 199px 1489px #FFF, 1459px 1010px #FFF,
    807px 388px #FFF, 855px 558px #FFF, 83px 1095px #FFF, 1418px 377px #FFF;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
}

.stars:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 
    1804px 1265px #FFF, 365px 332px #FFF, 86px 1888px #FFF, 1888px 484px #FFF,
    199px 1489px #FFF, 1459px 1010px #FFF, 807px 388px #FFF, 855px 558px #FFF,
    83px 1095px #FFF, 1418px 377px #FFF, 677px 886px #FFF, 862px 1709px #FFF,
    1058px 1085px #FFF, 50px 1772px #FFF, 1941px 1544px #FFF, 377px 900px #FFF,
    184px 712px #FFF, 1797px 1928px #FFF, 507px 1861px #FFF, 1849px 19px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF,
    1258px 1876px #FFF, 791px 189px #FFF, 1584px 465px #FFF, 865px 932px #FFF,
    686px 1888px #FFF, 1288px 484px #FFF, 199px 1489px #FFF, 1459px 1010px #FFF,
    807px 388px #FFF, 855px 558px #FFF, 83px 1095px #FFF, 1418px 377px #FFF;
}

.stars2 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 
    1814px 1275px #FFF, 375px 342px #FFF, 96px 1898px #FFF, 1898px 494px #FFF,
    1584px 465px #FFF, 865px 932px #FFF, 686px 1888px #FFF, 1288px 484px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
}

.stars2:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 
    1814px 1275px #FFF, 375px 342px #FFF, 96px 1898px #FFF, 1898px 494px #FFF,
    1584px 465px #FFF, 865px 932px #FFF, 686px 1888px #FFF, 1288px 484px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF;
}

.stars3 {
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 
    1824px 1285px #FFF, 385px 352px #FFF, 106px 1908px #FFF, 1908px 504px #FFF,
    1594px 475px #FFF, 875px 942px #FFF, 696px 1898px #FFF, 1298px 494px #FFF;
  animation: animStar 150s linear infinite;
  opacity: 1;
}

.stars3:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 
    1824px 1285px #FFF, 385px 352px #FFF, 106px 1908px #FFF, 1908px 504px #FFF,
    1594px 475px #FFF, 875px 942px #FFF, 696px 1898px #FFF, 1298px 494px #FFF;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}

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
}

@keyframes shootingStar {
  0% {
    transform: translate(0, 0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  10%, 20% {
    transform: translate(-200px, 200px) rotate(-45deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-400px, 400px) rotate(-45deg) scale(0.2);
    opacity: 0;
  }
}

.header {
  text-align: center;
  margin: 40px 0;
  animation: fadeIn 1s ease-out;
}

.title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5),
               0 0 20px rgba(255,255,255,0.3),
               0 0 30px rgba(255,255,255,0.2);
  letter-spacing: 2px;
}

.subtitle {
  display: block;
  margin-top: 15px;
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  letter-spacing: 3px;
}

.result-section {
  width: 90%;
  max-width: 600px;
  margin-top: 30px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  animation: fadeIn 0.8s ease-out;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
}

.product-info {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 15px;
}

.product-image {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-name {
  font-size: 16px;
  color: #fff;
  font-weight: bold;
}

.product-price {
  font-size: 18px;
  color: #ff6b6b;
  font-weight: bold;
}

.product-savings {
  font-size: 14px;
  color: #4caf50;
}

.comparison-table {
  margin-top: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 15px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: rgba(255,255,255,0.1);
  padding: 15px;
}

.table-row {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.header-item, .row-item {
  flex: 1;
  text-align: center;
  color: #fff;
}

.header-item {
  font-weight: bold;
}

.alternative-products {
  margin-top: 30px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 15px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

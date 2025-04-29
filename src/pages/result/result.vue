<template>
  <view class="container">
    <feedback-btn></feedback-btn>

    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0; --top: 30%; --left: 80%; --size: 1.5; --brightness: 1"></view>
    <view class="shooting-star" style="--delay: 2.5; --top: 15%; --left: 70%; --size: 1.2; --brightness: 0.9"></view>
    <view class="shooting-star" style="--delay: 5.7; --top: 45%; --left: 90%; --size: 1.8; --brightness: 0.8"></view>
    <view class="shooting-star" style="--delay: 8.3; --top: 10%; --left: 60%; --size: 1.4; --brightness: 1.1"></view>
    <view class="shooting-star" style="--delay: 12.1; --top: 60%; --left: 75%; --size: 2; --brightness: 0.7"></view>
    <view class="shooting-star" style="--delay: 15.5; --top: 25%; --left: 85%; --size: 1.3; --brightness: 1.2"></view>

    <view class="result-card">
      <h3 class="section-title">{{ currentTitle }}</h3>
      <view class="result-content">
        <rich-text :nodes="currentPageContent"></rich-text>
      </view>
    </view>

    <view class="button-container">
      <view class="button-group">
        <button
          class="nav-btn prev-btn"
          @click="prevPage"
          :disabled="currentPage === 0"
        >
          上一页
        </button>
        <button class="back-btn" @click="goHome">重新预测</button>
        <button
          class="nav-btn next-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages - 1"
        >
          下一页
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const prediction = ref('');
const currentPage = ref(0);

// 将内容分成三部分：预测结果、具体建议、分析过程
const contentParts = computed(() => {
  if (!prediction.value) return ['', '', ''];

  // 尝试解析JSON格式
  let content = prediction.value;
  try {
    if (typeof content === 'string') {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        content = parsed.content || parsed.result || parsed.data || content;
      }
    }
  } catch (e) {
    // 如果不是JSON格式，继续使用原始内容
    console.log('内容不是JSON格式，使用原始内容');
  }

  content = content.trim();

  let resultPart = '';
  let advicePart = '';
  let analysisPart = '';

  // 尝试多种分隔符格式
  const resultRegex =
    /(?:===预测结果===|### 预测结果|预测结果：?)\s*\n([\s\S]*?)(?====具体建议===|### 具体建议|具体建议：?|$)/i;
  const adviceRegex =
    /(?:===具体建议===|### 具体建议|具体建议：?)\s*\n([\s\S]*?)(?====分析过程===|### 分析过程|分析过程：?|$)/i;
  const analysisRegex =
    /(?:===分析过程===|### 分析过程|分析过程：?)\s*\n([\s\S]*?)$/i;

  const resultMatch = content.match(resultRegex);
  const adviceMatch = content.match(adviceRegex);
  const analysisMatch = content.match(analysisRegex);

  if (resultMatch && resultMatch[1]) {
    resultPart = resultMatch[1].trim();
  }
  if (adviceMatch && adviceMatch[1]) {
    advicePart = adviceMatch[1].trim();
  }
  if (analysisMatch && analysisMatch[1]) {
    analysisPart = analysisMatch[1].trim();
  }

  // 如果无法按预期格式分割，尝试其他方式
  if (!resultPart && !advicePart && !analysisPart) {
    console.warn('无法按预期格式分割内容，尝试其他方式解析');

    // 尝试按段落分割
    const paragraphs = content.split('\n\n');
    if (paragraphs.length >= 3) {
      resultPart = paragraphs[0];
      advicePart = paragraphs[1];
      analysisPart = paragraphs.slice(2).join('\n\n');
    } else {
      // 如果还是无法分割，将所有内容显示为预测结果
      console.warn('无法分割内容，将所有内容显示为预测结果');
      resultPart = content;
    }
  }

  return [resultPart, advicePart, analysisPart];
});

// 计算总页数
const totalPages = computed(() => {
  return contentParts.value.filter((part) => part.trim() !== '').length;
});

// 当前页标题
const currentTitle = computed(() => {
  const titles = ['预测结果', '行动建议', '分析过程'];
  return titles[currentPage.value];
});

// 当前页内容 (移除标题和 page-content wrapper)
const currentPageContent = computed(() => {
  if (!prediction.value) return '';

  const parts = contentParts.value;

  // 如果当前页没有内容，返回空字符串
  if (currentPage.value >= parts.length || !parts[currentPage.value].trim()) {
    return '';
  }

  // 格式化当前页内容
  const content = parts[currentPage.value]
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 加粗
    .replace(/\n\n/g, '</p><p>') // 段落
    .replace(/^/, '<p>') // Add opening p tag at the start
    .replace(/$/, '</p>') // Add closing p tag at the end
    .replace(/\n/g, '<br>') // 换行
    .replace(/\d+\.\s/g, '<br>$&') // 列表项
    .replace(/\s-\s/g, '<br>• ') // 破折号列表
    .replace(/\s{2,}/g, ' '); // 多余空格

  // 只返回 P 标签包裹的内容 HTML
  return content;
});

// 格式化内容为HTML
const formattedPrediction = computed(() => {
  if (!prediction.value) return '';

  // 将markdown格式转换为HTML
  return prediction.value
    .replace(/### (.*?)\n/g, '<h3 class="section-title">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
});

// 上一页
const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
  }
};

// 使用 uni-app 的生命周期钩子
onLoad((options) => {
  if (options.prediction) {
    try {
      // 尝试解析JSON格式
      const data = JSON.parse(decodeURIComponent(options.prediction));
      // 如果是对象格式且有content字段，使用content字段
      if (data && typeof data === 'object' && data.content) {
        prediction.value = data.content;
      } else if (data && typeof data === 'object' && data.result) {
        // 兼容历史记录中的result字段
        prediction.value = data.result;
      } else {
        // 否则使用整个字符串
        prediction.value = decodeURIComponent(options.prediction);
      }
    } catch (e) {
      // 如果不是JSON格式，直接使用原始字符串
      prediction.value = decodeURIComponent(options.prediction);
    }
  }
});

const goHome = () => {
  uni.navigateTo({
    url: '/pages/index/index',
  });
};
</script>

<style>
.container {
  height: 100vh;
  overflow: hidden;
box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;
  padding: 40rpx 30rpx 0; /* 替换为rpx */
  overflow: hidden; /* Hide overflowing stars */
}

.result-card {
  flex: 1;
  max-width: 1200rpx; /* 替换为rpx */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 40rpx; /* 替换为rpx */
  padding: 40rpx; /* 替换为rpx */
  margin: 0 auto 200rpx; /* 替换为rpx */
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.2); /* 替换为rpx */
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1; /* Ensure card is above stars */
}

.section-title {
  color: #fff;
  font-size: 44rpx; /* 替换为rpx */
  font-weight: bold;
  margin: 0 0 40rpx; /* 替换为rpx */
  padding: 20rpx 0; /* 替换为rpx */
  text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3); /* 替换为rpx */
  text-align: center;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 32rpx; /* 替换为rpx */
  line-height: 1.8;
  overflow-y: auto;
  padding: 0 10rpx; /* 替换为rpx */
}

.result-content p {
  margin-bottom: 20rpx; /* 替换为rpx */
}

.result-content strong {
  color: #fff;
  font-weight: bold;
}

/*
.result-content br {
	margin: 6px 0;
}
*/

.button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx; /* 替换为rpx */
  z-index: 10;
  background: linear-gradient(to top, rgba(11, 19, 30, 0.9), rgba(11, 19, 30, 0.7), transparent);
  backdrop-filter: blur(5px);
}

.button-group {
  display: flex;
  justify-content: space-between;
  max-width: 1200rpx; /* 替换为rpx */
  margin: 0 auto;
}

.nav-btn,
.back-btn {
  width: 190rpx;
  height: 84rpx;
  border-radius: 80rpx;
  color: white;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.nav-btn {
  background: transparent;
  border: 1px solid #56ccf2;
  color: #56ccf2;
  box-shadow: none;
}

.back-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  border: none;
  box-shadow: 0 0 15px rgba(41, 121, 255, 0.6);
}

.nav-btn[disabled] {
  background: transparent;
  border-color: rgba(100, 100, 100, 0.5);
  color: rgba(100, 100, 100, 0.5);
  box-shadow: none;
  opacity: 0.7;
}

.nav-btn:active {
  background: rgba(86, 204, 242, 0.1);
  transform: scale(0.95);
}

.back-btn:active {
  transform: scale(0.95);
}

/* Remove .page-content style */
/*
.page-content {
	padding: 0 10px;
}
*/

/* 自定义滚动条样式 */
.result-content::-webkit-scrollbar {
  width: 6px;
}

.result-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.result-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.result-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Star Styles from index.vue */
.stars {
  width: 4rpx; /* 替换为rpx */
  height: 4rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3608rpx 2530rpx #FFF, 730rpx 664rpx #FFF, 172rpx 3776rpx #FFF, 3776rpx 968rpx #FFF,
    398rpx 2978rpx #FFF, 2918rpx 2020rpx #FFF, 1614rpx 776rpx #FFF, 1710rpx 1116rpx #FFF,
    166rpx 2190rpx #FFF, 2836rpx 754rpx #FFF, 1354rpx 1772rpx #FFF, 1724rpx 3418rpx #FFF;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars:after {
  content: " ";
  position: absolute;
  top: 4000rpx; /* 替换为rpx */
  width: 4rpx; /* 替换为rpx */
  height: 4rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3608rpx 2530rpx #FFF, 730rpx 664rpx #FFF, 172rpx 3776rpx #FFF, 3776rpx 968rpx #FFF,
    398rpx 2978rpx #FFF, 2918rpx 2020rpx #FFF, 1614rpx 776rpx #FFF, 1710rpx 1116rpx #FFF,
    166rpx 2190rpx #FFF, 2836rpx 754rpx #FFF, 1354rpx 1772rpx #FFF, 1724rpx 3418rpx #FFF;
}

.stars2 {
  width: 6rpx; /* 替换为rpx */
  height: 6rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3628rpx 2550rpx #FFF, 750rpx 684rpx #FFF, 192rpx 3796rpx #FFF, 3796rpx 988rpx #FFF,
    3168rpx 930rpx #FFF, 1730rpx 1864rpx #FFF, 1372rpx 3776rpx #FFF, 2576rpx 968rpx #FFF;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars2:after {
  content: " ";
  position: absolute;
  top: 4000rpx; /* 替换为rpx */
  width: 6rpx; /* 替换为rpx */
  height: 6rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3628rpx 2550rpx #FFF, 750rpx 684rpx #FFF, 192rpx 3796rpx #FFF, 3796rpx 988rpx #FFF,
    3168rpx 930rpx #FFF, 1730rpx 1864rpx #FFF, 1372rpx 3776rpx #FFF, 2576rpx 968rpx #FFF;
}

.stars3 {
  width: 8rpx; /* 替换为rpx */
  height: 8rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3648rpx 2570rpx #FFF, 770rpx 704rpx #FFF, 212rpx 3816rpx #FFF, 3816rpx 1008rpx #FFF;
  animation: animStar 150s linear infinite;
  opacity: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars3:after {
  content: " ";
  position: absolute;
  top: 4000rpx; /* 替换为rpx */
  width: 8rpx; /* 替换为rpx */
  height: 8rpx; /* 替换为rpx */
  background: transparent;
  box-shadow: 
    3648rpx 2570rpx #FFF, 770rpx 704rpx #FFF, 212rpx 3816rpx #FFF, 3816rpx 1008rpx #FFF;
}

@keyframes animStar {
  from {
    transform: translateY(0rpx); /* 替换为rpx */
  }
  to {
    transform: translateY(-4000rpx); /* 替换为rpx */
  }
}

/* Shooting Star Styles */
.shooting-star {
  position: absolute;
  top: var(--top, 50%);
  left: var(--left, 80%);
  width: calc(240rpx * var(--size, 1)); /* 替换为rpx */
  height: calc(6rpx * var(--size, 1)); /* 替换为rpx */
  background: linear-gradient(90deg, rgba(255, 255, 255, var(--brightness, 1)), transparent);
  animation: shootingStar 8s infinite;
  animation-delay: calc(var(--delay) * 1s);
  opacity: 0;
  z-index: 2;
  filter: blur(calc(2rpx * var(--size, 1))); /* 替换为rpx */
}

@keyframes shootingStar {
  0% {
    transform: translate(0, 0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  2% {
    transform: translate(-40rpx, 40rpx) rotate(-45deg) scale(var(--size, 1)); /* 替换为rpx */
    opacity: var(--brightness, 1);
  }
  8% {
    transform: translate(-400rpx, 400rpx) rotate(-45deg) scale(var(--size, 1)); /* 替换为rpx */
    opacity: 0;
  }
  100% {
    transform: translate(-400rpx, 400rpx) rotate(-45deg) scale(var(--size, 1)); /* 替换为rpx */
    opacity: 0;
  }
}
</style>

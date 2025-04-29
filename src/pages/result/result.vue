<template>
  <view class="container">
    <feedback-btn></feedback-btn>

    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0"></view>
    <view class="shooting-star" style="--delay: 1"></view>
    <view class="shooting-star" style="--delay: 2"></view>
    <view class="shooting-star" style="--delay: 3"></view>

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
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;
  padding: 20px 15px 0; /* Add top/horizontal padding */
  overflow: hidden; /* Hide overflowing stars */
}

.result-card {
  flex: 1;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin: 0 auto 100px; /* Adjust margin, remove top margin */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1; /* Ensure card is above stars */
}

.section-title {
  color: #fff;
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 20px;
  padding: 10px 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  text-align: center;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  line-height: 1.8;
  overflow-y: auto;
  padding: 15px;
  -webkit-overflow-scrolling: touch;
}

.result-content p {
  margin: 12px 0;
}

.result-content strong {
  color: #00a3ff;
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
  z-index: 100;
}

.button-group {
  padding: 15px;
  background: rgba(10, 20, 30, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
}

.nav-btn,
.back-btn {
  width: 95px;
  height: 40px;
  border-radius: 40px;
  color: white;
  font-size: 14px;
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
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 1804px 1265px #fff, 365px 332px #fff, 86px 1888px #fff,
    1888px 484px #fff, 199px 1489px #fff, 1459px 1010px #fff, 807px 388px #fff,
    855px 558px #fff, 83px 1095px #fff, 1418px 377px #fff, 677px 886px #fff,
    862px 1709px #fff, 1058px 1085px #fff, 50px 1772px #fff, 1941px 1544px #fff,
    377px 900px #fff, 184px 712px #fff, 1797px 1928px #fff, 507px 1861px #fff,
    1849px 19px #fff, 1399px 200px #fff, 972px 497px #fff, 795px 1109px #fff,
    746px 970px #fff, 1524px 972px #fff, 1631px 389px #fff, 1026px 1016px #fff,
    1295px 862px #fff, 1258px 1876px #fff, 791px 189px #fff, 1584px 465px #fff,
    865px 932px #fff, 686px 1888px #fff, 1288px 484px #fff, 199px 1489px #fff,
    1459px 1010px #fff, 807px 388px #fff, 855px 558px #fff, 83px 1095px #fff,
    1418px 377px #fff;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 1804px 1265px #fff, 365px 332px #fff, 86px 1888px #fff,
    1888px 484px #fff, 199px 1489px #fff, 1459px 1010px #fff, 807px 388px #fff,
    855px 558px #fff, 83px 1095px #fff, 1418px 377px #fff, 677px 886px #fff,
    862px 1709px #fff, 1058px 1085px #fff, 50px 1772px #fff, 1941px 1544px #fff,
    377px 900px #fff, 184px 712px #fff, 1797px 1928px #fff, 507px 1861px #fff,
    1849px 19px #fff, 1399px 200px #fff, 972px 497px #fff, 795px 1109px #fff,
    746px 970px #fff, 1524px 972px #fff, 1631px 389px #fff, 1026px 1016px #fff,
    1295px 862px #fff, 1258px 1876px #fff, 791px 189px #fff, 1584px 465px #fff,
    865px 932px #fff, 686px 1888px #fff, 1288px 484px #fff, 199px 1489px #fff,
    1459px 1010px #fff, 807px 388px #fff, 855px 558px #fff, 83px 1095px #fff,
    1418px 377px #fff;
}

.stars2 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 1814px 1275px #fff, 375px 342px #fff, 96px 1898px #fff,
    1898px 494px #fff, 1584px 465px #fff, 865px 932px #fff, 686px 1888px #fff,
    1288px 484px #fff, 1399px 200px #fff, 972px 497px #fff, 795px 1109px #fff,
    746px 970px #fff, 1524px 972px #fff, 1631px 389px #fff, 1026px 1016px #fff,
    1295px 862px #fff;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars2:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 1814px 1275px #fff, 375px 342px #fff, 96px 1898px #fff,
    1898px 494px #fff, 1584px 465px #fff, 865px 932px #fff, 686px 1888px #fff,
    1288px 484px #fff, 1399px 200px #fff, 972px 497px #fff, 795px 1109px #fff,
    746px 970px #fff, 1524px 972px #fff, 1631px 389px #fff, 1026px 1016px #fff,
    1295px 862px #fff;
}

.stars3 {
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 1824px 1285px #fff, 385px 352px #fff, 106px 1908px #fff,
    1908px 504px #fff, 1594px 475px #fff, 875px 942px #fff, 696px 1898px #fff,
    1298px 494px #fff;
  animation: animStar 150s linear infinite;
  opacity: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stars3:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 1824px 1285px #fff, 385px 352px #fff, 106px 1908px #fff,
    1908px 504px #fff, 1594px 475px #fff, 875px 942px #fff, 696px 1898px #fff,
    1298px 494px #fff;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}

/* Shooting Star Styles */
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
  z-index: 0; /* Ensure stars are behind card */
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

<template>
	<view class="container">
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
				<button class="nav-btn prev-btn" @click="prevPage" :disabled="currentPage === 0">上一页</button>
				<button class="back-btn" @click="goBack">重新预测</button>
				<button class="nav-btn next-btn" @click="nextPage" :disabled="currentPage === totalPages - 1">下一页</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const prediction = ref('')
const currentPage = ref(0)

// 将内容分成三部分：预测结果、具体建议、分析过程
const contentParts = computed(() => {
	if (!prediction.value) return ['', '', '']
	
	const content = prediction.value
	
	// 提取预测结果部分
	const resultMatch = content.match(/### 预测结果\n([\s\S]*?)(?=### 具体建议|$)/)
	const resultPart = resultMatch ? resultMatch[1] : ''
	
	// 提取具体建议部分
	const adviceMatch = content.match(/### 具体建议\n([\s\S]*?)(?=### 分析过程|$)/)
	const advicePart = adviceMatch ? adviceMatch[1] : ''
	
	// 提取分析过程部分
	const analysisMatch = content.match(/### 分析过程\n([\s\S]*?)$/)
	const analysisPart = analysisMatch ? analysisMatch[1] : ''
	
	return [resultPart, advicePart, analysisPart]
})

// 计算总页数
const totalPages = computed(() => {
	return contentParts.value.filter(part => part.trim() !== '').length
})

// 当前页标题
const currentTitle = computed(() => {
	const titles = ['预测结果', '具体建议', '分析过程']
	return titles[currentPage.value]
})

// 当前页内容 (移除标题和 page-content wrapper)
const currentPageContent = computed(() => {
	if (!prediction.value) return ''
	
	const parts = contentParts.value
	
	// 如果当前页没有内容，返回空字符串
	if (currentPage.value >= parts.length || !parts[currentPage.value].trim()) {
		return ''
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
		.replace(/\s{2,}/g, ' ') // 多余空格
	
	// 只返回 P 标签包裹的内容 HTML
	return content
})

// 格式化内容为HTML
const formattedPrediction = computed(() => {
	if (!prediction.value) return ''
	
	// 将markdown格式转换为HTML
	return prediction.value
		.replace(/### (.*?)\n/g, '<h3 class="section-title">$1</h3>')
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\n/g, '<br>')
})

// 上一页
const prevPage = () => {
	if (currentPage.value > 0) {
		currentPage.value--
	}
}

// 下一页
const nextPage = () => {
	if (currentPage.value < totalPages.value - 1) {
		currentPage.value++
	}
}

// 使用 uni-app 的生命周期钩子
onLoad((options) => {
	if (options.prediction) {
		prediction.value = decodeURIComponent(options.prediction)
	}
})

const goBack = () => {
	uni.navigateBack()
}
</script>

<style>
.container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
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

.nav-btn, .back-btn {
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  10%, 20% {
    transform: translate(-200px, 200px) rotate(-45deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-400px, 400px) rotate(-45deg) scale(0.2);
    opacity: 0;
  }
}
</style> 


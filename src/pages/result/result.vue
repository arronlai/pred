<template>
	<view class="container">
		<view class="result-card">
			<view class="result-title">预测结果</view>
			<view class="result-content">{{ prediction }}</view>
			<button class="back-button" @click="goBack">返回重新预测</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			prediction: ''
		}
	},
	onLoad(options) {
		if (options.prediction) {
			this.prediction = decodeURIComponent(options.prediction)
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style>
.container {
	padding: 20px;
	min-height: 100vh;
	background-color: #F9FAFB;
	display: flex;
	justify-content: center;
	align-items: center;
}

.result-card {
	background-color: #FFFFFF;
	border-radius: 12px;
	padding: 24px;
	width: 90%;
	max-width: 600px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.result-title {
	font-size: 24px;
	font-weight: bold;
	color: #1F2937;
	margin-bottom: 16px;
	text-align: center;
}

.result-content {
	font-size: 18px;
	color: #4B5563;
	line-height: 1.6;
	margin-bottom: 24px;
	text-align: center;
}

.back-button {
	background-color: #8B5CF6;
	color: white;
	border: none;
	padding: 12px 24px;
	border-radius: 6px;
	font-size: 16px;
	width: 100%;
}

.back-button:active {
	background-color: #7C3AED;
}
</style> 

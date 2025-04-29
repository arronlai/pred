<template>
	<view class="feedback-btn" @click="goToFeedback">
		<text class="btn-text">问题</text>
		<text class="btn-text">反馈</text>
	</view>
</template>

<script>
import { checkLogin } from '@/utils/auth.js'

export default {
	name: 'feedback-btn',
	methods: {
		goToFeedback() {
			// 检查是否已登录，未登录则跳转到登录页
			if (checkLogin()) {
				uni.navigateTo({
					url: '/pages/feedback/feedback'
				})
			}
		}
	}
}
</script>

<style>
.feedback-btn {
	position: fixed;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 90rpx;
	height: 100rpx;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: 0 16rpx 16rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
	z-index: 9999;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-left: none;
	backdrop-filter: blur(8rpx);
}

.btn-text {
	color: #fff;
	font-size: 26rpx;
	line-height: 1.2;
}
</style> 

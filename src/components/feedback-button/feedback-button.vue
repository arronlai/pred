<template>
	<view class="feedback-button" @click="goToFeedback">
		<text class="icon">!</text>
	</view>
</template>

<script setup>
const goToFeedback = () => {
	uni.navigateTo({
		url: '/pages/feedback/feedback'
	})
}
</script>

<style>
.feedback-button {
	position: fixed;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 50px;
	height: 50px;
	background-color: #ff0000;
	border-radius: 25px 0 0 25px;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	z-index: 9999;
	transition: all 0.3s;
}

.feedback-button:active {
	background-color: #cc0000;
	transform: translateY(-50%) scale(0.95);
}

.feedback-button .icon {
	color: #fff;
	font-size: 24px;
	font-weight: bold;
}
</style> 

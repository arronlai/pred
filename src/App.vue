<template>
	<view>
		<slot></slot>
		<cover-view class="feedback-button" @click="goToFeedback">
			<cover-view class="icon">!</cover-view>
		</cover-view>
	</view>
</template>

<script>
export default {
	onLaunch: function() {
		console.log('App Launch')
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
	},
	methods: {
		goToFeedback() {
			uni.navigateTo({
				url: '/pages/feedback/feedback'
			})
		}
	}
}
</script>

<style>
/*每个页面公共css */
page {
	background-color: #f5f5f5;
}

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

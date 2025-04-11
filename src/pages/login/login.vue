<template>
	<view class="container">
		<view class="login-card">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<view class="title">答案之数</view>
			<view class="subtitle">探索数字的奥秘</view>
			
			<button class="login-btn" open-type="getUserInfo" @getuserinfo="handleGetUserInfo">
				微信一键登录
			</button>
			
			<view class="agreement">
				登录即代表同意
				<text class="link" @click="showAgreement">《用户协议》</text>
				和
				<text class="link" @click="showPrivacy">《隐私政策》</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

// 获取用户信息
const handleGetUserInfo = async (e) => {
	if (e.detail.errMsg !== 'getUserInfo:ok') {
		uni.showToast({
			title: '登录失败',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({
		title: '登录中...'
	})
	
	try {
		// 获取code
		const loginRes = await uni.login()
		if (loginRes.errMsg !== 'login:ok') {
			throw new Error('获取code失败')
		}
		
		// 调用云函数登录
		const result = await uniCloud.callFunction({
			name: 'login',
			data: {
				code: loginRes.code,
				userInfo: e.detail.userInfo
			}
		})
		
		if (result.result.code === 0) {
			// 登录成功，保存用户信息
			uni.setStorageSync('userInfo', result.result.data.userInfo)
			uni.setStorageSync('token', result.result.data.token)
			
			uni.hideLoading()
			uni.showToast({
				title: '登录成功',
				icon: 'success'
			})
			
			// 返回上一页或首页
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} else {
			throw new Error(result.result.message)
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '登录失败',
			icon: 'none'
		})
	}
}

const showAgreement = () => {
	uni.navigateTo({
		url: '/pages/agreement/agreement?type=user'
	})
}

const showPrivacy = () => {
	uni.navigateTo({
		url: '/pages/agreement/agreement?type=privacy'
	})
}
</script>

<style>
.container {
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
}

.login-card {
	width: 80%;
	max-width: 400px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	padding: 40px 30px;
	text-align: center;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
	width: 80px;
	height: 80px;
	margin-bottom: 20px;
}

.title {
	font-size: 24px;
	color: #fff;
	margin-bottom: 8px;
}

.subtitle {
	font-size: 16px;
	color: rgba(255, 255, 255, 0.7);
	margin-bottom: 40px;
}

.login-btn {
	width: 100%;
	height: 44px;
	background-color: #07C160;
	color: #fff;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	margin-bottom: 20px;
}

.agreement {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.7);
}

.link {
	color: #00a3ff;
}
</style> 

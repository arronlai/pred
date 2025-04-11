<template>
	<view class="container">
		<view class="feedback-form">
			<view class="form-item">
				<text class="label">反馈类型</text>
				<picker @change="bindPickerChange" :value="typeIndex" :range="typeArray">
					<view class="picker">
						{{typeArray[typeIndex]}}
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="label">反馈内容</text>
				<textarea v-model="content" placeholder="请详细描述您遇到的问题或建议" class="textarea" />
			</view>
			
			<view class="form-item">
				<text class="label">联系方式</text>
				<input v-model="contact" placeholder="请留下您的联系方式（选填）" class="input" />
			</view>
			
			<view class="form-item">
				<text class="label">上传截图</text>
				<view class="upload-area">
					<view class="image-list">
						<view class="image-item" v-for="(item, index) in imageList" :key="index">
							<image :src="item" mode="aspectFill" class="preview-image"></image>
							<view class="delete-btn" @click="deleteImage(index)">×</view>
						</view>
						<view class="upload-btn" @click="chooseImage" v-if="imageList.length < 3">
							<text class="upload-icon">+</text>
							<text class="upload-text">上传图片</text>
						</view>
					</view>
				</view>
			</view>
			
			<button class="submit-btn" @click="submitFeedback" :disabled="!content">提交反馈</button>
			
			<view class="contact-tips">
				如需即时沟通，请点击下方按钮联系客服
			</view>
			
			<button class="contact-btn" open-type="contact">
				<text class="iconfont icon-kefu"></text>
				联系客服
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const typeArray = ['问题反馈', '功能建议', '其他']
const typeIndex = ref(0)
const content = ref('')
const contact = ref('')
const imageList = ref([])

const bindPickerChange = (e) => {
	typeIndex.value = e.detail.value
}

const chooseImage = () => {
	uni.chooseImage({
		count: 3 - imageList.value.length,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			imageList.value = [...imageList.value, ...res.tempFilePaths]
		}
	})
}

const deleteImage = (index) => {
	imageList.value.splice(index, 1)
}

const submitFeedback = async () => {
	if (!content.value) {
		uni.showToast({
			title: '请填写反馈内容',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({
		title: '提交中...'
	})
	
	try {
		// 上传图片
		const imageUrls = []
		for (const image of imageList.value) {
			const uploadResult = await uniCloud.uploadFile({
				filePath: image,
				cloudPath: `feedback/${Date.now()}-${Math.random().toString(36).slice(-8)}.jpg`
			})
			imageUrls.push(uploadResult.fileID)
		}
		
		// 获取用户信息
		const userInfo = uni.getStorageSync('userInfo') || null
		
		// 提交反馈
		const result = await uniCloud.callFunction({
			name: 'submitFeedback',
			data: {
				type: typeArray[typeIndex.value],
				content: content.value,
				contact: contact.value,
				images: imageUrls,
				userInfo
			}
		})
		
		// 检查返回结果
		if (result.result && result.result.code === 0) {
			uni.hideLoading()
			uni.showToast({
				title: '提交成功',
				icon: 'success'
			})
			
			// 清空表单
			content.value = ''
			contact.value = ''
			imageList.value = []
			
			// 延迟返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} else {
			throw new Error(result.result?.message || '提交失败')
		}
		
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '提交失败，请重试',
			icon: 'none',
			duration: 2000
		})
		console.error('提交反馈失败：', error)
	}
}
</script>

<style>
.container {
	padding: 20px;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.feedback-form {
	background-color: #fff;
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-item {
	margin-bottom: 20px;
}

.label {
	display: block;
	font-size: 16px;
	color: #333;
	margin-bottom: 8px;
}

.picker {
	height: 40px;
	line-height: 40px;
	background-color: #f8f8f8;
	border-radius: 8px;
	padding: 0 12px;
	color: #333;
}

.textarea {
	width: 100%;
	height: 120px;
	background-color: #f8f8f8;
	border-radius: 8px;
	padding: 12px;
	box-sizing: border-box;
}

.input {
	height: 40px;
	background-color: #f8f8f8;
	border-radius: 8px;
	padding: 0 12px;
}

.upload-area {
	margin-top: 8px;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.image-item {
	position: relative;
	width: 100px;
	height: 100px;
}

.preview-image {
	width: 100%;
	height: 100%;
	border-radius: 8px;
}

.delete-btn {
	position: absolute;
	top: -10px;
	right: -10px;
	width: 24px;
	height: 24px;
	background-color: #ff4d4f;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
}

.upload-btn {
	width: 100px;
	height: 100px;
	background-color: #f8f8f8;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.upload-icon {
	font-size: 24px;
	color: #999;
	margin-bottom: 4px;
}

.upload-text {
	font-size: 12px;
	color: #999;
}

.submit-btn {
	width: 100%;
	height: 44px;
	background-color: #007AFF;
	color: #fff;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	margin-top: 20px;
}

.submit-btn[disabled] {
	background-color: #ccc;
}

.contact-tips {
	font-size: 14px;
	color: #666;
	text-align: center;
	margin: 20px 0;
}

.contact-btn {
	width: 100%;
	height: 44px;
	background-color: #fff;
	color: #333;
	border: 1px solid #ddd;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	margin-top: 10px;
}

.contact-btn .iconfont {
	margin-right: 8px;
	font-size: 18px;
}
</style> 

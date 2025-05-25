<template>
	<view class="container">
		<view class="header">
			<image class="header-bg" src="/static/images/fitness-bg.jpg" mode="aspectFill"></image>
			<view class="header-content">
				<text class="title">个性化健身计划</text>
				<text class="subtitle">根据您的需求定制专属训练方案</text>
			</view>
		</view>
		
		<view class="form-container">
			<!-- 步骤指示器 -->
			<view class="steps">
				<view class="step" v-for="(step, index) in steps" :key="index" :class="{ active: currentStep >= index }">
					<view class="step-number">{{ index + 1 }}</view>
					<text class="step-title">{{ step.title }}</text>
				</view>
			</view>
			
			<!-- 第一步：基本信息 -->
			<view class="step-content" v-if="currentStep === 0">
				<view class="form-group">
					<text class="label required">基本信息</text>
					<view class="input-group">
						<input type="number" v-model="formData.height" placeholder="身高(cm)" />
						<input type="number" v-model="formData.weight" placeholder="体重(kg)" />
						<input type="number" v-model="formData.age" placeholder="年龄" />
					</view>
					
					<view class="radio-group">
						<text class="radio-label required">性别</text>
						<radio-group @change="handleGenderChange">
							<label class="radio-item">
								<radio value="male" :checked="formData.gender === 'male'" color="#4CAF50" />
								<text>男</text>
							</label>
							<label class="radio-item">
								<radio value="female" :checked="formData.gender === 'female'" color="#4CAF50" />
								<text>女</text>
							</label>
						</radio-group>
					</view>
				</view>
			</view>
			
			<!-- 第二步：健身经验 -->
			<view class="step-content" v-if="currentStep === 1">
				<view class="form-group">
					<text class="label">健身经验</text>
					<view class="radio-group">
						<text class="radio-label">健身时长</text>
						<radio-group @change="handleExperienceChange">
							<label class="radio-item" v-for="(exp, index) in experienceLevels" :key="index">
								<radio :value="exp.value" :checked="formData.experience === exp.value" color="#4CAF50" />
								<text>{{ exp.label }}</text>
							</label>
						</radio-group>
					</view>
					
					<view class="checkbox-group">
						<text class="checkbox-label">身体损伤情况</text>
						<checkbox-group @change="handleInjuriesChange">
							<label class="checkbox-item" v-for="(injury, index) in injuries" :key="index">
								<checkbox :value="injury.value" :checked="formData.injuries.includes(injury.value)" color="#4CAF50" />
								<text>{{ injury.label }}</text>
							</label>
						</checkbox-group>
					</view>
				</view>
			</view>
			
			<!-- 第三步：健身目标与器械 -->
			<view class="step-content" v-if="currentStep === 2">
				<view class="form-group">
					<text class="label required">健身目标</text>
					<picker @change="handleGoalChange" :value="goalIndex" :range="fitnessGoals">
						<view class="picker">
							{{ fitnessGoals[goalIndex] }}
						</view>
					</picker>
					
					<view class="radio-group">
						<text class="radio-label required">运动器械</text>
						<radio-group @change="handleEquipmentChange">
							<label class="radio-item" v-for="(venue, index) in venues" :key="index">
								<radio :value="venue.value" :checked="formData.venue === venue.value" color="#4CAF50" />
								<text>{{ venue.label }}</text>
							</label>
						</radio-group>
					</view>
					
					<view class="radio-group">
						<text class="radio-label required">计划周期</text>
						<radio-group @change="handleDurationChange">
							<label class="radio-item" v-for="(duration, index) in durations" :key="index">
								<radio :value="duration.value" :checked="formData.planDuration === duration.value" color="#4CAF50" />
								<text>{{ duration.label }}</text>
							</label>
						</radio-group>
					</view>
				</view>
			</view>
			
			<!-- 导航按钮 -->
			<view class="navigation-buttons">
				<button class="nav-btn prev" v-if="currentStep > 0" @click="prevStep">上一步</button>
				<button class="nav-btn next" v-if="currentStep < steps.length - 1" @click="nextStep">下一步</button>
				<button class="nav-btn submit" v-if="currentStep === steps.length - 1" @click="generatePlan" :disabled="isGenerating">
					<text v-if="!isGenerating">生成健身计划</text>
					<view v-else class="loading-container">
						<view class="loading-spinner"></view>
						<text>正在生成中...</text>
					</view>
				</button>
			</view>
		</view>
		
		<!-- 加载遮罩 -->
		<view class="loading-mask" v-if="isGenerating">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">正在生成您的专属健身计划...</text>
				<text class="loading-tips">这可能需要一点时间，请耐心等待</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentStep: 0,
			steps: [
				{ title: '基本信息' },
				{ title: '健身经验' },
				{ title: '目标与器械' }
			],
			formData: {
				height: '',
				weight: '',
				age: '',
				gender: 'male',
				experience: 'beginner',
				injuries: [],
				fitnessGoal: 'weight_loss',
				venue: 'gym',
				isBodyweight: false,
				planDuration: 'month'
			},
			fitnessGoals: ['减脂', '增肌', '保持健康', '提高力量', '改善体态'],
			goalIndex: 0,
			experienceLevels: [
				{ label: '新手（0-6个月）', value: 'beginner' },
				{ label: '进阶（6个月-2年）', value: 'intermediate' },
				{ label: '老手（2年以上）', value: 'advanced' }
			],
			injuries: [
				{ label: '膝关节', value: 'knee' },
				{ label: '腰部', value: 'back' },
				{ label: '肩部', value: 'shoulder' },
				{ label: '手腕', value: 'wrist' }
			],
			venues: [
				{ label: '器械丰富（健身房）', value: 'gym' },
				{ label: '少量器械（居家）', value: 'home' },
				{ label: '徒手健身', value: 'bodyweight' }
			],
			durations: [
				{ label: '一个月', value: 'month' },
				{ label: '三个月', value: 'quarter' },
				{ label: '半年', value: 'half_year' }
			],
			isGenerating: false,
			loadingTimer: null,
			loadingDots: ''
		}
	},
	methods: {
		handleGenderChange(e) {
			this.formData.gender = e.detail.value;
		},
		handleExperienceChange(e) {
			this.formData.experience = e.detail.value;
		},
		handleGoalChange(e) {
			this.goalIndex = e.detail.value;
			const goalMap = {
				0: 'weight_loss',
				1: 'muscle_gain',
				2: 'health',
				3: 'strength',
				4: 'posture'
			};
			this.formData.fitnessGoal = goalMap[this.goalIndex];
		},
		handleInjuriesChange(e) {
			this.formData.injuries = e.detail.value;
		},
		handleEquipmentChange(e) {
			const value = e.detail.value;
			this.formData.venue = value;
			this.formData.isBodyweight = value === 'bodyweight';
		},
		handleDurationChange(e) {
			this.formData.planDuration = e.detail.value;
		},
		nextStep() {
			if (this.currentStep < this.steps.length - 1) {
				this.currentStep++;
			}
		},
		prevStep() {
			if (this.currentStep > 0) {
				this.currentStep--;
			}
		},
		async generatePlan() {
			// 检查必填信息
			const requiredFields = ['height', 'weight', 'age', 'gender', 'fitnessGoal', 'venue', 'planDuration'];
			const missingFields = requiredFields.filter(field => !this.formData[field]);
			
			if (missingFields.length > 0) {
				uni.showModal({
					title: '提示',
					content: '部分必填信息未填写，生成的计划可能不够准确，是否继续？',
					success: (res) => {
						if (res.confirm) {
							this.submitPlan();
						}
					}
				});
			} else {
				this.submitPlan();
			}
		},
		async submitPlan() {
			try {
				this.isGenerating = true;
				this.startLoadingAnimation();
				
				// 设置超时处理
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => {
						reject(new Error('请求超时，请稍后重试'));
					}, 180000); // 180秒超时
				});
				
				const result = await Promise.race([
					uniCloud.callFunction({
						name: 'generateFitnessPlan',
						data: {
							...this.formData,
							userId: uni.getStorageSync('userId')
						}
					}),
					timeoutPromise
				]);
				
				if (result.result.code === 0) {
					uni.navigateTo({
						url: '/pages/result/result?planId=' + result.result.data.planId
					});
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				uni.showModal({
					title: '生成失败',
					content: error.message || '生成计划失败，请稍后重试',
					showCancel: false
				});
			} finally {
				this.stopLoadingAnimation();
				this.isGenerating = false;
			}
		},
		
		startLoadingAnimation() {
			this.loadingTimer = setInterval(() => {
				this.loadingDots = this.loadingDots.length >= 3 ? '' : this.loadingDots + '.';
			}, 500);
		},
		
		stopLoadingAnimation() {
			if (this.loadingTimer) {
				clearInterval(this.loadingTimer);
				this.loadingTimer = null;
			}
		}
	},
	beforeDestroy() {
		this.stopLoadingAnimation();
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.header {
	position: relative;
	height: 360rpx;
	overflow: hidden;
	
	.header-bg {
		width: 100%;
		height: 100%;
		filter: brightness(0.7);
	}
	
	.header-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: #ffffff;
		
		.title {
			font-size: 48rpx;
			font-weight: bold;
			margin-bottom: 24rpx;
			text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		}
		
		.subtitle {
			font-size: 32rpx;
			opacity: 0.9;
		}
	}
}

.form-container {
	padding: 40rpx 30rpx;
	margin-top: -60rpx;
	background-color: #ffffff;
	border-radius: 40rpx 40rpx 0 0;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.steps {
	display: flex;
	justify-content: space-between;
	margin-bottom: 48rpx;
	padding: 0 20rpx;
	
	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		flex: 1;
		
		&:not(:last-child)::after {
			content: '';
			position: absolute;
			top: 24rpx;
			right: -50%;
			width: 100%;
			height: 2rpx;
			background-color: #e0e0e0;
			z-index: 1;
		}
		
		&.active {
			.step-number {
				background-color: #4CAF50;
				color: #ffffff;
			}
			
			.step-title {
				color: #4CAF50;
			}
			
			&::after {
				background-color: #4CAF50;
			}
		}
		
		.step-number {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			background-color: #e0e0e0;
			color: #666;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28rpx;
			margin-bottom: 16rpx;
			position: relative;
			z-index: 2;
		}
		
		.step-title {
			font-size: 24rpx;
			color: #666;
		}
	}
}

.step-content {
	margin-bottom: 48rpx;
}

.form-group {
	margin-bottom: 48rpx;
	
	.label {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 24rpx;
		display: block;
		
		&.required::after {
			content: '*';
			color: #ff4d4f;
			margin-left: 8rpx;
		}
	}
}

.input-group {
	display: flex;
	gap: 24rpx;
	
	input {
		flex: 1;
		height: 88rpx;
		padding: 0 24rpx;
		border: 2rpx solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 30rpx;
		background-color: #f8f8f8;
		
		&:focus {
			border-color: #4CAF50;
			background-color: #ffffff;
		}
	}
}

.radio-group, .checkbox-group {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-top: 16rpx;
}

.radio-item, .checkbox-item {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	color: #333;
	padding: 16rpx 0;
	
	text {
		margin-left: 8rpx;
	}
}

.radio-label, .checkbox-label {
	font-size: 30rpx;
	color: #666;
	margin-bottom: 16rpx;
	display: block;
	
	&.required::after {
		content: '*';
		color: #ff4d4f;
		margin-left: 8rpx;
	}
}

.picker {
	height: 88rpx;
	line-height: 88rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 30rpx;
	background-color: #f8f8f8;
}

.navigation-buttons {
	display: flex;
	justify-content: space-between;
	gap: 24rpx;
	margin-top: 48rpx;
	
	.nav-btn {
		flex: 1;
		height: 96rpx;
		line-height: 96rpx;
		font-size: 32rpx;
		border-radius: 48rpx;
		
		&.prev {
			background-color: #f5f5f5;
			color: #666;
		}
		
		&.next, &.submit {
			background: linear-gradient(135deg, #4CAF50, #45a049);
			color: #ffffff;
			font-weight: bold;
			box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
			
			&:active {
				transform: translateY(2rpx);
				box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.3);
			}
			
			&:disabled {
				opacity: 0.8;
				background: linear-gradient(135deg, #9E9E9E, #757575);
				box-shadow: none;
			}
		}
	}
}

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	
	.loading-spinner {
		width: 36rpx;
		height: 36rpx;
		border: 4rpx solid #ffffff;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	text {
		font-size: 28rpx;
		color: #ffffff;
	}
}

.loading-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	
	.loading-content {
		text-align: center;
		padding: 40rpx;
		
		.loading-spinner {
			width: 80rpx;
			height: 80rpx;
			border: 6rpx solid #4CAF50;
			border-top-color: transparent;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin: 0 auto 24rpx;
		}
		
		.loading-text {
			font-size: 32rpx;
			color: #333;
			margin-bottom: 16rpx;
			display: block;
		}
		
		.loading-tips {
			font-size: 26rpx;
			color: #666;
			display: block;
		}
	}
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>

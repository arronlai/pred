<template>
	<view class="container">
		<view class="header">
			<image class="header-bg" src="/static/images/fitness-bg.jpg" mode="aspectFill"></image>
			<view class="header-content">
				<text class="title">个性化健身计划</text>
				<text class="subtitle">根据您的需求定制专属训练方案</text>
			</view>
			<view class="user-info" @click="showUserMenu">
				<image class="avatar" :src="userInfo.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
			</view>
		</view>
		
		<!-- 用户菜单 -->
		<uni-popup ref="userMenuPopup" type="bottom">
			<view class="user-menu">
				<view class="menu-item" @click="viewHistoryPlans">
					<text class="menu-icon">📋</text>
					<text>历史计划</text>
				</view>
				<view class="menu-item" @click="handleLogout">
					<text class="menu-icon">🚪</text>
					<text>退出登录</text>
				</view>
			</view>
		</uni-popup>
		
		<!-- 历史计划列表 -->
		<uni-popup ref="historyPopup" type="bottom">
			<view class="history-list">
				<view class="history-header">
					<text class="history-title">历史计划</text>
					<text class="close-btn" @click="closeHistory">×</text>
				</view>
				<scroll-view class="history-content" scroll-y>
					<view v-if="historyPlans.length === 0" class="empty-tip">
						<text>暂无历史计划</text>
					</view>
					<view v-else class="plan-item" v-for="plan in historyPlans" :key="plan._id" @click="viewPlan(plan._id)">
						<view class="plan-info">
							<text class="plan-date">{{ formatDate(plan.createdAt) }}</text>
							<text class="plan-goal">{{ getGoalText(plan.userInfo.fitnessGoal) }}</text>
						</view>
						<text class="arrow">></text>
					</view>
				</scroll-view>
			</view>
		</uni-popup>
		
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
					<radio-group @change="handleGoalChange" class="radio-group">
						<label v-for="(goal, index) in fitnessGoals" :key="index" class="radio-item">
							<radio :value="goal" :checked="formData.fitnessGoal === goal" color="#007AFF" />
							<text>{{ goal }}</text>
						</label>
					</radio-group>
				</view>
				
				<view class="form-group">
					<text class="label required">训练场地</text>
					<radio-group @change="handleEquipmentChange" class="radio-group">
						<label v-for="(venue, index) in venues" :key="index" class="radio-item">
							<radio :value="venue.value" :checked="formData.venue === venue.value" color="#007AFF" />
							<text>{{ venue.label }}</text>
						</label>
					</radio-group>
				</view>
				
				<view class="form-group">
					<text class="label required">每周训练天数</text>
					<radio-group @change="handleWeeklyDaysChange" class="radio-group">
						<label v-for="(option, index) in weeklyDaysOptions" :key="index" class="radio-item">
							<radio :value="option.value" :checked="formData.weeklyDays === option.value" color="#007AFF" />
							<text>{{ option.label }}</text>
						</label>
					</radio-group>
				</view>
				
				<view class="form-group">
					<text class="label required">每天训练时长</text>
					<radio-group @change="handleDailyDurationChange" class="radio-group">
						<label v-for="(option, index) in dailyDurationOptions" :key="index" class="radio-item">
							<radio :value="option.value" :checked="formData.dailyDuration === option.value" color="#007AFF" />
							<text>{{ option.label }}</text>
						</label>
					</radio-group>
				</view>
				
				<view class="form-group">
					<text class="label required">计划时长</text>
					<radio-group @change="handleDurationChange" class="radio-group">
						<label v-for="(duration, index) in planDurations" :key="index" class="radio-item">
							<radio :value="duration.value" :checked="formData.planDuration === duration.value" color="#007AFF" />
							<text>{{ duration.label }}</text>
						</label>
					</radio-group>
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
				customInjury: '',
				fitnessGoal: 'weight_loss',
				venue: 'gym',
				isBodyweight: false,
				planDuration: 'month',
				weeklyDays: 3,
				dailyDuration: 60
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
				{ label: '手腕', value: 'wrist' },
				{ label: '手肘', value: 'elbow' },
				{ label: '踝关节', value: 'ankle' },
				{ label: '其他', value: 'other' }
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
			weeklyDaysOptions: [
				{ label: '2天', value: 2 },
				{ label: '3天', value: 3 },
				{ label: '4天', value: 4 },
				{ label: '5天', value: 5 },
				{ label: '6天', value: 6 }
			],
			dailyDurationOptions: [
				{ label: '30分钟', value: 30 },
				{ label: '45分钟', value: 45 },
				{ label: '60分钟', value: 60 },
				{ label: '90分钟', value: 90 },
				{ label: '120分钟', value: 120 }
			],
			isGenerating: false,
			loadingTimer: null,
			loadingDots: '',
			userInfo: {},
			historyPlans: []
		}
	},
	onLoad() {
		// 检查登录状态
		const userId = uni.getStorageSync('userId');
		if (!userId) {
			uni.redirectTo({
				url: '/pages/login/login'
			});
			return;
		}
		
		// 获取用户信息
		this.userInfo = uni.getStorageSync('userInfo') || {};
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
			const values = e.detail.value;
			this.formData.injuries = values.filter(v => v !== 'other');
			if (values.includes('other')) {
				uni.showModal({
					title: '请输入具体损伤部位',
					editable: true,
					placeholderText: '请输入具体损伤部位',
					success: (res) => {
						if (res.confirm && res.content) {
							this.formData.customInjury = res.content;
						}
					}
				});
			}
		},
		handleEquipmentChange(e) {
			const value = e.detail.value;
			this.formData.venue = value;
			this.formData.isBodyweight = value === 'bodyweight';
		},
		handleDurationChange(e) {
			this.formData.planDuration = e.detail.value;
		},
		handleWeeklyDaysChange(e) {
			this.formData.weeklyDays = parseInt(e.detail.value);
		},
		handleDailyDurationChange(e) {
			this.formData.dailyDuration = parseInt(e.detail.value);
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
				
				// 处理自定义损伤
				const injuries = [...this.formData.injuries];
				if (this.formData.customInjury) {
					injuries.push(this.formData.customInjury);
				}
				
				const result = await Promise.race([
					uniCloud.callFunction({
						name: 'generateFitnessPlan',
						data: {
							...this.formData,
							injuries,
							userId: uni.getStorageSync('userId')
						}
					}),
					new Promise((_, reject) => {
						setTimeout(() => {
							reject(new Error('请求超时，请稍后重试'));
						}, 180000);
					})
				]);
				
				if (result.result.code === 0) {
					uni.navigateTo({
						url: '/pages/result/result?planId=' + result.result.data.planId
					});
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				console.error('生成计划失败：', error);
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
		},
		
		showUserMenu() {
			this.$refs.userMenuPopup.open();
		},
		
		async viewHistoryPlans() {
			try {
				const result = await uniCloud.callFunction({
					name: 'getUserPlans'
				});
				
				if (result.result.code === 0) {
					this.historyPlans = result.result.data;
					this.$refs.historyPopup.open();
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				console.error('获取历史计划失败：', error);
				uni.showToast({
					title: '获取历史计划失败',
					icon: 'none'
				});
			}
		},
		
		viewPlan(planId) {
			uni.navigateTo({
				url: `/pages/result/result?planId=${planId}`
			});
			this.closeHistory();
		},
		
		closeHistory() {
			this.$refs.historyPopup.close();
		},
		
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除用户信息
						uni.removeStorageSync('userId');
						uni.removeStorageSync('userInfo');
						
						// 跳转到登录页
						uni.redirectTo({
							url: '/pages/login/login'
						});
					}
				}
			});
		},
		
		formatDate(date) {
			const d = new Date(date);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		},
		
		getGoalText(goal) {
			const goalMap = {
				'weight_loss': '减脂',
				'muscle_gain': '增肌',
				'health': '保持健康',
				'strength': '提高力量',
				'posture': '改善体态'
			};
			return goalMap[goal] || goal;
		}
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
	
	.user-info {
		position: absolute;
		top: 40rpx;
		right: 40rpx;
		z-index: 10;
		
		.avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			border: 4rpx solid rgba(255, 255, 255, 0.8);
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

.user-menu {
	background-color: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	padding: 32rpx;
	
	.menu-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 2rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.menu-icon {
			font-size: 36rpx;
			margin-right: 16rpx;
		}
		
		text {
			font-size: 32rpx;
			color: #333333;
		}
	}
}

.history-list {
	background-color: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	height: 800rpx;
	
	.history-header {
		padding: 32rpx;
		border-bottom: 2rpx solid #f0f0f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		
		.history-title {
			font-size: 36rpx;
			font-weight: bold;
			color: #333333;
		}
		
		.close-btn {
			font-size: 48rpx;
			color: #999999;
			padding: 0 16rpx;
		}
	}
	
	.history-content {
		height: calc(100% - 100rpx);
		padding: 0 32rpx;
		
		.empty-tip {
			text-align: center;
			padding: 100rpx 0;
			color: #999999;
			font-size: 28rpx;
		}
		
		.plan-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx 0;
			border-bottom: 2rpx solid #f0f0f0;
			
			.plan-info {
				.plan-date {
					font-size: 28rpx;
					color: #666666;
					margin-bottom: 8rpx;
					display: block;
				}
				
				.plan-goal {
					font-size: 32rpx;
					color: #333333;
					font-weight: bold;
				}
			}
			
			.arrow {
				font-size: 36rpx;
				color: #999999;
			}
		}
	}
}
</style>

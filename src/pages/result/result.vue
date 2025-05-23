<template>
	<view class="container">
		<view class="header">
			<text class="title">您的专属健身计划</text>
			<text class="subtitle">根据您的需求定制</text>
		</view>
		
		<view class="plan-container" v-if="!isLoading && plan">
			<view class="section">
				<view class="section-title">
					<text class="icon">💪</text>
					<text>训练计划</text>
				</view>
				<view class="weekly-plan">
					<view class="day-plan" v-for="(day, index) in weeklyPlan" :key="index">
						<view class="day-header">
							<text class="day-title">{{ day.day }}</text>
							<text class="day-focus">{{ day.focus }}</text>
						</view>
						<view class="exercises">
							<view class="exercise" v-for="(exercise, eIndex) in day.exercises" :key="eIndex">
								<text class="exercise-name">{{ exercise.name }}</text>
								<view class="exercise-details">
									<text class="detail-item">{{ exercise.sets }}组 × {{ exercise.reps }}次</text>
									<text class="detail-item">休息{{ exercise.restTime }}秒</text>
									<text class="detail-item">目标：{{ exercise.targetMuscle }}</text>
								</view>
								<text class="exercise-notes">{{ exercise.notes }}</text>
							</view>
						</view>
						<view class="day-footer">
							<text class="duration">训练时长：{{ day.duration }}</text>
							<text class="notes">注意事项：{{ day.notes }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<view class="section">
				<view class="section-title">
					<text class="icon">🥗</text>
					<text>营养建议</text>
				</view>
				<view class="nutrition-info">
					<view class="nutrition-item">
						<text class="nutrition-label">每日卡路里</text>
						<text class="nutrition-value">{{ nutritionAdvice.dailyCalories }}</text>
					</view>
					<view class="nutrition-item">
						<text class="nutrition-label">蛋白质</text>
						<text class="nutrition-value">{{ nutritionAdvice.protein }}</text>
					</view>
					<view class="nutrition-item">
						<text class="nutrition-label">碳水化合物</text>
						<text class="nutrition-value">{{ nutritionAdvice.carbs }}</text>
					</view>
					<view class="nutrition-item">
						<text class="nutrition-label">脂肪</text>
						<text class="nutrition-value">{{ nutritionAdvice.fats }}</text>
					</view>
				</view>
				<view class="diet-tips">
					<text class="tips-title">具体饮食建议</text>
					<view class="tip-item" v-for="(tip, index) in nutritionAdvice.dietTips" :key="index">
						<text class="tip-dot">•</text>
						<text class="tip-text">{{ tip }}</text>
					</view>
				</view>
			</view>
			
			<view class="section">
				<view class="section-title">
					<text class="icon">💤</text>
					<text>恢复建议</text>
				</view>
				<view class="recovery-tips">
					<view class="tip-group">
						<text class="group-title">休息时间安排</text>
						<view class="tip-item" v-for="(tip, index) in recoveryTips.restSchedule" :key="index">
							<text class="tip-dot">•</text>
							<text class="tip-text">{{ tip }}</text>
						</view>
					</view>
					<view class="tip-group">
						<text class="group-title">拉伸建议</text>
						<view class="tip-item" v-for="(tip, index) in recoveryTips.stretching" :key="index">
							<text class="tip-dot">•</text>
							<text class="tip-text">{{ tip }}</text>
						</view>
					</view>
					<view class="tip-group">
						<text class="group-title">注意事项</text>
						<view class="tip-item" v-for="(tip, index) in recoveryTips.notes" :key="index">
							<text class="tip-dot">•</text>
							<text class="tip-text">{{ tip }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="loading" v-if="isLoading">
			<view class="loading-spinner"></view>
			<text>加载中...</text>
		</view>
		
		<view class="error" v-if="!isLoading && !plan">
			<text>加载失败，请重试</text>
		</view>
		
		<view class="action-buttons">
			<button class="share-btn" @click="sharePlan">分享计划</button>
			<button class="save-btn" @click="savePlan">保存计划</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			plan: null,
			planId: '',
			isLoading: true
		}
	},
	computed: {
		weeklyPlan() {
			if (!this.plan?.workoutPlan?.weeklyPlan) return [];
			return this.plan.workoutPlan.weeklyPlan;
		},
		nutritionAdvice() {
			if (!this.plan?.nutritionAdvice) return {};
			return this.plan.nutritionAdvice;
		},
		recoveryTips() {
			if (!this.plan?.recoveryTips) return {};
			return this.plan.recoveryTips;
		}
	},
	onLoad(options) {
		console.log('Result page options:', options);
		if (options.planId) {
			this.planId = options.planId;
			this.loadPlan();
		} else {
			this.isLoading = false;
			uni.showToast({
				title: '计划ID不存在',
				icon: 'none'
			});
		}
	},
	methods: {
		async loadPlan() {
			try {
				const result = await uniCloud.callFunction({
					name: 'getFitnessPlan',
					data: {
						planId: this.planId
					}
				});
				
				if (result.result.code === 0) {
					this.plan = result.result.data;
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				uni.showToast({
					title: error.message || '加载计划失败',
					icon: 'none'
				});
			} finally {
				this.isLoading = false;
			}
		},
		sharePlan() {
			uni.showShareMenu({
				withShareTicket: true,
				menus: ['shareAppMessage', 'shareTimeline']
			});
		},
		async savePlan() {
			try {
				uni.showLoading({
					title: '保存中...'
				});
				
				const result = await uniCloud.callFunction({
					name: 'saveFitnessPlan',
					data: {
						planId: this.planId
					}
				});
				
				if (result.result.code === 0) {
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					});
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
			}
		}
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 120rpx;
}

.header {
	padding: 40rpx 30rpx;
	background: linear-gradient(135deg, #4CAF50, #45a049);
	color: #ffffff;
	text-align: center;
	
	.title {
		font-size: 40rpx;
		font-weight: bold;
		margin-bottom: 16rpx;
		display: block;
	}
	
	.subtitle {
		font-size: 28rpx;
		opacity: 0.9;
	}
}

.plan-container {
	padding: 30rpx;
}

.section {
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	
	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		
		.icon {
			font-size: 40rpx;
			margin-right: 20rpx;
		}
		
		text {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
}

.weekly-plan {
	.day-plan {
		margin-bottom: 40rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.day-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 24rpx;
			
			.day-title {
				font-size: 30rpx;
				font-weight: bold;
				color: #333;
			}
			
			.day-focus {
				font-size: 26rpx;
				color: #666;
				background-color: #f0f0f0;
				padding: 8rpx 24rpx;
				border-radius: 20rpx;
			}
		}
		
		.exercises {
			.exercise {
				background-color: #f8f8f8;
				padding: 24rpx;
				border-radius: 12rpx;
				margin-bottom: 16rpx;
				
				&:last-child {
					margin-bottom: 0;
				}
				
				.exercise-name {
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 12rpx;
					display: block;
				}
				
				.exercise-details {
					display: flex;
					flex-wrap: wrap;
					gap: 16rpx;
					margin: 12rpx 0;
					
					.detail-item {
						font-size: 26rpx;
						color: #666;
						background-color: #f0f0f0;
						padding: 4rpx 16rpx;
						border-radius: 8rpx;
					}
				}
				
				.exercise-notes {
					font-size: 26rpx;
					color: #999;
					line-height: 1.5;
				}
			}
		}
		
		.day-footer {
			margin-top: 20rpx;
			padding-top: 20rpx;
			border-top: 2rpx solid #f0f0f0;
			
			.duration, .notes {
				font-size: 26rpx;
				color: #666;
				display: block;
				margin-bottom: 8rpx;
				
				&:last-child {
					margin-bottom: 0;
				}
			}
		}
	}
}

.nutrition-info {
	.nutrition-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 2rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.nutrition-label {
			font-size: 28rpx;
			color: #333;
		}
		
		.nutrition-value {
			font-size: 28rpx;
			color: #4CAF50;
			font-weight: bold;
		}
	}
}

.diet-tips {
	margin-top: 40rpx;
	padding-top: 30rpx;
	border-top: 2rpx solid #f0f0f0;
	
	.tips-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 24rpx;
		display: block;
	}
	
	.tip-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 20rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.tip-dot {
			color: #4CAF50;
			margin-right: 12rpx;
			font-size: 32rpx;
		}
		
		.tip-text {
			font-size: 28rpx;
			color: #666;
			line-height: 1.5;
		}
	}
}

.recovery-tips {
	.tip-group {
		margin-bottom: 40rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.group-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 24rpx;
			display: block;
		}
		
		.tip-item {
			display: flex;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.tip-dot {
				color: #4CAF50;
				margin-right: 12rpx;
				font-size: 32rpx;
			}
			
			.tip-text {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
			}
		}
	}
}

.loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	
	.loading-spinner {
		width: 60rpx;
		height: 60rpx;
		border: 6rpx solid #4CAF50;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 24rpx;
	}
	
	text {
		color: #666;
		font-size: 28rpx;
	}
}

.error {
	text-align: center;
	padding: 100rpx 0;
	color: #ff4d4f;
	font-size: 28rpx;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.action-buttons {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx 30rpx;
	background-color: #ffffff;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	display: flex;
	gap: 24rpx;
	
	button {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		font-size: 32rpx;
		border-radius: 44rpx;
		
		&.share-btn {
			background-color: #4CAF50;
			color: #ffffff;
		}
		
		&.save-btn {
			background-color: #f0f0f0;
			color: #333;
		}
	}
}
</style>

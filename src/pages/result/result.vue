<template>
	<view class="container">
		<view class="header">
			<text class="title">您的专属健身计划</text>
			<text class="subtitle">根据您的需求定制</text>
		</view>
		
		<!-- 用户信息概览 -->
		<view class="user-overview">
			<view class="overview-item">
				<text class="label">基本信息</text>
				<view class="info-grid">
					<view class="info-item">
						<text class="info-label">身高</text>
						<text class="info-value">{{ plan.userInfo.height }}cm</text>
					</view>
					<view class="info-item">
						<text class="info-label">体重</text>
						<text class="info-value">{{ plan.userInfo.weight }}kg</text>
					</view>
					<view class="info-item">
						<text class="info-label">年龄</text>
						<text class="info-value">{{ plan.userInfo.age }}岁</text>
					</view>
					<view class="info-item">
						<text class="info-label">性别</text>
						<text class="info-value">{{ plan.userInfo.gender === 'male' ? '男' : '女' }}</text>
					</view>
				</view>
			</view>
			
			<view class="overview-item">
				<text class="label">健身目标</text>
				<view class="goal-info">
					<text class="goal-text">{{ getGoalText(plan.userInfo.fitnessGoal) }}</text>
					<text class="goal-detail">每周{{ plan.userInfo.weeklyDays }}天，每天{{ plan.userInfo.dailyDuration }}分钟</text>
				</view>
			</view>
			
			<view class="overview-item" v-if="plan.userInfo.injuries && plan.userInfo.injuries.length > 0">
				<text class="label">身体损伤</text>
				<view class="injuries-list">
					<text class="injury-item" v-for="(injury, index) in plan.userInfo.injuries" :key="index">{{ injury }}</text>
				</view>
			</view>
		</view>
		
		<!-- 训练计划 -->
		<view class="section">
			<text class="section-title">训练计划</text>
			<view class="weekly-plan">
				<view class="day-plan" v-for="(day, index) in weeklyPlan" :key="index">
					<view class="day-header">
						<text class="day-name">{{ day.day }}</text>
						<text class="day-focus">{{ day.focus }}</text>
					</view>
					
					<view class="exercises">
						<view class="exercise-item" v-for="(exercise, eIndex) in day.exercises" :key="eIndex">
							<view class="exercise-header">
								<text class="exercise-name">{{ exercise.name }}</text>
								<text class="exercise-target">{{ exercise.targetMuscle }}</text>
							</view>
							<view class="exercise-details">
								<text class="detail-item">{{ exercise.sets }}组</text>
								<text class="detail-item">{{ exercise.reps }}次</text>
								<text class="detail-item">休息{{ exercise.restTime }}秒</text>
							</view>
							<text class="exercise-notes" v-if="exercise.notes">{{ exercise.notes }}</text>
						</view>
					</view>
					
					<view class="day-footer">
						<text class="duration">训练时长：{{ day.duration }}</text>
						<text class="notes" v-if="day.notes">{{ day.notes }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 营养建议 -->
		<view class="section">
			<text class="section-title">营养建议</text>
			<view class="nutrition-info">
				<view class="nutrition-item">
					<text class="nutrition-label">每日热量</text>
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
				<text class="tips-title">饮食建议</text>
				<view class="tip-item" v-for="(tip, index) in nutritionAdvice.dietTips" :key="index">
					<text class="tip-dot">•</text>
					<text class="tip-text">{{ tip }}</text>
				</view>
			</view>
		</view>
		
		<!-- 恢复建议 -->
		<view class="section">
			<text class="section-title">恢复建议</text>
			<view class="recovery-content">
				<view class="recovery-section">
					<text class="recovery-title">休息安排</text>
					<view class="tip-item" v-for="(tip, index) in recoveryTips.restSchedule" :key="index">
						<text class="tip-dot">•</text>
						<text class="tip-text">{{ tip }}</text>
					</view>
				</view>
				
				<view class="recovery-section">
					<text class="recovery-title">拉伸动作</text>
					<view class="tip-item" v-for="(tip, index) in recoveryTips.stretching" :key="index">
						<text class="tip-dot">•</text>
						<text class="tip-text">{{ tip }}</text>
					</view>
				</view>
				
				<view class="recovery-section">
					<text class="recovery-title">注意事项</text>
					<view class="tip-item" v-for="(tip, index) in recoveryTips.notes" :key="index">
						<text class="tip-dot">•</text>
						<text class="tip-text">{{ tip }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			plan: {
				userInfo: {},
				workoutPlan: {},
				nutritionAdvice: {},
				recoveryTips: {}
			},
			isLoading: true
		}
	},
	computed: {
		weeklyPlan() {
			return this.plan.workoutPlan?.weeklyPlan || [];
		},
		nutritionAdvice() {
			return this.plan.nutritionAdvice || {};
		},
		recoveryTips() {
			return this.plan.recoveryTips || {};
		}
	},
	onLoad(options) {
		if (options.planId) {
			this.loadPlan(options.planId);
		}
	},
	methods: {
		async loadPlan(planId) {
			try {
				this.isLoading = true;
				const result = await uniCloud.callFunction({
					name: 'getPlan',
					data: { planId }
				});
				
				if (result.result.code === 0) {
					this.plan = result.result.data;
				} else {
					throw new Error(result.result.message);
				}
			} catch (error) {
				console.error('加载计划失败：', error);
				uni.showToast({
					title: '加载计划失败',
					icon: 'none'
				});
			} finally {
				this.isLoading = false;
			}
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
	padding-bottom: 40rpx;
}

.header {
	background: linear-gradient(135deg, #4CAF50, #45a049);
	padding: 60rpx 40rpx;
	text-align: center;
	color: #ffffff;
	
	.title {
		font-size: 48rpx;
		font-weight: bold;
		margin-bottom: 16rpx;
		display: block;
	}
	
	.subtitle {
		font-size: 32rpx;
		opacity: 0.9;
	}
}

.user-overview {
	background-color: #ffffff;
	margin: 20rpx;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.overview-item {
		margin-bottom: 32rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.label {
			font-size: 32rpx;
			font-weight: bold;
			color: #333333;
			margin-bottom: 16rpx;
			display: block;
		}
	}
	
	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;
		
		.info-item {
			background-color: #f8f8f8;
			padding: 16rpx;
			border-radius: 12rpx;
			
			.info-label {
				font-size: 26rpx;
				color: #666666;
				margin-bottom: 8rpx;
				display: block;
			}
			
			.info-value {
				font-size: 32rpx;
				color: #333333;
				font-weight: bold;
			}
		}
	}
	
	.goal-info {
		background-color: #f8f8f8;
		padding: 24rpx;
		border-radius: 12rpx;
		
		.goal-text {
			font-size: 32rpx;
			color: #333333;
			font-weight: bold;
			margin-bottom: 8rpx;
			display: block;
		}
		
		.goal-detail {
			font-size: 26rpx;
			color: #666666;
		}
	}
	
	.injuries-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		
		.injury-item {
			background-color: #f8f8f8;
			padding: 12rpx 24rpx;
			border-radius: 24rpx;
			font-size: 26rpx;
			color: #666666;
		}
	}
}

.section {
	background-color: #ffffff;
	margin: 20rpx;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.section-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 24rpx;
		display: block;
	}
}

.weekly-plan {
	.day-plan {
		margin-bottom: 32rpx;
		padding: 24rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.day-header {
			margin-bottom: 16rpx;
			
			.day-name {
				font-size: 32rpx;
				font-weight: bold;
				color: #333333;
				margin-right: 16rpx;
			}
			
			.day-focus {
				font-size: 28rpx;
				color: #666666;
			}
		}
		
		.exercises {
			.exercise-item {
				margin-bottom: 24rpx;
				padding: 16rpx;
				background-color: #ffffff;
				border-radius: 12rpx;
				
				&:last-child {
					margin-bottom: 0;
				}
				
				.exercise-header {
					margin-bottom: 12rpx;
					
					.exercise-name {
						font-size: 30rpx;
						font-weight: bold;
						color: #333333;
						margin-right: 16rpx;
					}
					
					.exercise-target {
						font-size: 26rpx;
						color: #666666;
					}
				}
				
				.exercise-details {
					display: flex;
					gap: 24rpx;
					margin-bottom: 12rpx;
					
					.detail-item {
						font-size: 26rpx;
						color: #666666;
					}
				}
				
				.exercise-notes {
					font-size: 26rpx;
					color: #666666;
					font-style: italic;
				}
			}
		}
		
		.day-footer {
			margin-top: 16rpx;
			padding-top: 16rpx;
			border-top: 2rpx solid #eeeeee;
			
			.duration {
				font-size: 26rpx;
				color: #666666;
				margin-bottom: 8rpx;
				display: block;
			}
			
			.notes {
				font-size: 26rpx;
				color: #666666;
				font-style: italic;
			}
		}
	}
}

.nutrition-info {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 24rpx;
	margin-bottom: 32rpx;
	
	.nutrition-item {
		background-color: #f8f8f8;
		padding: 16rpx;
		border-radius: 12rpx;
		
		.nutrition-label {
			font-size: 26rpx;
			color: #666666;
			margin-bottom: 8rpx;
			display: block;
		}
		
		.nutrition-value {
			font-size: 32rpx;
			color: #333333;
			font-weight: bold;
		}
	}
}

.diet-tips {
	.tips-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 16rpx;
		display: block;
	}
	
	.tip-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 16rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.tip-dot {
			font-size: 32rpx;
			color: #4CAF50;
			margin-right: 12rpx;
			line-height: 1;
		}
		
		.tip-text {
			flex: 1;
			font-size: 28rpx;
			color: #666666;
			line-height: 1.5;
		}
	}
}

.recovery-content {
	.recovery-section {
		margin-bottom: 32rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.recovery-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333333;
			margin-bottom: 16rpx;
			display: block;
		}
	}
}
</style>

<template>
	<view class="container">
		<view class="header">
			<text class="title">您的专属健身计划</text>
			<text class="subtitle">根据您的需求定制</text>
		</view>
		
		<!-- 页面指示器 -->
		<view class="page-indicator">
			<view class="indicator-dot" 
				  v-for="(item, index) in pageList" 
				  :key="index"
				  :class="{ active: currentPage === index }"
				  @tap="switchPage(index)">
			</view>
		</view>
		
		<!-- 滑动内容区域 -->
		<swiper class="swiper-container" 
				:current="currentPage" 
				@change="onSwiperChange"
				:duration="300">
			
			<!-- 基础信息页 -->
			<swiper-item>
				<scroll-view scroll-y class="scroll-container">
					<view class="page-content">
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
					</view>
				</scroll-view>
			</swiper-item>
			
			<!-- 每日训练计划页 -->
			<swiper-item v-for="(day, dayIndex) in weeklyPlan" :key="dayIndex">
				<scroll-view scroll-y class="scroll-container">
					<view class="page-content">
						<view class="day-plan-detail">
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
										<view class="detail-row">
											<text class="detail-label">组数：</text>
											<text class="detail-value">{{ exercise.sets }}组</text>
										</view>
										<view class="detail-row">
											<text class="detail-label">次数：</text>
											<text class="detail-value">{{ exercise.reps }}次</text>
										</view>
										<view class="detail-row">
											<text class="detail-label">休息：</text>
											<text class="detail-value">{{ exercise.restTime }}秒</text>
										</view>
									</view>
									<text class="exercise-notes" v-if="exercise.notes">{{ exercise.notes }}</text>
								</view>
							</view>
							
							<view class="day-summary">
								<text class="duration">训练时长：{{ day.duration }}</text>
								<text class="notes" v-if="day.notes">{{ day.notes }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</swiper-item>
			
			<!-- 营养建议页 -->
			<swiper-item>
				<scroll-view scroll-y class="scroll-container">
					<view class="page-content">
						<view class="nutrition-page">
							<text class="page-title">营养建议</text>
							
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
					</view>
				</scroll-view>
			</swiper-item>
			
			<!-- 恢复建议页 -->
			<swiper-item>
				<scroll-view scroll-y class="scroll-container">
					<view class="page-content">
						<view class="recovery-page">
							<text class="page-title">恢复建议</text>
							
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
				</scroll-view>
			</swiper-item>
			
		</swiper>
		
		<!-- 底部滑动提示 -->
		<view class="swipe-hint">
			<text class="hint-text">左右滑动查看更多内容</text>
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
			isLoading: true,
			currentPage: 0
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
		},
		pageList() {
			const pages = [
				{ title: '基础信息' }
			];
			
			// 添加每日训练计划页
			this.weeklyPlan.forEach((day, index) => {
				pages.push({ title: day.day || `第${index + 1}天` });
			});
			
			// 添加营养和恢复建议页
			pages.push({ title: '营养建议' });
			pages.push({ title: '恢复建议' });
			
			return pages;
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
					name: 'getFitnessPlan',
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
		},
		
		onSwiperChange(e) {
			this.currentPage = e.detail.current;
		},
		
		switchPage(index) {
			this.currentPage = index;
		}
	}
}
</script>

<style lang="scss">
.container {
	height: 100vh;
	background-color: #f5f5f5;
	display: flex;
	flex-direction: column;
}

.header {
	background: linear-gradient(135deg, #4CAF50, #45a049);
	padding: 60rpx 40rpx 40rpx 40rpx;
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

.page-indicator {
	background-color: #ffffff;
	padding: 16rpx 20rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	
	.indicator-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background-color: #d0d0d0;
		margin: 0 8rpx;
		transition: all 0.3s ease;
		
		&.active {
			background-color: #4CAF50;
			transform: scale(1.2);
		}
	}
}

.swiper-container {
	flex: 1;
	height: auto;
}

.scroll-container {
	height: 100%;
	box-sizing: border-box;
}

.page-content {
	padding: 20rpx;
	box-sizing: border-box;
	min-height: calc(100% - 40rpx);
}

.user-overview {
	background-color: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	width: 100%;
	box-sizing: border-box;
	
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
		box-sizing: border-box;
		
		.info-item {
			background-color: #f8f8f8;
			padding: 16rpx;
			border-radius: 12rpx;
			box-sizing: border-box;
			
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
		box-sizing: border-box;
		
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

.day-plan-detail {
	background-color: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	width: 100%;
	box-sizing: border-box;
	min-height: calc(100vh - 200rpx);
	
	.day-header {
		margin-bottom: 32rpx;
		text-align: center;
		padding: 24rpx;
		background: linear-gradient(135deg, #4CAF50, #45a049);
		border-radius: 16rpx;
		
		.day-name {
			font-size: 36rpx;
			font-weight: bold;
			color: #ffffff;
			display: block;
			margin-bottom: 8rpx;
		}
		
		.day-focus {
			font-size: 28rpx;
			color: #ffffff;
			opacity: 0.9;
		}
	}
	
	.exercises {
		.exercise-item {
			margin-bottom: 24rpx;
			padding: 24rpx;
			background-color: #f8f8f8;
			border-radius: 16rpx;
			box-sizing: border-box;
			
			&:last-child {
				margin-bottom: 32rpx;
			}
			
			.exercise-header {
				margin-bottom: 16rpx;
				
				.exercise-name {
					font-size: 30rpx;
					font-weight: bold;
					color: #333333;
					display: block;
					margin-bottom: 8rpx;
				}
				
				.exercise-target {
					font-size: 26rpx;
					color: #4CAF50;
					background-color: rgba(76, 175, 80, 0.1);
					padding: 4rpx 12rpx;
					border-radius: 12rpx;
					display: inline-block;
				}
			}
			
			.exercise-details {
				margin-bottom: 16rpx;
				
				.detail-row {
					display: flex;
					justify-content: space-between;
					margin-bottom: 8rpx;
					
					.detail-label {
						font-size: 26rpx;
						color: #666666;
					}
					
					.detail-value {
						font-size: 26rpx;
						color: #333333;
						font-weight: bold;
					}
				}
			}
			
			.exercise-notes {
				font-size: 24rpx;
				color: #666666;
				font-style: italic;
				line-height: 1.5;
			}
		}
	}
	
	.day-summary {
		padding: 24rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		box-sizing: border-box;
		
		.duration {
			font-size: 28rpx;
			color: #333333;
			font-weight: bold;
			margin-bottom: 8rpx;
			display: block;
		}
		
		.notes {
			font-size: 26rpx;
			color: #666666;
			font-style: italic;
			line-height: 1.5;
		}
	}
}

.nutrition-page, .recovery-page {
	background-color: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	width: 100%;
	box-sizing: border-box;
	min-height: calc(100vh - 200rpx);
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 32rpx;
		display: block;
		text-align: center;
	}
}

.nutrition-info {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 24rpx;
	margin-bottom: 32rpx;
	box-sizing: border-box;
	
	.nutrition-item {
		background-color: #f8f8f8;
		padding: 20rpx;
		border-radius: 12rpx;
		text-align: center;
		box-sizing: border-box;
		
		.nutrition-label {
			font-size: 26rpx;
			color: #666666;
			margin-bottom: 8rpx;
			display: block;
		}
		
		.nutrition-value {
			font-size: 32rpx;
			color: #4CAF50;
			font-weight: bold;
		}
	}
}

.diet-tips, .recovery-section {
	margin-bottom: 32rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
	
	.tips-title, .recovery-title {
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
			margin-top: 4rpx;
		}
		
		.tip-text {
			flex: 1;
			font-size: 28rpx;
			color: #666666;
			line-height: 1.6;
		}
	}
}

.swipe-hint {
	background-color: #ffffff;
	padding: 16rpx;
	text-align: center;
	border-top: 1rpx solid #eeeeee;
	
	.hint-text {
		font-size: 24rpx;
		color: #999999;
	}
}
</style>

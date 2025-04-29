<template>
  <view class="content">
    <view class="stars"></view>
    <view class="stars2"></view>
    <view class="stars3"></view>
    <view class="shooting-star" style="--delay: 0"></view>
    <view class="shooting-star" style="--delay: 1"></view>
    <view class="shooting-star" style="--delay: 2"></view>
    <view class="shooting-star" style="--delay: 3"></view>
    
    <view class="header">
      <text class="title">问问AI</text>
      <text class="subtitle">✨ 抛出硬币的时候，希望你找到答案 ✨</text>
    </view>
    
    <view class="usage-info" v-if="usageInfo">
      <!-- 未分享且已用完基础次数 -->
      <template v-if="usageInfo.used_count >= usageInfo.base_limit && !usageInfo.shared">
        <text class="usage-text">今日已用 {{usageInfo.used_count}}/{{usageInfo.base_limit}} 次</text>
        <button class="share-btn" open-type="share">
          <text class="share-text">分享获取更多次数</text>
        </button>
      </template>
      
      <!-- 已分享 -->
      <template v-else-if="usageInfo.shared">
        <text class="usage-text">今日已用 {{usageInfo.used_count}}/{{usageInfo.total_limit}} 次</text>
      </template>
      
      <!-- 未分享且未用完基础次数 -->
      <template v-else>
        <text class="usage-text">今日已用 {{usageInfo.used_count}}/{{usageInfo.base_limit}} 次</text>
      </template>
    </view>
    
    <view class="history-link" @click="goToHistory">
      <text>查看历史记录</text>
    </view>
    
    <view class="input-section">
      <view class="input-group">
        <view class="input-wrapper">
          <text class="input-label">第一个数字</text>
          <input 
            type="number" 
            v-model="numbers[0]" 
            class="number-input"
            placeholder="1-100"
            maxlength="3"
          />
          <view class="input-border"></view>
        </view>
        <view class="input-wrapper">
          <text class="input-label">第二个数字</text>
          <input 
            type="number" 
            v-model="numbers[1]" 
            class="number-input"
            placeholder="1-100"
            maxlength="3"
          />
          <view class="input-border"></view>
        </view>
        <view class="input-wrapper">
          <text class="input-label">第三个数字</text>
          <input 
            type="number" 
            v-model="numbers[2]" 
            class="number-input"
            placeholder="1-100"
            maxlength="3"
          />
          <view class="input-border"></view>
        </view>
      </view>
      <button @click="handleStartPrediction" class="predict-btn" :disabled="isLoading || (usageInfo && usageInfo.remaining <= 0)" :class="{'predict-btn-loading': isLoading}">
        <text class="predict-btn-text">{{ isLoading ? '正在推算...' : '开始预测' }}</text>
        <view class="btn-glow"></view>
      </button>
      
      <!-- 添加测试按钮 -->
      <!-- <button @click="testWithMockData" class="test-btn">
        <text class="test-btn-text">测试UI</text>
      </button> -->
    </view>
    
    <view v-if="prediction" class="prediction-section">
      <view class="prediction-title">
        <text class="prediction-icon">🌟</text>
        <text>预测结果</text>
      </view>
      <view class="prediction-content">{{ prediction }}</view>
    </view>

    <!-- 添加反馈按钮 -->
    <feedback-btn></feedback-btn>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { checkLogin } from '@/utils/auth.js'
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app';

const numbers = ref(['', '', ''])
const prediction = ref('')
const isLoading = ref(false)
const usageInfo = ref(null)
const isSharing = ref(false)

// 配置分享行为
onShareAppMessage(() => {
  // 设置正在分享标识
  isSharing.value = true;
  
  return {
    title: '问问AI',
    path: '/pages/index/index',
    imageUrl: '/static/logo.png',
    success: function() {
      console.log('分享成功回调触发，记录分享行为');
      recordShareAction();
      // 重置分享状态，防止onShow重复处理
      isSharing.value = false;
    }
  }
})

// 记录分享行为
const recordShareAction = async () => {
  try {
    console.log('开始记录分享行为');
    
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.token) {
      console.error('记录分享失败: 用户未登录');
      return;
    }
    
    console.log('调用云函数记录分享...');
    const result = await uniCloud.callFunction({
      name: 'recordShare',
      data: {
        token: userInfo.token,
        shareType: 'wechat',
        shareContent: 'app'
      }
    });
    
    console.log('分享云函数返回结果:', JSON.stringify(result.result));
    
    if (result.result && result.result.code === 0) {
      if (!result.result.data.already_shared) {
        uni.showToast({
          title: '分享成功，获得额外使用次数',
          icon: 'none'
        });
      } else {
        console.log('用户今日已分享过');
      }
      
      // 如果返回了使用情况，直接更新
      if (result.result.data.usage) {
        usageInfo.value = result.result.data.usage;
      } else {
        // 否则刷新使用情况
        checkUsageInfo();
      }
    } else {
      console.error('云函数调用成功但返回错误:', result.result);
      checkUsageInfo();
    }
  } catch (error) {
    console.error('记录分享失败具体错误:', error);
    // 刷新使用情况
    checkUsageInfo();
  }
}

// 获取使用情况
const checkUsageInfo = async () => {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.token) return;
    
    // 查询今日已使用记录
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    
    // 获取预测记录
    const predictionResult = await uniCloud.callFunction({
      name: 'getPredictionHistory',
      data: {
        token: userInfo.token,
        timeRange: {
          start: startOfDay,
          end: endOfDay
        }
      }
    });
    
    if (predictionResult.result && predictionResult.result.code === 0) {
      const usedCount = predictionResult.result.data.total || 0;
      
      // 获取分享记录
      const shareResult = await uniCloud.callFunction({
        name: 'recordShare',
        data: {
          token: userInfo.token,
          checkOnly: true
        }
      });
      
      // 打印调试信息
      console.log('分享状态检查结果:', JSON.stringify(shareResult.result));
      
      const baseLimit = 1; // 基础使用次数
      const hasShared = shareResult.result && 
                       shareResult.result.code === 0 && 
                       shareResult.result.data && 
                       shareResult.result.data.already_shared === true;
      
      // 打印更多调试信息
      console.log('判断分享状态:', {
        resultCode: shareResult.result?.code,
        dataExists: !!shareResult.result?.data,
        alreadyShared: shareResult.result?.data?.already_shared,
        finalHasShared: hasShared
      });
      
      const totalLimit = hasShared ? 2 : 1; // 分享后总次数为2，否则为1
      
      // 更新使用信息
      usageInfo.value = {
        used_count: usedCount,
        base_limit: baseLimit,
        shared: hasShared,
        total_limit: totalLimit,
        remaining: Math.max(0, totalLimit - usedCount)
      };
      
      // 打印最终使用信息
      console.log('最终使用信息:', JSON.stringify(usageInfo.value));
    }
  } catch (error) {
    console.error('获取使用情况失败:', error);
  }
}

// 页面加载
onLoad(() => {
    // 检查用户是否已登录
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo) {
        // 未登录，跳转到登录页
        uni.navigateTo({
            url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
        });
    } else {
        // 检查使用情况
        checkUsageInfo();
    }
});

// 每次页面显示时都刷新使用情况
onShow(() => {
    const userInfo = uni.getStorageSync('userInfo');
    if (userInfo && userInfo.token) {
        console.log('页面显示，刷新使用情况');
        
        // 如果正在分享状态，说明分享面板已关闭
        if (isSharing.value) {
            console.log('检测到从分享返回，记录分享行为');
            recordShareAction();
            // 处理完后重置分享状态
            isSharing.value = false;
        }
        
        checkUsageInfo();
    }
});

// 添加测试函数
const testWithMockData = () => {
  const mockData = {
    code: 0,
    content: "### 预测结果\n当前时间2025年4月9日18:12，数字4、5、6的组合显示你正处于一个充满变化和机遇的时期。近期你可能会遇到一些挑战，但同时也将迎来新的成长机会。保持开放的心态，灵活应对变化，将有助于你顺利度过这一阶段。\n\n### 具体建议\n1. **灵活应对变化**：近期可能会有一些突发情况，保持灵活的心态，及时调整计划，将有助于你更好地应对挑战。\n2. **加强沟通**：在人际关系中，多与他人沟通，尤其是与家人和同事，避免误解和冲突。\n3. **抓住学习机会**：这是一个适合学习和提升自我的时期，可以考虑参加一些培训或课程，提升自己的技能。\n4. **注意健康**：在忙碌的同时，不要忽视身体健康，合理安排作息，保持良好的生活习惯。\n\n### 分析过程\n1. **结合当前年月日时，分析数字在不同时间段的能量变化**：\n   - 2025年4月9日18:12，属于乙巳年，辰月，己亥日，酉时。乙木生巳火，辰土生己土，亥水克酉金，整体能量较为平衡，但存在一定的冲突和变化。\n   - 数字4代表稳定和基础，5代表变化和自由，6代表和谐和平衡。在当前时间背景下，数字4的能量受到挑战，5和6的能量则较为活跃，预示着近期可能会有一些变化和调整。\n\n2. **运用易经的阴阳五行理论，解读数字的卦象含义**：\n   - 数字4对应震卦，象征雷，代表行动和变动。数字5对应巽卦，象征风，代表灵活和变化。数字6对应坎卦，象征水，代表智慧和流动。\n   - 震卦与巽卦结合，预示着近期可能会有一些突发的变化和挑战，需要灵活应对。坎卦的出现则提示你，在处理问题时需要运用智慧和策略，保持冷静和理性。\n\n3. **分析事情发展趋势、人际关系变化、事业发展方向、个人成长机遇**：\n   - **近期事情发展趋势**：整体趋势是变化和调整，可能会遇到一些突发情况，但同时也将迎来新的机遇。\n   - **人际关系或家庭变化**：在人际关系中，多与他人沟通，避免误解和冲突。家庭方面，可能会有一些小的变动，但整体和谐。\n   - **事业发展方向**：事业上可能会有一些新的机会，但也需要面对一些挑战。保持灵活的心态，及时调整计划，将有助于你抓住机遇。\n   - **个人成长机遇**：这是一个适合学习和提升自我的时期，可以考虑参加一些培训或课程，提升自己的技能。\n\n通过以上分析，可以看出当前时间背景下，数字4、5、6的组合预示着变化和机遇并存。保持开放的心态，灵活应对变化，将有助于你顺利度过这一阶段，并抓住新的成长机会。"
  }
  
  // 跳转到结果页面
  uni.navigateTo({
    url: `/pages/result/result?prediction=${encodeURIComponent(mockData.content)}`
  })
}

const handleStartPrediction = async () => {
    // 检查用户是否已登录
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.token) {
        // 清空不完整的用户信息
        uni.removeStorageSync('userInfo');
        // 未登录，跳转到登录页
        uni.navigateTo({
            url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
        });
        return;
    }
    
    // 检查今日使用情况
    if (usageInfo.value && usageInfo.value.remaining <= 0) {
        // 用完所有次数
        if (usageInfo.value.shared || usageInfo.value.used_count > 1) {
            // 已分享或已使用多次，提示明天再来
            uni.showModal({
                title: '提示',
                content: '您今日的使用次数已达上限，明天再来试试吧！',
                showCancel: false,
                confirmText: '知道了'
            });
        } else {
            // 未分享，提示分享获取更多次数
            uni.showModal({
                title: '提示',
                content: '您的基础次数已用完，分享小程序可获取更多使用次数！',
                confirmText: '去分享',
                success: (res) => {
                    if (res.confirm) {
                        // 触发分享
                        uni.showShareMenu({
                            withShareTicket: true,
                            menus: ['shareAppMessage', 'shareTimeline']
                        });
                    }
                }
            });
        }
        return;
    }

    // 已登录，继续预测流程
    if (!numbers.value[0] || !numbers.value[1] || !numbers.value[2]) {
        uni.showToast({
            title: '请在心里想着您的问题，输入3个数字（1-100之间）',
            icon: 'none'
        });
        return;
    }

    // 检查是否已预测过
    if (prediction.value) {
        uni.showModal({
            title: '提示',
            content: '您已经进行过预测，是否重新预测？',
            success: (res) => {
                if (res.confirm) {
                    getPrediction();
                }
            }
        });
    } else {
        getPrediction();
    }
};

const getPrediction = async () => {
  // 检查是否已登录
  if (!checkLogin()) return;
  
  // 验证输入
  if (numbers.value.some(num => !num || Number(num) < 1 || Number(num) > 100)) {
    uni.showToast({
      title: '请输入1-100之间的数字',
      icon: 'none'
    });
    return;
  }
  
  // 获取用户信息
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || !userInfo.token) {
    // 清空不完整的用户信息
    uni.removeStorageSync('userInfo');
    uni.showToast({
      title: '用户信息不完整，请重新登录',
      icon: 'none'
    });
    // 跳转到登录页
    uni.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
    });
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await uniCloud.callFunction({
      name: 'generatePrediction',
      data: {
        number: numbers.value.join(','),
        token: userInfo.token
      }
    });
    
    if (result.result) {
      if (result.result.code === 0) {
        const prediction = result.result.content;
        
        // 更新使用情况
        if (result.result.usage) {
          usageInfo.value = result.result.usage;
        }
        
        // 跳转到结果页
        uni.navigateTo({
          url: `/pages/result/result?prediction=${encodeURIComponent(prediction)}`
        });
      } else if (result.result.code === -2) {
        // 使用次数达到限制
        uni.showModal({
          title: '使用次数已达上限',
          content: result.result.message,
          confirmText: '去分享',
          success: (res) => {
            if (res.confirm && result.result.data && result.result.data.can_share) {
              // 触发分享
              uni.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
              });
            }
          }
        });
        
        // 更新使用情况
        if (result.result.data) {
          usageInfo.value = {
            used_count: result.result.data.used_count,
            daily_limit: result.result.data.daily_limit,
            remaining: result.result.data.remaining,
            can_share: result.result.data.can_share
          };
        }
      } else {
        throw new Error(result.result.message || '生成预测失败');
      }
    } else {
      throw new Error('生成预测失败');
    }
  } catch (error) {
    uni.showToast({
      title: error.message || '生成预测失败，请重试',
      icon: 'none'
    });
    console.error('生成预测失败：', error);
  } finally {
    isLoading.value = false;
  }
}

const goToHistory = () => {
  // 获取用户信息
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo || !userInfo.token) {
    // 清空不完整的用户信息
    uni.removeStorageSync('userInfo');
    uni.showToast({
      title: '用户信息不完整，请重新登录',
      icon: 'none'
    });
    // 跳转到登录页
    uni.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/index/index')
    });
    return;
  }
  
  uni.navigateTo({
    url: '/pages/history/history'
  });
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  position: relative;
  overflow: hidden;
}

.usage-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  gap: 10px;
}

.usage-text {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
}

.share-btn {
  background: linear-gradient(45deg, #2979ff, #56ccf2);
  border: none;
  border-radius: 30px;
  font-size: 12px;
  color: white;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  height: 28px;
  min-height: unset;
  margin: 0;
}

.share-text {
  font-size: 12px;
}

.input-section {
  width: 280px;
  margin-bottom: 30px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  animation: slideUp 0.8s ease-out;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
  align-items: center;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  width: 100%;
}

.input-label {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  padding-left: 4px;
  letter-spacing: 1px;
}

.number-input {
  height: 42px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  text-align: center;
  font-size: 16px;
  color: #fff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
  letter-spacing: 1px;
}

.number-input::placeholder {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}

.number-input:focus {
  background: rgba(255,255,255,0.12);
  border-color: #4a90e2;
  box-shadow: 0 0 15px rgba(74,144,226,0.3);
  outline: none;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00ff88, #00a3ff);
  transition: width 0.3s ease;
}

.number-input:focus + .input-border {
  width: 100%;
}

.predict-btn {
  width: 280px;
  height: 42px;
  background: linear-gradient(45deg, #0066cc, #00a3ff);
  border: none;
  border-radius: 21px;
  font-size: 16px;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  box-shadow: 0 4px 15px rgba(0, 163, 255, 0.4);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: rotate(45deg);
  transition: all 0.3s ease;
  pointer-events: none;
}

.predict-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(0, 163, 255, 0.4);
}

.predict-btn:active .btn-glow {
  transform: rotate(45deg) scale(0.95);
}

.predict-btn[disabled] {
  background: rgba(255,255,255,0.1);
  box-shadow: none;
}

.predict-btn-loading {
  animation: glowPulse 1.5s infinite;
}

@keyframes glowPulse {
  0% { box-shadow: 0 0 5px rgba(0, 163, 255, 0.5), 0 0 10px rgba(0, 102, 204, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 163, 255, 0.8), 0 0 30px rgba(0, 102, 204, 0.8); }
  100% { box-shadow: 0 0 5px rgba(0, 163, 255, 0.5), 0 0 10px rgba(0, 102, 204, 0.5); }
}

.stars {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 
    1804px 1265px #FFF, 365px 332px #FFF, 86px 1888px #FFF, 1888px 484px #FFF,
    199px 1489px #FFF, 1459px 1010px #FFF, 807px 388px #FFF, 855px 558px #FFF,
    83px 1095px #FFF, 1418px 377px #FFF, 677px 886px #FFF, 862px 1709px #FFF,
    1058px 1085px #FFF, 50px 1772px #FFF, 1941px 1544px #FFF, 377px 900px #FFF,
    184px 712px #FFF, 1797px 1928px #FFF, 507px 1861px #FFF, 1849px 19px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF,
    1258px 1876px #FFF, 791px 189px #FFF, 1584px 465px #FFF, 865px 932px #FFF,
    686px 1888px #FFF, 1288px 484px #FFF, 199px 1489px #FFF, 1459px 1010px #FFF,
    807px 388px #FFF, 855px 558px #FFF, 83px 1095px #FFF, 1418px 377px #FFF;
  animation: animStar 50s linear infinite;
  opacity: 0.8;
}

.stars:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: 
    1804px 1265px #FFF, 365px 332px #FFF, 86px 1888px #FFF, 1888px 484px #FFF,
    199px 1489px #FFF, 1459px 1010px #FFF, 807px 388px #FFF, 855px 558px #FFF,
    83px 1095px #FFF, 1418px 377px #FFF, 677px 886px #FFF, 862px 1709px #FFF,
    1058px 1085px #FFF, 50px 1772px #FFF, 1941px 1544px #FFF, 377px 900px #FFF,
    184px 712px #FFF, 1797px 1928px #FFF, 507px 1861px #FFF, 1849px 19px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF,
    1258px 1876px #FFF, 791px 189px #FFF, 1584px 465px #FFF, 865px 932px #FFF,
    686px 1888px #FFF, 1288px 484px #FFF, 199px 1489px #FFF, 1459px 1010px #FFF,
    807px 388px #FFF, 855px 558px #FFF, 83px 1095px #FFF, 1418px 377px #FFF;
}

.stars2 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 
    1814px 1275px #FFF, 375px 342px #FFF, 96px 1898px #FFF, 1898px 494px #FFF,
    1584px 465px #FFF, 865px 932px #FFF, 686px 1888px #FFF, 1288px 484px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF;
  animation: animStar 100s linear infinite;
  opacity: 0.9;
}

.stars2:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: 
    1814px 1275px #FFF, 375px 342px #FFF, 96px 1898px #FFF, 1898px 494px #FFF,
    1584px 465px #FFF, 865px 932px #FFF, 686px 1888px #FFF, 1288px 484px #FFF,
    1399px 200px #FFF, 972px 497px #FFF, 795px 1109px #FFF, 746px 970px #FFF,
    1524px 972px #FFF, 1631px 389px #FFF, 1026px 1016px #FFF, 1295px 862px #FFF;
}

.stars3 {
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 
    1824px 1285px #FFF, 385px 352px #FFF, 106px 1908px #FFF, 1908px 504px #FFF,
    1594px 475px #FFF, 875px 942px #FFF, 696px 1898px #FFF, 1298px 494px #FFF;
  animation: animStar 150s linear infinite;
  opacity: 1;
}

.stars3:after {
  content: " ";
  position: absolute;
  top: 2000px;
  width: 4px;
  height: 4px;
  background: transparent;
  box-shadow: 
    1824px 1285px #FFF, 385px 352px #FFF, 106px 1908px #FFF, 1908px 504px #FFF,
    1594px 475px #FFF, 875px 942px #FFF, 696px 1898px #FFF, 1298px 494px #FFF;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}

.shooting-star {
  position: absolute;
  top: 50%;
  left: 80%;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, #fff, transparent);
  animation: shootingStar 4s infinite;
  animation-delay: calc(var(--delay) * 1s);
  opacity: 0;
}

@keyframes shootingStar {
  0% {
    transform: translate(0, 0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  10%, 20% {
    transform: translate(-200px, 200px) rotate(-45deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-400px, 400px) rotate(-45deg) scale(0.2);
    opacity: 0;
  }
}

.header {
  text-align: center;
  margin: 40px 0;
  animation: fadeIn 1s ease-out;
}

.title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5),
               0 0 20px rgba(255,255,255,0.3),
               0 0 30px rgba(255,255,255,0.2);
  letter-spacing: 2px;
}

.subtitle {
  display: block;
  margin-top: 15px;
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  letter-spacing: 3px;
}

.prediction-section {
  width: 80%;
  max-width: 400px;
  margin-top: 30px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  animation: fadeIn 0.8s ease-out;
}

.prediction-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

.prediction-icon {
  font-size: 28px;
}

.prediction-content {
  font-size: 17px;
  line-height: 1.8;
  color: rgba(255,255,255,0.9);
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 15px;
  border-left: 4px solid #3949ab;
  letter-spacing: 0.5px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.test-btn {
  width: 280px;
  height: 42px;
  background: linear-gradient(45deg, #00a3ff, #00ff88);
  border: none;
  border-radius: 21px;
  font-size: 16px;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 15px auto 0;
  display: block;
  box-shadow: 0 4px 15px rgba(0, 163, 255, 0.4);
}

.test-btn-text {
  position: relative;
  z-index: 1;
}

.test-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(0, 163, 255, 0.4);
}

.history-link {
  text-align: center;
  margin: 20px 0;
  color: #007AFF;
  font-size: 16px;
}
</style>

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
      <text class="title">玄学预测</text>
      <text class="subtitle">✨ 探索命运的奥秘 ✨</text>
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
      <button @click="getPrediction" class="predict-btn" :disabled="isLoading" :class="{'predict-btn-loading': isLoading}">
        <text class="predict-btn-text">{{ isLoading ? '正在推算...' : '开始预测' }}</text>
        <view class="btn-glow"></view>
      </button>
    </view>
    
    <view v-if="prediction" class="prediction-section">
      <view class="prediction-title">
        <text class="prediction-icon">🌟</text>
        <text>预测结果</text>
      </view>
      <view class="prediction-content">{{ prediction }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const numbers = ref(['', '', ''])
const prediction = ref('')
const isLoading = ref(false)

const getPrediction = async () => {
  // 验证输入
  if (numbers.value.some(num => !num || Number(num) < 1 || Number(num) > 100)) {
    uni.showToast({
      title: '请输入1-100之间的数字',
      icon: 'none'
    })
    return
  }

  isLoading.value = true
  try {
    // 这里可以接入实际的AI API
    // 目前使用模拟数据
    const responses = [
      '根据数字能量显示，近期会有贵人相助，把握机会主动出击，成功在望。建议：保持开放心态，积极社交。',
      '数字组合暗示近期需要谨慎行事，三思而后行。建议：做事前多做准备，避免冲动决策。',
      '能量显示近期运势上升，可以大胆尝试新事物。建议：勇于创新，突破自我。',
      '数字预示近期需要沉淀与积累，静待花开。建议：专注自我提升，耐心等待机会。',
      '玄学预测显示近期会有意外收获，保持警觉。建议：留意身边细节，把握偶然机遇。',
      '数字组合展示近期人际关系将有突破。建议：多参与社交活动，拓展人脉圈。',
      '能量预示工作事业有新的机遇。建议：做好准备，展现最佳状态。'
    ]
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 根据输入数字生成预测结果
    const sum = numbers.value.reduce((a, b) => Number(a) + Number(b), 0)
    prediction.value = responses[sum % responses.length]
    
  } catch (error) {
    uni.showToast({
      title: '预测失败，请稍后重试',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}
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

.input-section {
  width: 80%;
  max-width: 400px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  animation: slideUp 0.8s ease-out;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-bottom: 30px;
  align-items: center;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  width: 200px;
}

.input-label {
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  padding-left: 4px;
  letter-spacing: 1px;
}

.number-input {
  height: 55px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  text-align: center;
  font-size: 24px;
  color: #fff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
}

.number-input::placeholder {
  color: rgba(255,255,255,0.5);
}

.number-input:focus {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.3);
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
  width: 200px;
  height: 55px;
  background: linear-gradient(45deg, #1a237e, #3949ab);
  border: none;
  border-radius: 28px;
  font-size: 18px;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  box-shadow: 0 4px 15px rgba(26,35,126,0.4);
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
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(26,35,126,0.4);
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
  0% { box-shadow: 0 0 5px rgba(26,35,126,0.5), 0 0 10px rgba(57,73,171,0.5); }
  50% { box-shadow: 0 0 20px rgba(26,35,126,0.8), 0 0 30px rgba(57,73,171,0.8); }
  100% { box-shadow: 0 0 5px rgba(26,35,126,0.5), 0 0 10px rgba(57,73,171,0.5); }
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
</style>

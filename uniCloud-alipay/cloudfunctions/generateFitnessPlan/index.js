'use strict';

// 从环境变量获取配置
const createConfig = require('uni-config-center');
const shareConfig = createConfig({
	pluginId: 'deepseek-config',
});
const Config = shareConfig.config();

const API_KEY = Config.AI_API_KEY;
const API_URL = Config.AI_API_URL;

// 系统提示词模板
const SYSTEM_PROMPT = `你是一位专业的健身教练和营养师。请根据用户提供的信息生成个性化的健身计划。

**输出格式要求：**
请严格按照以下JSON格式输出，不要添加任何其他内容：

{
  "workoutPlan": {
    "weeklyPlan": [
      {
        "day": "周一",
        "focus": "胸部、三头肌",
        "exercises": [
          {
            "name": "动作名称",
            "sets": 4,
            "reps": "8-12",
            "restTime": 60,
            "targetMuscle": "目标肌群",
            "notes": "动作要领"
          }
        ],
        "duration": "60分钟",
        "notes": "注意事项"
      }
    ]
  },
  "nutritionAdvice": {
    "dailyCalories": "2800-3000千卡",
    "protein": "2.0克/千克体重",
    "carbs": "4.5克/千克体重",
    "fats": "1.0克/千克体重",
    "dietTips": [
      "具体饮食建议1",
      "具体饮食建议2"
    ]
  },
  "recoveryTips": {
    "restSchedule": [
      "休息建议1",
      "休息建议2"
    ],
    "stretching": [
      "拉伸动作1",
      "拉伸动作2"
    ],
    "notes": [
      "注意事项1",
      "注意事项2"
    ]
  }
}

请确保：
1. 所有数值类型的数据不要加引号
2. 所有文本类型的数据要加引号
3. 严格按照上述JSON格式输出，不要添加任何其他内容
4. 每周训练计划必须包含7天的内容
5. 每个训练动作必须包含完整的属性（name, sets, reps, restTime, targetMuscle, notes）
6. 所有建议必须具体可行，适合用户的具体情况`;

const db = uniCloud.database();
const fitnessPlanCollection = db.collection('fitness_plans');

// 修改解析AI返回内容的逻辑
const parseAIResponse = (content) => {
	try {
		// 尝试直接解析JSON
		const plan = JSON.parse(content);
		return plan;
	} catch (error) {
		console.error('解析AI响应失败：', error);
		throw new Error('健身计划格式错误，请重试');
	}
};

exports.main = async (event, context) => {
	const { 
		height,           // 身高(cm)
		weight,           // 体重(kg)
		age,             // 年龄
		gender,          // 性别
		fitnessGoal,     // 健身目标
		injuries,        // 身体损伤情况
		venue,           // 运动场地
		isBodyweight,    // 是否徒手健身
		planDuration,    // 计划周期
		userId           // 用户ID
	} = event;

	try {
		// 计算BMI
		const bmi = weight / Math.pow(height / 100, 2);
		
		// 构建用户信息
		const userInfo = {
			height,
			weight,
			age,
			gender,
			fitnessGoal,
			injuries,
			venue,
			isBodyweight,
			planDuration,
			bmi
		};

		// 构建用户提示内容
		const userContent = `请根据以下用户信息生成健身计划：

用户信息：
- 身高：${height}cm
- 体重：${weight}kg
- 年龄：${age}岁
- 性别：${gender === 'male' ? '男' : '女'}
- BMI：${bmi.toFixed(1)}
- 健身目标：${fitnessGoal}
- 身体损伤：${injuries.join(', ') || '无'}
- 运动场地：${venue}
- 训练方式：${isBodyweight ? '徒手训练' : '器械训练'}
- 计划周期：${planDuration}`;

		// 调用AI API
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`
			},
			body: JSON.stringify({
				model: "deepseek-chat",
				messages: [
					{
						role: "system",
						content: SYSTEM_PROMPT
					},
					{
						role: "user",
						content: userContent
					}
				]
			})
		});

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const data = await response.json();
		let planContent = '';
		
		if (data.choices && data.choices[0] && data.choices[0].message) {
			planContent = data.choices[0].message.content;
		} else if (data.content) {
			planContent = data.content;
		} else {
			planContent = JSON.stringify(data);
		}

		// 解析AI返回的内容
		const plan = parseAIResponse(planContent);

		// 构建健身计划
		const fitnessPlan = {
			userId,
			userInfo,
			workoutPlan: plan.workoutPlan,
			nutritionAdvice: plan.nutritionAdvice,
			recoveryTips: plan.recoveryTips,
			createdAt: new Date(),
			status: 'active',
			aiResponse: {
				content: planContent,
				timestamp: new Date()
			}
		};

		// 保存到数据库
		const result = await fitnessPlanCollection.add(fitnessPlan);

		return {
			code: 0,
			message: '生成成功',
			data: {
				planId: result.id,
				...fitnessPlan
			}
		};
	} catch (error) {
		console.error('生成健身计划失败，详细错误：', {
			message: error.message,
			stack: error.stack,
		});
		return {
			code: -1,
			message: error.message || '健身计划生成失败，请稍后再试。'
		};
	}
}; 

'use strict';

// 从环境变量获取配置
const createConfig = require('uni-config-center');
const shareConfig = createConfig({
	pluginId: 'deepseek-config',
});
const Config = shareConfig.config();

const API_KEY = Config.AI_API_KEY_VIP;
const API_URL = Config.AI_API_URL_VIP;

// 系统提示词模板
const SYSTEM_PROMPT = `你是一位专业的健身教练和营养师。请根据用户提供的信息生成个性化的健身计划。

**训练方式说明：**
1. 徒手训练：只能使用自身体重，不能使用任何器械（包括哑铃、弹力带等）
2. 居家少量器械：可以使用哑铃、弹力带等简单器械
3. 健身房：可以使用所有健身房器械

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
6. 所有建议必须具体可行，适合用户的具体情况
7. 严格遵循用户选择的训练方式：
   - 徒手训练：只能使用俯卧撑、引体向上、深蹲等自重动作
   - 居家少量器械：可以使用哑铃、弹力带等简单器械
   - 健身房：可以使用所有健身房器械`;

const db = uniCloud.database();
const fitnessPlanCollection = db.collection('fitness_plans');

// 解析AI响应
function parseAIResponse(content) {
	try {
		// 1. 清理内容
		let cleanedContent = content
			.replace(/```(?:json)?\s*/g, '')  // 移除开头的 ```json 或 ```
			.replace(/```\s*$/g, '')          // 移除结尾的 ```
			.replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')  // 提取JSON对象
			.trim();                          // 移除首尾空白

		// 2. 尝试直接解析
		try {
			return JSON.parse(cleanedContent);
		} catch (error) {
			console.log('直接解析失败，尝试修复格式');
		}

		// 3. 尝试修复常见格式问题
		try {
			// 检查并修复缺失的括号
			let openBraces = (cleanedContent.match(/{/g) || []).length;
			let closeBraces = (cleanedContent.match(/}/g) || []).length;
			let openBrackets = (cleanedContent.match(/\[/g) || []).length;
			let closeBrackets = (cleanedContent.match(/\]/g) || []).length;

			// 补充缺失的括号
			if (openBraces > closeBraces) {
				cleanedContent += '}'.repeat(openBraces - closeBraces);
			}
			if (openBrackets > closeBrackets) {
				cleanedContent += ']'.repeat(openBrackets - closeBrackets);
			}

			return JSON.parse(cleanedContent);
		} catch (error) {
			console.log('修复括号后解析失败，尝试提取关键信息');
		}

		// 4. 尝试提取关键信息
		try {
			const result = {};
			
			// 提取 workoutPlan
			const workoutPlanMatch = cleanedContent.match(/"workoutPlan":\s*({[\s\S]*?})/);
			if (workoutPlanMatch) {
				try {
					result.workoutPlan = JSON.parse(workoutPlanMatch[1]);
				} catch (e) {
					console.log('解析workoutPlan失败，尝试修复格式');
					// 尝试修复workoutPlan格式
					const fixedWorkoutPlan = workoutPlanMatch[1]
						.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 修复未加引号的键
						.replace(/(:\s*)(\d+)(\s*[,}])/g, '$1"$2"$3');  // 修复数值类型
					result.workoutPlan = JSON.parse(fixedWorkoutPlan);
				}
			}

			// 提取 nutritionAdvice
			const nutritionAdviceMatch = cleanedContent.match(/"nutritionAdvice":\s*({[\s\S]*?})/);
			if (nutritionAdviceMatch) {
				try {
					result.nutritionAdvice = JSON.parse(nutritionAdviceMatch[1]);
				} catch (e) {
					console.log('解析nutritionAdvice失败，尝试修复格式');
					const fixedNutritionAdvice = nutritionAdviceMatch[1]
						.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
						.replace(/(:\s*)(\d+)(\s*[,}])/g, '$1"$2"$3');
					result.nutritionAdvice = JSON.parse(fixedNutritionAdvice);
				}
			}

			// 提取 recoveryTips
			const recoveryTipsMatch = cleanedContent.match(/"recoveryTips":\s*({[\s\S]*?})/);
			if (recoveryTipsMatch) {
				try {
					result.recoveryTips = JSON.parse(recoveryTipsMatch[1]);
				} catch (e) {
					console.log('解析recoveryTips失败，尝试修复格式');
					const fixedRecoveryTips = recoveryTipsMatch[1]
						.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
						.replace(/(:\s*)(\d+)(\s*[,}])/g, '$1"$2"$3');
					result.recoveryTips = JSON.parse(fixedRecoveryTips);
				}
			}

			// 验证必要字段
			if (!result.workoutPlan || !result.nutritionAdvice || !result.recoveryTips) {
				throw new Error('缺少必要字段');
			}

			return result;
		} catch (error) {
			console.error('提取关键信息失败:', error);
			throw new Error('无法解析响应内容');
		}
	} catch (error) {
		console.error('解析失败:', error);
		throw new Error('无法解析响应内容');
	}
}

exports.main = async (event, context) => {
	const { 
		height,           // 身高(cm)
		weight,           // 体重(kg)
		age,             // 年龄
		gender,          // 性别
		fitnessGoal,     // 健身目标
		injuries,        // 身体损伤情况
		venue,           // 运动场地类型：gym/home/bodyweight
		isBodyweight,    // 是否徒手健身
		planDuration,    // 计划周期
		weeklyDays,      // 每周可健身天数
		dailyDuration,   // 每天可健身时长
		token           // 用户token
	} = event;

	try {
		// 验证 token
		if (!token) {
			return {
				code: -1,
				message: '未提供用户凭证'
			};
		}
		
		// 查询用户信息
		const user = await db.collection('users')
			.where({
				token: token
			})
			.get();
			
		if (user.data.length === 0) {
			return {
				code: -1,
				message: '无效的用户凭证'
			};
		}
		
		const openid = user.data[0].openid;
		console.log('获取到 openid:', openid);

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
			weeklyDays,
			dailyDuration,
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
- 身体损伤：${injuries?.join(', ') || '无'}
- 训练方式：${venue === 'bodyweight' ? '徒手训练（仅使用自身体重）' : venue === 'gym' ? '健身房（可使用所有器械）' : '居家少量器械（可使用哑铃、弹力带等）'}
- 计划周期：${planDuration}
- 每周可健身天数：${weeklyDays}天
- 每天可健身时长：${dailyDuration}分钟

请严格按照JSON格式输出，不要添加任何其他内容。特别注意：
1. 如果是徒手训练，所有动作必须只使用自身体重，不能包含任何需要器械、绳索、弹力带的动作
2. 如果是居家少量器械，可以使用哑铃、弹力带等简单器械
3. 如果是健身房，可以使用所有健身房器械
4. 如果是减脂目标，必须包含有氧运动计划，可以包括：
   - 跑步机/室外跑步
   - 跳绳
   - 爬楼机
   - 骑行
   - HIIT训练
5. 训练计划必须符合用户的时间安排（每周${weeklyDays}天，每天${dailyDuration}分钟）`;

		// 调用AI接口
		const response = await uniCloud.httpclient.request(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`
			},
			data: JSON.stringify({
				model: "deepseek-chat",
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: userContent }
				],
				temperature: 0.7,
				max_tokens: 3000
			}),
			timeout: 180000,
			dataType: 'json'
		});

		if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
			throw new Error('AI响应格式错误');
		}

		const planContent = response.data.choices[0].message.content;
		console.log('AI响应内容:', planContent);

		// 解析AI响应
		let plan;
		try {
			plan = parseAIResponse(planContent);
		} catch (error) {
			console.error('解析AI响应失败:', error);
			throw new Error('解析AI响应失败: ' + error.message);
		}

		// 验证必要字段
		if (!plan.workoutPlan || !plan.nutritionAdvice || !plan.recoveryTips) {
			throw new Error('AI响应缺少必要字段');
		}

		// 构建健身计划
		const fitnessPlan = {
			openid,
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

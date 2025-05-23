'use strict';

const db = uniCloud.database();
const fitnessPlanCollection = db.collection('fitness_plans');

exports.main = async (event, context) => {
	const { planId } = event;
	
	if (!planId) {
		return {
			code: -1,
			message: '计划ID不能为空'
		};
	}
	
	try {
		// 检查计划是否存在
		const plan = await fitnessPlanCollection.doc(planId).get();
		
		if (!plan.data || plan.data.length === 0) {
			return {
				code: -1,
				message: '未找到健身计划'
			};
		}
		
		// 更新计划状态为已保存
		await fitnessPlanCollection.doc(planId).update({
			status: 'saved',
			savedAt: new Date()
		});
		
		return {
			code: 0,
			message: '保存成功'
		};
	} catch (error) {
		return {
			code: -1,
			message: '保存健身计划失败',
			error: error.message
		};
	}
}; 

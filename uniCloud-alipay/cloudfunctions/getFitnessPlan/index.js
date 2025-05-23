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
		const plan = await fitnessPlanCollection.doc(planId).get();
		
		if (!plan.data || plan.data.length === 0) {
			return {
				code: -1,
				message: '未找到健身计划'
			};
		}
		
		return {
			code: 0,
			message: '获取成功',
			data: plan.data[0]
		};
	} catch (error) {
		return {
			code: -1,
			message: '获取健身计划失败',
			error: error.message
		};
	}
}; 

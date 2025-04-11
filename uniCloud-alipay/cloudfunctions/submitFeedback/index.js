'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
	const { type, content, contact, images, userInfo } = event;
	
	try {
		// 创建反馈集合（如果不存在）
		try {
			// 尝试获取集合信息，如果集合不存在会抛出异常
			await db.collection('feedback').count()
		} catch (error) {
			if (error.message.includes('not found collection')) {
				// 集合不存在，创建集合
				console.log('集合不存在，创建feedback集合')
				await db.createCollection('feedback')
			} else {
				// 如果是其他错误，则抛出
				throw error
			}
		}
		
		// 创建反馈记录
		const result = await db.collection('feedback').add({
			type,
			content,
			contact,
			images,
			userInfo, // 如果前端传入了用户信息，则保存
			createTime: Date.now(),
			status: 'pending' // pending, processing, resolved
		});
		
		return {
			code: 0,
			message: '反馈提交成功',
			data: result
		};
	} catch (error) {
		console.error('提交反馈失败：', error);
		return {
			code: -1,
			message: '提交反馈失败: ' + error.message
		}
	}
}; 

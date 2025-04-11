'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
	const { code, userInfo } = event;
	
	try {
		// 创建用户集合（如果不存在）
		try {
			// 尝试获取集合信息，如果集合不存在会抛出异常
			await db.collection('users').count()
		} catch (error) {
			if (error.message.includes('not found collection')) {
				// 集合不存在，创建集合
				console.log('集合不存在，创建users集合')
				await db.createCollection('users')
			} else {
				// 如果是其他错误，则抛出
				throw error
			}
		}
		
		// 获取用户唯一标识
		let openid = '';
		try {
			// 根据不同平台获取用户标识
			if (context.PLATFORM === 'mp-weixin') {
				const wxContext = await uniCloud.getWXContext();
				openid = wxContext.OPENID;
			} else if (context.PLATFORM === 'mp-alipay') {
				const alipayContext = await uniCloud.getAlipayContext();
				openid = alipayContext.OPENID;
			} else {
				// 如果无法获取真实openid，则生成一个随机ID作为测试用
				openid = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2);
				console.log('测试环境，使用临时ID:', openid);
			}
		} catch (error) {
			console.error('获取用户标识失败:', error);
			// 如果无法获取openid，为了便于测试，生成一个随机ID
			openid = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2);
			console.log('无法获取用户标识，使用临时ID:', openid);
		}
		
		if (!openid) {
			return {
				code: -1,
				message: '获取用户标识失败'
			}
		}
		
		// 查询用户是否存在
		let user = await db.collection('users').where({
			openid: openid
		}).get();
		
		if (user.data.length === 0) {
			// 新用户，创建用户记录
			await db.collection('users').add({
				openid: openid,
				nickName: userInfo?.nickName || '匿名用户',
				avatarUrl: userInfo?.avatarUrl || '',
				gender: userInfo?.gender || 0,
				createTime: Date.now(),
				lastLoginTime: Date.now()
			});
		} else {
			// 更新用户信息
			await db.collection('users').doc(user.data[0]._id).update({
				nickName: userInfo?.nickName || user.data[0].nickName,
				avatarUrl: userInfo?.avatarUrl || user.data[0].avatarUrl,
				gender: userInfo?.gender || user.data[0].gender,
				lastLoginTime: Date.now()
			});
		}
		
		// 生成token（简单实现，实际应用中应该使用更安全的方式）
		const token = 'token_' + openid + '_' + Date.now();
		
		return {
			code: 0,
			message: '登录成功',
			data: {
				token,
				userInfo: {
					openid: openid,
					nickName: userInfo?.nickName || '匿名用户',
					avatarUrl: userInfo?.avatarUrl || '',
					gender: userInfo?.gender || 0
				}
			}
		}
		
	} catch (error) {
		console.error('登录失败：', error);
		return {
			code: -1,
			message: '登录失败: ' + error.message
		}
	}
}; 

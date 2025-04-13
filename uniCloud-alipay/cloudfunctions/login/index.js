'use strict';

const db = uniCloud.database();
const configCenter = require('uni-config-center')
const mpConfig = configCenter({
	pluginId: 'mp-config'
}).config()

// 检查配置是否存在
if (!mpConfig || !mpConfig['mp-weixin'] || !mpConfig['mp-weixin'].appid || !mpConfig['mp-weixin'].appsecret) {
	throw new Error('微信小程序配置缺失，请检查uni-config-center/mp-config/config.json配置')
}

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
				// 使用code2session接口获取openid
				const wxContext = await uniCloud.httpclient.request('https://api.weixin.qq.com/sns/jscode2session', {
					dataType: 'json',
					data: {
						appid: mpConfig['mp-weixin'].appid,
						secret: mpConfig['mp-weixin'].appsecret,
						js_code: code,
						grant_type: 'authorization_code'
					}
				});
				
				if (wxContext.data && wxContext.data.openid) {
					openid = wxContext.data.openid;
				} else {
					throw new Error('获取openid失败: ' + JSON.stringify(wxContext.data));
				}
			} else if (context.PLATFORM === 'mp-alipay') {
				const alipayContext = await uniCloud.getAlipayContext();
				openid = alipayContext.OPENID;
			} else {
				throw new Error('不支持的平台');
			}
		} catch (error) {
			console.error('获取用户标识失败:', error);
			return {
				code: -1,
				message: '获取用户标识失败: ' + error.message
			}
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

'use strict';

const configCenter = require('uni-config-center')
const mpConfig = configCenter({
	pluginId: 'mp-config'
}).config()

// 检查配置是否存在
if (!mpConfig || !mpConfig['mp-weixin'] || !mpConfig['mp-weixin'].appid || !mpConfig['mp-weixin'].appsecret) {
	throw new Error('微信小程序配置缺失，请检查uni-config-center/mp-config/config.json配置')
}

const appid = mpConfig['mp-weixin'].appid;
const appsecret = mpConfig['mp-weixin'].appsecret;

exports.main = async (event, context) => {
	try {
		const { action, data } = event;
		
		switch (action) {
			case 'code2Session':
				return await code2Session(data.code);
			default:
				return {
					code: -1,
					message: '未知的操作类型'
				};
		}
	} catch (error) {
		console.error('微信API调用失败：', error);
		return {
			code: -1,
			message: error.message
		};
	}
};

// 使用code换取openid
async function code2Session(code) {
	try {
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${code}&grant_type=authorization_code`;
		
		const response = await uniCloud.httpclient.request(url, {
			dataType: 'json'
		});
		
		if (response.data.errcode) {
			throw new Error(`微信接口返回错误：${response.data.errmsg}`);
		}
		
		return {
			code: 0,
			message: '获取成功',
			openid: response.data.openid,
			session_key: response.data.session_key
		};
	} catch (error) {
		console.error('code2Session失败：', error);
		throw error;
	}
} 

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export const isLoggedIn = () => {
	return !!uni.getStorageSync('token')
}

/**
 * 跳转登录页面
 * @param {String} redirect 登录后重定向地址
 */
export const navigateToLogin = (redirect) => {
	const currentPage = getCurrentPages()[getCurrentPages().length - 1]
	const currentRoute = currentPage ? currentPage.route : ''
	
	// 避免重复跳转到登录页
	if (currentRoute === 'pages/login/login') {
		return
	}
	
	// 构建重定向地址
	let redirectUrl = ''
	if (redirect) {
		redirectUrl = encodeURIComponent(redirect)
	} else if (currentRoute) {
		// 将当前页面作为重定向地址
		const options = currentPage.options || {}
		let query = ''
		for (const key in options) {
			query += `${key}=${options[key]}&`
		}
		query = query ? `?${query.substring(0, query.length - 1)}` : ''
		redirectUrl = encodeURIComponent(`/${currentRoute}${query}`)
	}
	
	uni.navigateTo({
		url: `/pages/login/login${redirectUrl ? '?redirect=' + redirectUrl : ''}`
	})
}

/**
 * 检查登录状态，未登录则跳转到登录页
 * @param {String} redirect 登录后重定向地址
 * @returns {Boolean} 是否已登录
 */
export const checkLogin = (redirect) => {
	if (!isLoggedIn()) {
		navigateToLogin(redirect)
		return false
	}
	return true
} 

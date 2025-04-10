import {
	createSSRApp
} from "vue";
import App from "./App.vue";
export function createApp() {
	const app = createSSRApp(App);
	uni.addInterceptor('request', {
		invoke(args) {
			// 默认超时时间设为 120 秒 (120000 毫秒)
			args.timeout = args.timeout || 120000; 
		},
	});
	return {
		app,
	};
}

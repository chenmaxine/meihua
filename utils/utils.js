export default {
	systemInfo() {
		try{
			const systeminfo = uni.getSystemInfoSync();
			return {
				windowWidth: systeminfo.windowWidth,
				windowHeight: systeminfo.windowHeight,
				pixedRatio: systeminfo.pixelRatio
			}
		}catch(e){
			return {};
		}
	},
	
	toast(text) {
		return uni.showToast({
			title: text,
			icon: 'none'
		});
	}
}
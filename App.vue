<script>
	import config from './utils/config.js';
	import request from './utils/request.js';
	export default {
		onLaunch: function() {
			let _this  = this
			uni.getStorage({
				key: 'userLogin',
				success(r) {
					_this.globalData.hasLogin = true
				},
				
			})
			this.getAdInfo()
			this.getShareId();//获取分享信息-kkkgogogo
			this.checkSession(openid => {//获取用户openid-gogokkk
				this.globalData.openid = openid;
				//获取当前用户可看广告的数据
				this.getAdLogInfo()
				this.saveAnalysisInfo(1)
			},this.globalData.projectId);
			
			
		},
		onShow: function() {
			
		},
		onHide: function() {
			
		},
		methods:{
			// 获取分享信息
			async getShareId() {
				let _this  = this
				const r = await request({
					url:  `${config.API}api/w/getShareInfo`,
					method: 'POST'
				});
				if (r.error_code === 0) {
					_this.globalData.shareInfo = r.data
				}
			},
			
			//检查openid
			checkSession(callback,projectId){
				let _this = this
				uni.checkSession({
					success(r) {
						uni.getStorage({
							key: 'openid',
							success(r) {
								if (!r.data) {
									_this.loginAction(callback,projectId);
								} else {
									callback && callback(r.data);
								}
							},
							fail(err) {
								_this.loginAction(callback,projectId);
							}
						})
					},
					fail(err) {
						_this.loginAction(callback,projectId);
					}
				});
				// _this.loginAction(callback,projectId);
			},
			//获取openid
			loginAction(callback,projectId) {
				uni.login({
					async success(r) {
						uni.request({
							url: `${config.API}api/user/openid/bind`,
							data: {
								code: r.code,
								projectId:projectId
							},
							success(r2) {
								if (r2.data.error_code === 0) {
									uni.setStorage({
										key: 'openid',
										data: r2.data.data.openid
									});
									callback && callback(r2.data.data.openid);
								} else {
									uni.showToast({
										title: '获取openid失败',
										icon: 'none'
									});
								}
							},
							fail(err) {
								console.log(err);
							}
						});
					}
				});
			},
			//存储用户信息
			async saveUserInfo(avatarUrl,nickName) {
				const r = await request({
					url: `${config.API}api/user/saveInfo`,
					method:'POST',
					data: {
						openid: this.globalData.openid,
						avatarUrl:avatarUrl,
						nickName:nickName,
						platform:this.globalData.projectId
					},
				});
				console.log(r) 
			},
			//获取广告
			getAdInfo(){
				let _this = this
				uni.request({
					url: `${config.API}api/w/getAdInfo`,
					data: {
						projectId:this.globalData.projectId
					},
					method:'POST',
					success(res) {
						console.log("Response data:", res.data);
							_this.globalData.adInfo = res.data.data;
						console.log("AdInfo object:", _this.globalData.adInfo);
							_this.globalData.canShowAd = res.data.data.open_ad == 1?true:false;
						console.log("Can show ad:", _this.globalData.canShowAd);
						_this.globalData.adInfo = res.data.data
						_this.globalData.canShowAd = res.data.data.open_ad == 1?true:false
						console.log(_this.globalData.adInfo)
					}
				})
			},
			  // ... 其他代码 ...
			// 获取看广告信息
			async getAdLogInfo() {
				let _this  = this
				const r = await request({
					url:  `${config.API}api/ad/logSearch`,
					method: 'POST',
					data:{
						openid:this.globalData.openid,
						platform:this.globalData.projectId
					}
				});
				_this.globalData.ad_number = r.data.ad_number
				_this.globalData.illegal_ad_number = r.data.illegal_ad_number
				_this.globalData.free_ad_num = r.data.free_ad_num
				_this.globalData.illfree_ad_num = r.data.illfree_ad_num
				_this.globalData.de_ad_number = r.data.de_ad_number
				_this.globalData.adRequestRes = true
				
			},
			
			// 增加看广告信息
			async addAdLog() {
				let _this  = this
				const r = await request({
					url:  `${config.API}api/ad/logAdd`,
					method: 'POST',
					data:{
						openid:this.globalData.openid,
						platform:this.globalData.projectId
					}
				});

				_this.globalData.illegal_ad_number++
			},
			// 增加免费不看广告信息
			async addFreeAdLog() {
				let _this  = this
				const r = await request({
					url:  `${config.API}api/ad/logAdd`,
					method: 'POST',
					data:{
						openid:this.globalData.openid,
						platform:this.globalData.projectId,
						type:2,
					}
				});
			
				_this.globalData.illfree_ad_num++
			},
			
			
			//存储数据埋点分析内容
			//type : 具体埋点位置内容
			 // 1=>'进入小程序',2=>'进入素材详情页',3=>'点击看广告下载的次数',4=>'点击普通下载的次数'
			 //        ,5=>'真实看完广告的次数',6=>'未正常看完广告的次数',7=>'广告加载异常次数',
			async saveAnalysisInfo(analysis_type,wallpaperId=0) {
				const r = await request({
					url: `${config.API}api/w/data/analysis/save`,
					method:'POST',
					data: {
						openid: this.globalData.openid,
						platform:this.globalData.projectId,
						type:analysis_type,
						wallpaper_id:wallpaperId
					},
				});
				console.log(r) 
			},
			
			//处理看广告分销功能
			async dealPp(id,nickName,avatarUrl) {
				const r = await request({
					url: `${config.API}api/w/dealPp`,
					method: 'POST',
					data: {
						id: id,
						platform: this.globalData.projectId,
						openid: this.globalData.openid,
						nickname: nickName,
						avatar_url: avatarUrl,
					}
				});
			
			},
		},
		globalData:{
			//环境区分类型
			// #ifdef MP-QQ
			projectId:'qq',
			// #endif
			// #ifdef MP-WEIXIN
			projectId:'wx',
			// #endif
			// #ifdef MP-TOUTIAO
			projectId:'dy',
			// #endif
			// #ifdef MP-KUAISHOU
			projectId:'ks',
			// #endif
			canShowAd : false,//是否能显示广告组件
			
			
			
			shareInfo:null,//分享信息
			adInfo:null,//广告信息
			openid:'',//用户openid
			hasLogin:false,//是否登录了
			
			ad_number:0,//记录可看广告次数
			illegal_ad_number:0,//记录已看广告次数
			free_ad_num:0,//免费赠送的广告下载次数
			illfree_ad_num:0,//已使用免费下载次数
			de_ad_number:0,//原始可看广告次数
			adRequestRes:false,//请求当前用户看广告的响应
		}
	}
</script>

<style>
	image {
		height: auto;
	}
	
	.loading {
		display: block;
		padding: 20rpx 0;
		text-align: center;
		color: #999;
		font-size: 28rpx;
	}
	
	.loading-bg {
		position: relative;
	}
	.loading-bg image {
		position: relative;
		z-index: 1;
	}
	.loading-bg:before {
		animation: loadingAnimation infinite 1s;
		display: block;
		content: '';
		width: 60rpx;
		height: 60rpx;
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 0;
		margin: -30rpx 0 0 -30rpx;
		// background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABbdJREFUeF7tmv9P20YUwO+d4xCgUTpgldaplG20SRxjWCNVo6MSW7X9sPXP3Q+T1kl0ZWq7KivFjkNY1LGyUXWU0gJLYzu+m65KquDa9C65ECLiH8nz+/K5996d3wHolD9wyuNHAwCDDDjlBAYlcMoTYNAEByUwKIEeEzAMY3RsbMxZWlqq98KVnpeArus3m4FTSv/DGNd83/+nWq3+u7GxUes2lBMFIBgspfSZqqrbrutu2bbtdgPGiQbQkhlVVVUfr6ysbMiG0BcAWoJ+4fv+n6VS6aksEP0G4E3ciqKsP3r0aF0GhJ4DmJ+fH97d3R2Jx+PDADDied45jPHZ9wUnC0LPAYQFyrZGhNA5QshFhNCZKBgyIJxIAM2A8/m86nnep5TSzyilOAwEANimaT5+X8ZE/X6iAbSASLmuO0cpTYYEQuv1+r21tbWddiD0BQAWWDqdTsbj8SthEAghL4eHh+8XCgVPFEJbAHRdv2BZ1qaosU7lj4IAAH+ZpmmK2hAGMDc3d7Zery8AwI7neevtpp6oo015wzBYc7wa0Q9+NU1zV0S3MADDMHRCyFTLKW2TUlrq1lE1LJhsNntJUZR08DcAqJimudY1AKwrO47zFUIoHjRiWdYPIoY7ldU07SrG+FyrHgDYN03ztohuoQzIZDJTsVhMDzHwxLKsVRHDncqyPoQQmg3qqdVqv1QqlT1e/UIAdF03EEKTQeVDQ0N3CoXCK16jMuQa2biIEBpq1Sd6OBICMDMzM08pHW81SAjZtm37voygRHUE+xF7HwCemqZZ4NUlBEDX9W+D9S9KnNcxHrlsNntRUZSZTvoAN4Dp6emhRCLxTdAxVVXvP3z4cJvHYdky+Xx+wnGcLzppyNwAMpnMeCwWmw8am5iY+LFX8zz2Jbm/v38j6JPnebfL5fI+D3BuAPl8PuU4zvWTBICVvK7r34ecB7gPRNwA2CcqIYSdAQ49yWTy57t3777moS1bJqosu5IBmqbFMcasCR56erEFNh3QNO0MxphthYeeg4ODW7wTZe4MQAhhXde/C1nFB5ZlPZO9ujz6crncGABc66QsRQAgwzBuEEKGWw32chucnZ297Pv+5WPZBZgRTdM+xxh/3GqQze6LxeIDnhWTLZPL5b4EgA9a9WKMn6+urt7jtSWaAZ8QQnKtygGgZprmLV6DsuSi6p9SulYsFiu8doQARNUcIWTVtu0nvEZlyEWlfywWW15ZWXnJa0MIwOLiYmxnZ2eRUppoNUAIeWXb9h1eo53KTU1NJZLJ5ELQD4TQgWVZSyL6hQAwxblcbhoAMkEjx5kFUavv+365VCr90VUALAu2t7evAwCb3b99AIA4jvPb+vr6cxEHRGXZSM73/WvBMTm7WU4kEsuig1HhDGAOG4bxTjNsBOJYlvWTaFAC8mAYxtfBrZi93+79QFsAmD3DMBYIIamQUnhp2/ayQFDcopqmLYRdmwHAnmmazCbhVtYQbBcAy4LI6SxCyAWAB6IT2ijn0+n0+Xg8PkspVcJkPM/7vVwub4kG/yZz2nmp+U5UM2r+zk6JIyMjm+1+LDW6/SVKKbsjDH06bb4dAWj0gyuEkPNRDlJKPUrp367rbvIOK1ngqVRqkhAyGbLVvTUleugJ87FjAExp1LA0aJBdpmCMd2q12tPgwIJ1d8dxUqzGMcYfHhU40ytrFikFQCMTjuoJnVTaO+9SSh8Xi0VbhlJpABoQRuv1ei54YSHDUaaDUlolhJRO/L/INC4t2MXFmKTgXYzx1t7eXoV30MFrV2oGBI1ms9mPAOBCuxlBKd1VFGWrWq1uVSoVhzcoEbmuAmg6wgaqruuO+74/oSjKeNR+zj6tAeAF+7hSVXXvOMbtxwIguCJsxB782+jo6OtCoVAVWT0Zsj0BIMNxWToGAGSR7Fc9gwzo15WT5fcgA2SR7Fc9gwzo15WT5fepz4D/AabdiV9gyGHqAAAAAElFTkSuQmCC') no-repeat 100%/100%;
	}
	
	.loading-bg.white:before {
		width: 100rpx;
		height: 100rpx;
		margin: -50rpx 0 0 -50rpx;
		// background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABHxJREFUeF7tmtmrHEUUxr/PfcVdUHGPC7j7IK5gFH1Q/1wfhERITITEoA8RYowhaqIJMVGzaRIVP/mwBiZF99w6PTXdfZk+MNwLU3OWX506VX2qiTUXrnn8mABMGbDmBKYlsOYJMBXBaQlMS2BgApJuBnCZ5D9DuDL4EpD00VzgfwC4BOBnAL+Q9P8rlbEByIM9CeAUgOMk/1oFibEDmMX8J4AjJH+oDWGzAJjF/RuA70meqAViswGYxX2I5KEaEMYA4EYANwGY/b0XwO0FwVWBMDiApkDT1mgQDwO4ZQGMpSGMEsAsYEnXAngMwOMArmoBcYDkkYKMaRwyagBzIG4D8CKAWxuiEIA9JH/tAmFTAHBgkhz8yy0QzgDYS/LvKIROACQ9SPJY1Niy4zeA8CPJr6M2wgAkuUK/CcAp5yLUKfWijs4tBxfHV1p+/znJ3yO6uwB4FsAjc0acCd+s6qjasks8AeCphu8Okzy4MgCpKm8FcF1uhOTHEcPLjpXkLHA2zMt5kjsjukMZIMkz7wzI5SjJ/RHDy451HQLwQoOez0ieK9UfBfA8gIcalO8iebbUaI1xKRvfBnB9pi90OIoCeA3AXZnBUyT31ggqqkNSXo+s4gTJL0t1RQG837D+Q8RLHSsZJ8lH5eeWqQPFACQ51d5rcMwHEDctehdJdwN4NTccKcgRAE59L4FcPhmqnyfJT5DvNvi0k+T5khmJAPB5/K2RAbD/Hzb4VHwgigBw99ZngFw+JXmxhHbtMQuW5UoywIcfF8Fcet8CZw5Icq/AW2Eu20s7ypEM8PP4Bw3G9pF097Z3kXQngNeXWZbFAGxEkguOC8+8DLkNPgnAnytkJbtAAvASgAcyeydJ7ut9+v+fkDcA3JHZPk1yT6k/0Qx4FMAzmfJLJLeXGqw1bsH6P0jycKmdKIC2Nbef5NFSozXGSWpMfwC7SbpDVCRRANekqntDpv0syV1FFisMkmT7bsrkflwguSNiIgQg1YEtAJ5uMNJbFiyY/W9JfrdqAM4Cnwh9MJqXfwF8QfJ0xIHo2NSS89aXt8l9s+z0DzVGwxmQsqCpGPor3/NviwZVOl6S/X2nYSu2ik73A10B+Hdeg34+yOUMyd2lQUXGSbLNpmszd4A8+87CkHQCkLJgUXfWd/k+IYY6tG2eS7o/tb+ubhnzFcnjocjT4M4AEoS2rWjmi29wj3V9WErV3h1gNz7aZKniuxSABMG3NZ6hNnFR+imBKGpWpsDde/Qn3+rm7YQOPU0OLg0gQWhrluY2fYnij/t2VzQsUnV3TfEav2eDwK23Si+yCoCCmtBleS76jV+XOVBDaTUACYLPBn5WyC8savhqHX5XyLdQ435FJl1a+OLCzw41xLuKq7yvvqq+Olc1A/JIJd0HwCC6ZoS3UQfu1+Qu1yCZ61gpgJkxSS5u7iq7je2/bfu5Z9dvgvmW6Vwf7fZeADRkRn675CEXSXqN9yqDAOg1wg2MTQDGNBtD+DJlwBDUx2RzyoAxzcYQvkwZMAT1Mdlc+wz4D6Vye1Ah2UoyAAAAAElFTkSuQmCC') no-repeat 100%/100%;
	}
	
	@keyframes loadingAnimation{
		from {
			transform: rotate(0);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	.label-rel {
		position: relative;
	}
	.label-gif {
		position: absolute;
		z-index: 9;
		background: rgba(0, 0, 0, .6);
		color: white;
		font-size: 24rpx;
		right: 0;
		bottom: 0;
		font-weight: bold;
		padding: 0 14rpx;
		border-top-left-radius: 12rpx;
		border-bottom-right-radius: 12rpx;
	}
</style>

<template>
	<view class="view loading-bg white">
		<image class="view-img" :src="src" mode="widthFix"  v-if="type == 0"></image>
		<view class="view-img" v-else-if="type == 1">
		<!-- #ifdef MP-KUAISHOU -->
			<video class="view-img"
			style="height: 80%;"
			:src="src" 
			:controls="true" 
			:show-center-play-btn="true"
			:auto-pause-if-navigate="true"
			:show-progress="true" 
			:show-play-btn="true" 
			 
			play-btn-position="center" 
			enable-play-gesture="true"></video>
			</view>
		<!-- #endif -->
		<!-- #ifndef MP-KUAISHOU-->
			<video class="view-img"
			:src="src" 
			:controls="true" 
			:show-center-play-btn="true"
			:auto-pause-if-navigate="true"
			:show-progress="true" 
			:show-play-btn="true" 
			 
			play-btn-position="center" 
			enable-play-gesture="true"></video>
			</view>
		<!-- #endif -->
		
		<image class="view-img-normal" :src="src" mode="widthFix"  v-else></image>
		<!-- #ifdef MP-KUAISHOU -->
		<view class="view-btns kuaishou" :class="{show: btnsShow}">
		<!-- #endif -->
		<!-- #ifndef MP-KUAISHOU -->
		<view class="view-btns" :class="{show: btnsShow}">
		<!-- #endif -->
			<button class="view-btn" @click="backAction">
				<image src="../../static/images/icon-back.png" mode="widthFix"></image>
				<text>返回</text>
			</button>
			<!-- #ifdef MP-QQ||MP-KUAISHOU -->
			<button class="view-btn" @click="downloadShow">
				<image src="../../static/images/icon-download.png" mode="widthFix"></image>
				<text>下载</text>
			</button>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN||MP-TOUTIAO -->
			<button class="view-btn" @click="downloadShow" v-if="hasUserInfo">
				<image src="../../static/images/icon-download.png" mode="widthFix"></image>
				<text>下载</text>
			</button>
			<button class="view-btn" @click="getUserProfile" v-else>
				<image src="../../static/images/icon-download.png" mode="widthFix"></image>
				<text>下载</text>
			</button>
			<!-- #endif -->
			<button class="view-btn" open-type="share">
				<image src="../../static/images/icon-share.png" mode="widthFix"></image>
				<text>分享</text>
			</button>
			<button class="view-btn" @click="doCollection">
				<image src="../../static/images/icon-collect.png" mode="widthFix" v-if="dealCollection != 2"></image>
				<image src="../../static/images/icon-collect2.png" mode="widthFix" v-else></image>
				<text>收藏</text>
			</button>
			<button class="view-btn" @click="doZan" v-if="canZan">
				<image src="../../static/images/icon-like.png" mode="widthFix"></image>
				<text>点赞</text>
			</button>
			<button class="view-btn" v-else>
				<image src="../../static/images/icon-like2.png" mode="widthFix"></image>
				<text>点赞</text>
			</button>
		</view>
		<view class="download-panel" v-if="downloadVisible">
			<div class="download-panelc">
				<image src="../../static/images/icon-close.png" mode="widthFix" @click="downloadHide"></image>
				<view class="download-item" @click="downloadAction(0)">
					<view class="download-it">
						<view class="download-itl">
							<view class="download-title">超清无水印原图</view>
							<view class="download-desc">看完广告，即可获取</view>
						</view>
						<view class="download-btn active">
							<image src="../../static/images/icon-play.png" mode="widthFix"></image>
							超清下载
						</view>
					</view>
					<!--<view class="download-ib">
						看{{ad_number}}次广告，可额外获赠{{free_ad_num}}次免广告超清下载
					</view>-->
				</view>
				<!-- <view class="download-item" @click="downloadAction(1)">
					<view class="download-it">
						<view class="download-itl">
							<view class="download-title">普通图片</view>
							<view class="download-desc">普通画质，免广告下载</view>
						</view>
						<view class="download-btn">
							<image src="../../static/images/icon-cloud-download.png" mode="widthFix"></image>
							普通下载
						</view>
					</view>
				</view> -->
			</div>
		</view>
	</view>
</template>

<script>
	import config from '../../utils/config.js';
	import request from '../../utils/request.js';
	import utils from '../../utils/utils.js';
	const app = getApp()
	let rewardedVideoAd = null; //快手激励广告组件

	// 在页面中定义激励视频广告 微信、qq、抖音平台
	let videoAd = null

	// #ifdef MP-WEIXIN || MP-QQ || MP-TOUTIAO
	// 在页面中定义插屏广告
	let interstitialAd = null
	// #endif
	export default {
		data() {
			return {
				id: 0,
				btnsShow: true,
				src: '',//看广告保存的图片路径
				src2:'',//普通下载的图片路径
				type: 0, // 类型 0 手机壁纸 1 动态壁纸 2 背景图 3 头像 5 表情包
				downloadVisible: false,
				img_type: 1, //素材类型 1-手机壁纸、2-动态壁纸、3-背景图、4-头像、5-表情包

				selfnterval: null, //定义循环实例插屏对象的逻辑
				hasShowChaping: null, //定义第一次展示插屏内容的逻辑
				selfntervalJili: null, //定义循环实例激励对象的逻辑

				userInfo: {},
				hasUserInfo: false,

				dealCollection: 0, //0-系统状态未正常  1-收藏 2-取消收藏
				canZan: true, //是否能点赞，默认可以
				
				localAdType:1,//当前下载是普通下载还是看广告下载 默认普通下载
				
				ad_number:3,
				free_ad_num:10,
				
				openidNeterval:null,//定义循环获取openid的逻辑
				adNeterval:null,//定义循环获取广告的逻辑
			}
		},
		onLoad(options) {
			this.src = options.src || '';
			this.src2 = options.src2 || '';
			this.id = options.id || 0;
			this.type = options.type || 0;
			this.img_type = options.img_type || 1;

			app.saveAnalysisInfo(2,this.id)
			console.log(options)

			let _this = this
			
			this.openidNeterval = setInterval(function(){
				if(app.globalData.openid){
					//根据openid判断当前用户是否授权过，是的话就无需再授权
					_this.getUserSystemInfo();
					
					//查询当前用户是否有收藏素材
					_this.checkCollection();
					
					//查询当前用户是否有点赞过
					_this.checkZan();
					
					clearInterval(_this.openidNeterval);
				}
			},10)
			

			////////////////////////////////////
			//激励、插屏广告组件实例
			this.selfnterval =  setInterval(function(){
				if(app.globalData.adInfo != null && app.globalData.adInfo.chaping != ''){
					if(app.globalData.canShowAd){
						// #ifdef MP-WEIXIN ||MP-QQ
						if (uni.createInterstitialAd) {
						  interstitialAd = uni.createInterstitialAd({
						    adUnitId: app.globalData.adInfo.chaping
						  })
						  interstitialAd.onLoad(() => {})
						  interstitialAd.onError((err) => {})
						  interstitialAd.onClose(() => {
							  //当第一次出现后就不会再进行调用显示，如果想循环显示插屏，就注释这行代码
							  clearInterval(_this.hasShowChaping);console.log('关闭了插屏')
							  })
						  console.log('实例化了')
						  console.log(interstitialAd)
						  
						}
						// #endif
						
						// #ifdef MP-TOUTIAO
						interstitialAd = tt.createInterstitialAd({
						  adUnitId: app.globalData.adInfo.chaping,
						});
						// #endif
					}
					
					clearInterval(_this.selfnterval);
				}
			},200)

			this.selfntervalJili =  setInterval(function(){
				if (app.globalData.adInfo != null && app.globalData.adInfo.jili != '') {
					if (app.globalData.canShowAd) {
						//能实例广告组件的情况下才处理
						// #ifdef MP-KUAISHOU
						rewardedVideoAd = ks.createRewardedVideoAd({
							type: 100011056,
							unitId: parseInt(app.globalData.adInfo.jili),
						});
						rewardedVideoAd.onLoad(() => {
							console.log('onLoad event emit');
						});
						rewardedVideoAd.onError(({
							errCode
						}) => {
							console.log('onError event emit', errCode);
						});
						rewardedVideoAd.onClose(({
							isEnded
						}) => {
							console.log('onClose event emit', isEnded);
							if (isEnded == 1) {
								_this.afterAdOperate()
								
							} else {
								_this.stopAdOperate()
							}
						});
						// #endif
				
						// #ifdef MP-WEIXIN ||MP-QQ
						if (uni.createRewardedVideoAd) {
							console.log(app.globalData.adInfo.jili)
							rewardedVideoAd = uni.createRewardedVideoAd({
								adUnitId: app.globalData.adInfo.jili,
							})
							rewardedVideoAd.onLoad(() => {})
							rewardedVideoAd.onError((err) => {})
							rewardedVideoAd.onClose((res) => {
								console.log('videoAd onClose', res)
								if (res.isEnded) {
									_this.afterAdOperate()
									
								} else {
									_this.stopAdOperate()
								}
							})
						}
						// #endif
				
						// #ifdef MP-TOUTIAO
						const info = uni.getSystemInfoSync();
						if (info.appName.toUpperCase() === 'DOUYIN') {
							rewardedVideoAd = uni.createRewardedVideoAd({
								adUnitId: app.globalData.adInfo.jili,
							});
							//可以看激励广告
							try {
								if (rewardedVideoAd.closeFunc) {
									rewardedVideoAd.offClose(rewardedVideoAd.closeFunc);
								}
							} catch (e) {
								uni.showToast({
									title: '保存失败！！',
									icon: 'none'
								})
							}
							rewardedVideoAd.closeFunc = function(res) {
								// 用户点击了【关闭广告】按钮
								// 小于基础库版本，res 是一个 undefined
								if (res && res.isEnded || res === undefined) { // 正常播放结束，可以下发游戏奖励
									
									_this.afterAdOperate()
									
								} else {
									_this.stopAdOperate()
								}
							};
							rewardedVideoAd.onClose(rewardedVideoAd.closeFunc);
						} else {
							app.globalData.canShowAd = false
						}
						// #endif
					}
					clearInterval(_this.selfntervalJili);
				}
			},200)
			
			////////////////////////////////////	
			
			this.adNeterval = setInterval(function(){
				if(app.globalData.adRequestRes){
					_this.ad_number = app.globalData.de_ad_number
					_this.free_ad_num = app.globalData.free_ad_num
					clearInterval(_this.adNeterval)
				}
			},10)
			

		},
		onUnload() {
			// #ifdef MP-KUAISHOU
			rewardedVideoAd.destroy();
			rewardedVideoAd = null;
			// #endif
		},
		onShow() {
			let _this = this
			// #ifdef MP-WEIXIN ||MP-QQ
			// 在适合的场景显示插屏广告
			this.hasShowChaping = setInterval(function() {
				if (interstitialAd) {
					interstitialAd.show().catch((err) => {
						console.error(err)
					})
				}
			}, 300)

			// #endif
			// #ifdef MP-TOUTIAO
			if(interstitialAd){
				interstitialAd
				  .load()
				  .then(() => {
				    interstitialAd.show();
				  })
				  .then(()=>{
					  
				  })
				  .catch((err) => {
				    console.log(err);
				  });
			}
			// #endif
		},
		methods: {
			//看完广告后的操作函数
			afterAdOperate(){
				this.downloadStart();
				//走分销处理
				app.dealPp(this.id,this.userInfo.nickName,this.userInfo.avatarUrl);
				//增加看广告记录
				app.addAdLog()
				//数据统计
				app.saveAnalysisInfo(5,this.id)
			},
			//中途退出看广告的操作函数
			stopAdOperate(){
				//数据统计
				app.saveAnalysisInfo(6,this.id)
				uni.showToast({
					title: '请看完广告才能下载',
					icon: 'none'
				})
			},
			// #ifdef MP-WEIXIN || MP-TOUTIAO
			getUserProfile(e) {
				let that = this
				// 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
				// 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
				uni.getUserProfile({
					desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
					success: (res) => {
						console.log(res.userInfo)
						that.userInfo = res.userInfo
						that.hasUserInfo = true
						//存储用户信息
						app.saveUserInfo(res.userInfo.avatarUrl, res.userInfo.nickName)
						console.log(that.userInfo)
						that.downloadShow()
					},
					fail() {
						uni.showToast({
							title:'请授权更好体验小程序',
							icon:'none'
						})
					}
				})
			},
			// #endif

			async getUserSystemInfo() {
				let _this = this
				const r = await request({
					url: `${config.API}api/user/getInfo`,
					method: 'POST',
					data: {
						openid: app.globalData.openid,
						platform: app.globalData.projectId
					}
				});

				if (r.error_code === 0) {
					_this.hasUserInfo = true
					_this.userInfo = r.data
				} else {
					// #ifdef MP-KUAISHOU
					//进来就授权,微信需要点击下载的时候触发用户授权
					uni.login({
						success(res) {
							_this.code = res.code;
							uni.getUserInfo({
								withCredentials: true,
								success(e) {
									//存储用户信息
									app.saveUserInfo(e.userInfo.avatarUrl, e.userInfo.nickName)
									_this.userInfo = e.userInfo
									_this.hasUserInfo = true
								},
								fail(e) {
									_this.get_openSetting();
								}
							})
						}
					})
					// #endif
				}
			},
			//处理下载统计功能
			async addDownCount() {
				const r = await request({
					url: `${config.API}api/w/addDownCount`,
					method: 'POST',
					data: {
						id: this.id,
					}
				});
			},
			
			//处理收藏功能
			async checkCollection() {
				if (app.globalData.openid) {
					const r = await request({
						url: `${config.API}api/w/checkCollection`,
						method: 'POST',
						data: {
							id: this.id,
							openid: app.globalData.openid,
							platform: app.globalData.projectId,
						}
					});

					if (r.error_code === 0) {
						this.dealCollection = 2; //已经收藏了，改成取消收藏
					} else {
						this.dealCollection = 1; //待收藏
					}
				}
			},
			async doCollection() {
				if (app.globalData.openid && this.dealCollection != 0) {
					const r = await request({
						url: `${config.API}api/w/doCollection`,
						method: 'POST',
						data: {
							id: this.id,
							openid: app.globalData.openid,
							platform: app.globalData.projectId,
							status: this.dealCollection,
							type: this.img_type,
						}
					});
					if (r.error_code == 0) {
						this.dealCollection = this.dealCollection == 1 ? 2 : 1; //成功后将当前处理状态改变
						return uni.showToast({
							title: '操作成功',
							icon: 'none'
						})
					} else {
						return uni.showToast({
							title: '操作失败',
							icon: 'none'
						})
					}
				} else {
					return uni.showToast({
						title: '请稍后再试',
						icon: 'none'
					})
				}
			},
			//处理点赞功能
			async checkZan() {
				if (app.globalData.openid) {
					const r = await request({
						url: `${config.API}api/w/checkZan`,
						method: 'POST',
						data: {
							id: this.id,
							openid: app.globalData.openid,
							platform: app.globalData.projectId,
						}
					});

					if (r.error_code !== 0) {
						this.canZan = true; //能点赞
					}else{this.canZan = false;} //不能点赞
				}
			},
			async doZan() {
				if (app.globalData.openid && this.dealCollection != 0) {
					const r = await request({
						url: `${config.API}api/w/doZan`,
						method: 'POST',
						data: {
							id: this.id,
							openid: app.globalData.openid,
							platform: app.globalData.projectId,
							status: this.dealCollection,
						}
					});
					if (r.error_code == 0) {
						this.canZan = false; //成功后将当前处理状态改变
						return uni.showToast({
							title: '操作成功',
							icon: 'none'
						})
					} else {
						return uni.showToast({
							title: '操作失败',
							icon: 'none'
						})
					}
				} else {
					return uni.showToast({
						title: '请稍后再试',
						icon: 'none'
					})
				}
			},
			showRewardedVideoAd() {
				let _this = this
				rewardedVideoAd.show()
					.catch(() => {
						rewardedVideoAd.load()
							.then(() => rewardedVideoAd.show())
							.catch(err => {
								app.saveAnalysisInfo(7,_this.id)
								uni.showToast({
									title: '广告显示失败',
									icon: 'none'
								})
							});
					});
			},
			get_openSetting() {
				let _this = this
				uni.showModal({
					title: "温馨提示",
					content: "为了更好的体验小程序,请先授权~",
					showCancel: false,
					success: (res) => {
						uni.openSetting({
							success(e) {
								if (e.authSetting['scope.userInfo']) {
									uni.login({
										success(res) {
											_this.code = res.code;
											uni.getUserInfo({
												withCredentials: true,
												success(e) {
													//存储用户信息
													_this.downloadShow()
													_this.hasUserInfo = true
													_this.userInfo = e.userInfo
													app.saveUserInfo(e.userInfo
														.avatarUrl, e.userInfo
														.nickName)
												},
											})
										}
									})
								} else { //设置中未打开个人信息则继续调取打开设置授权
									uni.showToast({
										title:'请授权更好体验小程序',
										icon:'none'
									})
								}
							}
						})
					}
				});

			},
			toggleBtns() {
				this.btnsShow = !this.btnsShow;
			},
			backAction() {
				uni.navigateBack({
					fail(res) {
						console.log(res)
						console.log("navigateBack调用失败");
						uni.switchTab({
							url: '/pages/index/index'
						})
					  },
				});
			},
			downloadShow() {
				let _this = this
				//在点击下载的时候判断用户是否授权相册，没有的话需授权相册权限后才能做正常操作
				this.authPhoto(function() {
					// #ifndef MP-KUAISHOU
					_this.downloadVisible = true
					// #endif
					// #ifdef MP-KUAISHOU
					//快手因为视频图层问题，直接走看广告模式
					_this.downloadAction(0)
					// #endif
					console.log('授权相册处理')
				})
			},
			downloadHide() {
				this.downloadVisible = false;
			},
			downloadAction(type) {
				let that = this
				if (type == 1) {
					this.localAdType = 1
					uni.showLoading({
						title: '正在下载中...'
					});
					setTimeout(function(){
						that.downloadStart();
					},1500)
					app.saveAnalysisInfo(4,that.id)
				} else {
					//系统能正常看广告且满足在看广告次数范围内
					if (app.globalData.canShowAd && app.globalData.illegal_ad_number < app.globalData.ad_number) {
						that.localAdType = 0
						that.showRewardedVideoAd();
						app.saveAnalysisInfo(3,that.id)
					} else {
						//如果原始次数看完，走免费次数判断是否能免费下载
						if(app.globalData.illfree_ad_num < app.globalData.free_ad_num){
							that.localAdType = 0
							that.downloadStart();
							app.addFreeAdLog()
						}else{
							return uni.showToast({
								title:'今日可下载次数用完',
								icon:'none'
							})
						}
					}
				}


			},
			downloadStart() {
				uni.showLoading({
					title: '正在下载中...'
				});
				//看广告的走原图原视频下载
				console.log(this.localAdType)
				const that = this;
				that.downloadHide(); //隐藏弹窗然后下载 
				if (this.type == 1 && this.localAdType==0) {
					uni.downloadFile({
						url: this.src,
						success: r => {
							console.log(r);
							if (r.statusCode === 200) {
								uni.saveVideoToPhotosAlbum({
									filePath: r.tempFilePath,
									success: function() {
										//总下载统计
										app.saveAnalysisInfo(8,that.id)
										uni.hideLoading();
										uni.showToast({
											title: '保存成功',
											icon: 'success',
											duration: 1000
										});
									},
									fail: function(e) {
										uni.hideLoading();
										console.log(e);
										if (e.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || e.errMsg ===
											"saveImageToPhotosAlbum:fail auth deny" || e.errMsg ===
											"saveImageToPhotosAlbum:fail authorize no response") {
											uni.showToast({
												title: '需要开启相册权限',
												icon: 'success',
												duration: 1000
											});
											that.authPhoto(() => that.downloadAction(that.localAdType));
										} else {
											uni.showToast({
												title: '怎么不保存啦',
												icon: 'success',
												duration: 1000
											});
										}
									}
								});
							}
						},
						fail: err => {
							uni.showToast('保存失败！');
						}
					})
				} else {
					uni.getImageInfo({
						src: this.localAdType==0?this.src:this.src2,
						success: r => {
							uni.saveImageToPhotosAlbum({
								filePath: r.path,
								success: function() {
									//总下载统计
									app.saveAnalysisInfo(8,that.id)
									uni.hideLoading();
									uni.showToast({
										title: '保存成功',
										icon: 'success',
										duration: 1000
									})
								},
								fail: function(e) {
									uni.hideLoading();
									if (e.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || e
										.errMsg === "saveImageToPhotosAlbum:fail auth deny" || e
										.errMsg === "saveImageToPhotosAlbum:fail authorize no response"
										) {
										uni.showToast({
											title: '需要开启相册权限',
											icon: 'success',
											duration: 1000
										});
										that.authPhoto(() => that.downloadAction(that.localAdType));
									} else {
										uni.showToast({
											title: '怎么不保存啦',
											icon: 'success',
											duration: 1000
										});
									}
								}
							});
						},
						fail: (err) => {
							uni.hideLoading();
							uni.showModal({
								title: "提示",
								content: "当前客户端版本过低，无法使用该功能，请升级客户端",
							});
						}
					});
				}
			},
			// 授权相册
			authPhoto(callback) {
				let that = this;
				uni.getSetting({
					success(res) {
						console.log(res)
						//区分环境下的权限授权问题
						// #ifdef MP-TOUTIAO
						if (!res.authSetting['scope.album']) {
						// #endif
						// #ifdef MP-QQ||MP-WEIXIN||MP-KUAISHOU
						if (!res.authSetting['scope.writePhotosAlbum']) {
						// #endif
							uni.authorize({
								// #ifdef MP-TOUTIAO
								scope: "scope.album",
								// #endif
								// #ifdef MP-QQ||MP-WEIXIN||MP-KUAISHOU
								scope: "scope.writePhotosAlbum",
								// #endif
								success() {
									callback && callback();
								},
								fail(err) {
									console.log(err)
									uni.openSetting({
										success(s) {
											// #ifdef MP-TOUTIAO
											if (s.authSetting['scope.album'] == true) {
											// #endif
											// #ifdef MP-QQ||MP-WEIXIN||MP-KUAISHOU
											if (s.authSetting['scope.writePhotosAlbum'] == true) {
											// #endif
											
												callback && callback();
											} else {
												uni.showToast({
													title: '授权权限才能下载',
													icon: 'none'
												});
											}
										},
										fail(f) {
											console.log(f)
											uni.showToast({
												title: '请到设置里开启相册权限',
												icon: 'none'
											});
										}
									})
								}
							});
						} else {
							callback && callback();
						}
					},
					fail: (err) => {
						uni.showModal({
						    title: "提示",
						    content:
						      "授权权限才能下载！",
						  });
					}
				})
			}
		},

		onShareAppMessage(r) {
			console.log(`src=${this.src}&src2=${this.src2}&id=${this.id}&type=${this.type}&img_type=${this.img_type}`)
			let _path = `/pages/detail/index?src=${this.src}&src2=${this.src2}&id=${this.id}&type=${this.type}&img_type=${this.img_type}`
			// #ifdef MP-TOUTIAO
			if (app.globalData.shareInfo.share_id != '') {
				return {
					templateId: app.globalData.shareInfo.share_id,
					path: _path,
				}
			} else {
				return {
					title: app.globalData.shareInfo.share_title,
					desc: app.globalData.shareInfo.share_desc,
					path: _path,
				}
			}
			// #endif
			// #ifdef MP-QQ||MP-WEIXIN||MP-KUAISHOU
			return {
				title: app.globalData.shareInfo.share_title,
				desc: app.globalData.shareInfo.share_desc,
				path: _path,
			}
			// #endif
		},
	}
</script>

<style>
	page {
		background: white;
		width: 100%;
		height: 100%;
	}
</style>
<style lang="scss" scoped>
	.view {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		.view-img {
			display: block;
			width: 100%;
			height: 100%;
			position:relative;
			z-index: 0;
		}

		.view-btns {
			background-color: rgba(0, 0, 0, .8);
			display: flex;
			flex-direction: column;
			padding: 30rpx 20rpx 20rpx 20rpx;
			border-radius: 100rpx;
			position: fixed;
			z-index: 2;
			bottom: 40rpx;
			right: 40rpx;
			transition-duration: 1s;
			transform: translateY(100px);
			&.show {
				transform: translateY(-50px);
			}
			&.kuaishou {
				left: 40rpx;
				bottom: 0;
				flex-direction: row;
				&.show {
					transform: translateY(-20px);
				}
				.view-btn {
					margin: 0;
				}
			}
		}
		.view-btn {
			background: none;
			border: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin: 30rpx 0;
			image {
				display: block;
				width: 32rpx;
			}
			text {
				display: block;
				color: #999;
				font-size: 24rpx;
				height: 32rpx;
				line-height: 32rpx;
				margin-top: 10rpx;
			}
			&:after {
				border: 0;
			}
		}

	}

	.download-panel {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background-color: rgba(0, 0, 0, .8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;

		.download-panelc {
			background-color: white;
			border-radius: 10rpx;
			padding-bottom: 60rpx;
			width: 80%;
			display: flex;
			flex-direction: column;
			align-items: flex-end;

			&>image {
				display: block;
				width: 50rpx;
				margin: 20rpx 20rpx 0 0;
			}

			.download-item {
				padding: 30rpx 50rpx 0;
				font-size: 24rpx;
				width: 100%;
				box-sizing: border-box;

				.download-it {
					display: flex;
					align-items: center;
				}

				.download-itl {
					flex: 1;
					align-items: flex-start;
				}

				.download-btn {
					display: flex;
					align-items: center;
					color: white;
					padding: 12rpx 20rpx;
					border-radius: 10rpx;
					background-color: #aaa;

					&.active {
						background-color: #3D88FE;
					}

					image {
						display: block;
						width: 30rpx;
						margin-right: 10rpx;
					}
				}

				.download-title {
					font-size: 32rpx;
				}

				.download-desc {
					color: #666;
					margin-top: 10rpx;
				}

				.download-ib {
					color: orange;
					margin-top: 10rpx;
				}
			}
		}
	}

	.view-img-normal {
		display: block;
		width: 100%;
	}
</style>

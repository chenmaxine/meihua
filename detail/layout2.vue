<template>
	<view class="detail2">
		<!-- <view class="detail2-sm" @click="openStatement">声明</view> -->
		<!-- <view class="android-tips">提醒：个别android手机保存后是静态图，但不影响使用</view> -->
		<!-- #ifdef MP-TOUTIAO -->
		<view class="service" @click="redirectKefu">
			<image src="../../static/images/kefu.png" mode="widthFix"></image>
			<text>客服</text>
		</view>
		<!-- #endif -->
		<!-- #ifdef MP-WEIXIN -->
		<view class="service">
			<button open-type="contact" type="default" plain="true" hover-class="none">
				<text>客服</text>
			</button>
		</view>
		<!-- #endif -->
		<view class="detail2-thumb">
			<view class="detail2-imgcontent loading-bg" :style="{height: windowWidth * .58 + 'px'}">
				<image :src="src" mode="scaleToFill"></image>
				<image class="watermark" src="../../static/images/watermark.png" mode="scaleToFill"></image>
			</view>
			<!--<view class="detail2-tips">看{{ad_number}}次广告，可额外获赠{{free_ad_num}}次免广告超清下载</view>-->
			
			<view class="single-btn" v-if="expression_video == ''">
				<!-- #ifdef MP-QQ||MP-KUAISHOU -->
				<button class="detail2-submit" @click="changeDownLoadType(1)">看广告下载素材</button>
				<!-- #endif -->
				<!-- #ifdef MP-WEIXIN||MP-TOUTIAO -->
				<button class="detail2-submit" @click="changeDownLoadType(1)" v-if="hasUserInfo">看广告下载素材</button>
				<button class="detail2-submit"  @click="getUserProfile" v-else>看广告下载素材</button>
				<!-- #endif -->
			</view>
			
			<view class="detail2-btns" v-else>
				<!-- #ifdef MP-QQ||MP-KUAISHOU -->
				<button class="detail2-submit" @click="changeDownLoadType(1)">看广告下载素材</button>
				<!-- #endif -->
				<!-- #ifdef MP-WEIXIN||MP-TOUTIAO -->
				<button class="detail2-submit" @click="changeDownLoadType(1)" v-if="hasUserInfo">看广告下载素材</button>
				<button class="detail2-submit"  @click="getUserProfile" v-else>看广告下载素材</button>
				<!-- #endif -->
				
				<!-- #ifdef MP-QQ||MP-KUAISHOU -->
				<button class="detail2-submit" @click="changeDownLoadType(2)">看广告下载原视频</button>
				<!-- #endif -->
				<!-- #ifdef MP-WEIXIN||MP-TOUTIAO -->
				<button class="detail2-submit" @click="changeDownLoadType(2)" v-if="hasUserInfo">看广告下载原视频</button>
				<button class="detail2-submit"  @click="getUserProfile" v-else>看广告下载原视频</button>
				<!-- #endif -->
			</view>

		</view>
		<view class="detail2-list">
			<view class="detail2-dt">
				相关推荐
			</view>
			<scroll-view style="height: 500rpx;" :scroll-y="true" @scrolltolower="loadMoreRecom">
				<view class="detail2-dd">
					<view class="navigator-self loading-bg label-rel" v-for="item in list" @click="changeWallpaper(item.img,item.id,item.type,item.img2,item.expression_show_video,item.expression_video_url)"  :key="item.id">
						<view class="item-body">
							<image :src="item.img_thumb" mode="scaleToFill"></image>
							<view class="label-gif" v-if="item.is_gif === 1">GIF</view>
						</view>
						<text v-if="item.self_name">{{item.self_name}}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		<alert title="声明" @confirm="confirmAction" ref="alert">
			<view>创作者上传的素材内容由创作者负责，部分来源于网络，如有侵权，请联系小程序官方进行删除处理！</view>
		</alert>
		<yinliu v-if="yinliuVisible" @hide="yinliuToggle(false)" />
	</view>
</template>

<script>
	import config from '../../utils/config.js';
	import utils from '../../utils/utils.js';
	import request from '../../utils/request.js';
	import Alert from '../../components/alert.vue';
	import Yinliu from './yinliu.vue';
	
	const app = getApp()
	let rewardedVideoAd = null; //快手激励广告组件
	
	// 在页面中定义激励视频广告 微信、qq、抖音平台
	let videoAd = null
	
	// #ifdef MP-WEIXIN || MP-QQ || MP-TOUTIAO
	// 在页面中定义插屏广告
	let interstitialAd = null
	// #endif
	export default {
		components: {
			Yinliu,
			Alert
		},
		data() {
			return {
				id: 0,
				src: '',//看广告保存的图片路径
				src2:'',//普通下载的图片路径
				type: 0, // 类型 0 手机壁纸 1 动态壁纸 2 背景图 3 头像 5 表情包
				img_type: 1, //素材类型 1-手机壁纸、2-动态壁纸、3-背景图、4-头像、5-表情包
				
				expression_video:'',//原视频url
				click_type:1,//默认下载素材，2-下载视频
				expression_show_video:0,//是否显示原视频按钮 1-显示
				
				userInfo: {},
				hasUserInfo: false,
				
				localAdType:0,//当前下载是普通下载还是看广告下载 默认看广告下载 0-看广告 1-不看广告
				
				windowWidth: utils.systemInfo().windowWidth,
				list: [],
				isLoading: false,
				loadOver: false,
				page: 1,
				
				ad_number:0,
				free_ad_num:0,
				
				selfnterval: null, //定义循环实例插屏对象的逻辑
				hasShowChaping: null, //定义第一次展示插屏内容的逻辑
				selfntervalJili: null, //定义循环实例激励对象的逻辑
				
				openidNeterval:null,//定义循环获取openid的逻辑
				adNeterval:null,//定义循环获取广告的逻辑
				
				yinliuVisible: false, // 引流面板
			}
		},
		onLoad(options) {
			console.log(options)
			this.src = options.src || '';
			this.src2 = options.src2 || '';
			this.id = options.id || 0;
			this.type = options.type || 0;
			this.img_type = options.img_type || 1;
			
			this.expression_video = options.e_video || '';
			this.expression_show_video = options.e_show_v ||0;
			
			app.saveAnalysisInfo(2,this.id)
			this.getData();
			
			let _this = this
			this.openidNeterval = setInterval(function(){
				if(app.globalData.openid){
					//根据openid判断当前用户是否授权过，是的话就无需再授权
					_this.getUserSystemInfo();
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
			redirectKefu(){
				//跳转抖音号
				// #ifdef MP-TOUTIAO
				tt.openAwemeUserProfile({
				  success: (res) => {
				    console.log(res);
				  },
				});
				// #endif
			},
			// :url="`/pages/detail/layout2?src=${item.img}&id=${item.id}&img_type=${item.type}&src2=${item.img2}&type=${minType}`"
			changeWallpaper(img,id,type,img2,expression_show_video,expression_video_url){
				this.src = img;
				this.src2 = img2;
				this.id = id;
				this.expression_show_video = expression_show_video;
				this.expression_video = expression_video_url;
			},
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
			// #ifdef MP-WEIXIN||MP-TOUTIAO
			getUserProfile(e) {
				let that = this
				// 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
				// 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
				uni.getUserProfile({
					desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
					success: (res) => {
						that.userInfo = res.userInfo
						that.hasUserInfo = true
						//存储用户信息
						app.saveUserInfo(res.userInfo.avatarUrl, res.userInfo.nickName)
						console.log(that.userInfo)
						//只是普通授权，不做其他操作
						// that.downloadShow()
						that.changeDownLoadType(1)
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
			async getData() {
				const r = await request({
					url: `${config.API}api/w/index/wapplaper/list`,
					method: 'POST',
					data: {
						type: this.img_type,
						page: this.page,
						wallpaper_id:this.id,
					}
				});
				this.isLoading = false;
				
				if (r.error_code === 0) {
					this.list = this.list.concat(r.data.data || []);
					if (r.data.current_page >= r.data.last_page) {
						this.loadOver = true;
					}
				}
			},
			loadMore() {
				this.page ++;
				this.getData();
			},
			/**
			 * 跳转详情
			 * @param {string} imgSrc 图片地址
			  * @param {number} id 图片id
			 * @param {number} imgType 图片类型,系统的
			  * @param {string} imgSrc2 图片缩略图地址
			 * @param {number} type 图片类型
			 */
			navigateToDetail(imgSrc,id,imgType,imgSrc2, type) {
				uni.navigateTo({
					url: `/pages/detail/index?src=${imgSrc}&type=${type}&id=${id}&img_type=${imgType}&src2=${imgSrc2}`
				});
			},
			openStatement() {
				this.$refs.alert.show();
			},
			
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
			
			changeDownLoadType(type){
				this.click_type = type
				this.downloadShow()
			},	
			downloadShow() {
				let _this = this
				//在点击下载的时候判断用户是否授权相册，没有的话需授权相册权限后才能做正常操作
				this.authPhoto(function() {
					_this.downloadAction(0)
				})
			},
			
			downloadAction(type) {
				let that = this
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
			},
			
			downloadStart() {
				uni.showLoading({
					title: '正在下载中...'
				});
				//看广告的走原图原视频下载
				const that = this;
				if (this.click_type == 2) {//看广告且是保存动态视频的逻辑
					uni.downloadFile({
						url: this.expression_video,
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
										that.yinliuToggle(true);
									},
									fail: function(e) {
										console.log(e);
										uni.hideLoading();
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
							uni.hideLoading();
							uni.showToast('保存失败！');
						}
					})
				} else {
					uni.getImageInfo({
						src: this.src,//根据当前类型判断要下载的是原图还是普通图
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
			},
			/**
			 * 显示隐藏引流面板
			 * @param {Boolean} bool 显示隐藏
			 */
			yinliuToggle(bool) {
				this.yinliuVisible = bool;
			},
			
			loadMoreRecom() {
				if (this.isLoading || this.loadOver) return;
				this.isLoading = true;
				this.loadMore();
			}
		},
		// onReachBottom() {
		// 	if (this.isLoading || this.loadOver) return;
		// 	this.isLoading = true;
		// 	this.loadMore();
		// },
		onShareAppMessage(r) {
			console.log(`src=${this.src}&src2=${this.src2}&id=${this.id}&type=${this.type}&img_type=${this.img_type}&e_show_v=${this.expression_show_video}&e_video=${this.expression_video}`)
			let _path = `/pages/detail/layout2?src=${this.src}&src2=${this.src2}&id=${this.id}&type=${this.type}&img_type=${this.img_type}&e_show_v=${this.expression_show_video}&e_video=${this.expression_video}`
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


<style scoped lang="scss">
	.detail2-sm {
		position: absolute;
		top: 30rpx;
		right: 30rpx;
		color: #3D88FE;
		font-size: 28rpx;
	}
	.detail2-thumb {
		padding: 100rpx 0 20rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		.detail2-imgcontent {
			position: relative;
			width: 58%;
			image {
				display: block;
				width: 100%;
				height: 100%;
			}
			.watermark {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
			}
		}
	}
	.detail2-tips {
		color: #3D88FE;
		font-size: 24rpx;
		margin: 20rpx 0;
	}
	.detail2-submit {
		height: 90rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 36rpx;
		padding: 0;
		border-radius: 100rpx;
		background-color: #3D88FE;
		border: 0;
		width: 75%;
		// &:before {
		// 	content: '';
		// 	display: block;
		// 	width: 0;
		// 	height: 0;
		// 	border-style: solid;
		// 	border-color: transparent transparent transparent #3D88FE;
		// 	border-width: 16rpx 0 16rpx 16rpx;
		// 	margin-right: 20rpx;
		// }
		&:after {
			border: 0;
		}
	}
	.detail2-list {
		padding: 10rpx;
		margin: 0 30rpx;
		background-color: white;
		border-radius: 20rpx;
	}
	.detail2-dt {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgb(102, 102, 102);
		font-size: 36rpx;
		&:before,
		&:after {
			display: block;
			content: '';
			width: 20%;
			height: 1px;
			background-color: #3D88FE;
			margin: 40rpx;
		}
	}
	.detail2-dd {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: auto auto auto;
		grid-gap: 10rpx;
		margin-top: 20rpx;
		.navigator-self {
			.item-body {
				display: block;
				position: relative;
				padding-bottom: 100%;
				height: 0 !important;
				image {
					position: absolute;
					display: block;
					width: 100%;
					height: 100%;
					border-radius: 10rpx;
				}
			}
			&>text {
				font-size: 24rpx;
				margin-top: 20rpx;
				display: block;
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
				width: 100%;
				text-align: center;
				margin-bottom: 10rpx;
			}
			.label-gif {
				border-bottom-right-radius: 10rpx;
			}
		}
	}
	.detail2-btns {
		display: flex;
		align-items: center;
		width: 100%;
		margin-top: 20rpx;
		button {
			flex: 1;
			margin: 0 20rpx;
			font-size: 30rpx !important;
		}
	}
	.single-btn{
		margin-top: 20rpx;
		align-items: center;
		width: 100%;
	}
	.android-tips {
		color: #3D88FE;
		font-size: 24rpx;
		text-align: center;
		padding-top: 40rpx;
	}
	.service {
		position: absolute;
		z-index: 9;
		top: 60rpx;
		right: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		image {
			display: block;
			width: 50rpx;
		}
		text {
			color: #3D88FE;
			font-size: 24rpx;
			margin-top: 6rpx;
		}
		button{
			border: none;
		}
	}
</style>

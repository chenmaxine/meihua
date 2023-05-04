<template>
	<view class="yinliu">
		<view class="yinliu-content">
			<image class="close" src="../../static/images/icon-close2.png" mode="widthFix" @click="hide"></image>
			<view class="yinliu-title">下 载 成 功</view>
			<view class="yinliu-stitle">你还可以给头像换个装扮</view>
			<image class="yinliu-img" src="../../static/images/yinliu.png" mode="widthFix"></image>
			<navigator class="yinliu-try" url="#">去试一下</navigator>
			<button class="yinliu-share" open-type="share">分享给朋友</button>
		</view>
	</view>
</template>

<script>
	export default {
		methods: {
			hide() {
				this.$emit('hide');
			}
		}
	}
</script>

<style lang="scss" scoped>
	.yinliu {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		width: 100%;
		height: 100%;
		z-index: 101;
		background-color: rgba(0, 0, 0, .8);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.yinliu-content {
		position: relative;
		background-color: white;
		border-radius: 20rpx;
		padding: 30rpx 30rpx 50rpx;
		width: 60%;
		display: flex;
		flex-direction: column;
		align-items: center;
		.close {
			position: absolute;
			top: 12rpx;
			right: 12rpx;
			display: block;
			width: 50rpx;
		}
		.yinliu-title {
			color: #258cff;
			font-size: 40rpx;
			font-weight: bold;
			color: #258cff;
		}
		.yinliu-stitle {
			font-size: 26rpx;
			color: #999;
			margin: 10rpx 0 0;
		}
		.yinliu-img {
			display: block;
			width: 80%;
			margin: 60rpx 0;
		}
		.yinliu-try {
			background-color: #258cff;
			color: white;
			font-size: 32rpx;
			padding: 10rpx 0;
			border-radius: 60rpx;
			width: 70%;
			text-align: center;
		}
		.yinliu-share {
			background: none;
			box-shadow: none;
			border: 0;
			padding: 0;
			margin: 30rpx 0 0;
			font-size: 26rpx;
			color: #555;
			height: 30rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			&::after {
				border: 0;
				background: none;
			}
		}
	}
</style>

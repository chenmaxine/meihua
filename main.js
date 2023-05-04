import App from './App';

// #ifndef VUE3
import Vue from 'vue';
Vue.config.productionTip = false;
App.mpType = 'app';

const app = new Vue({
  ...App
});

app.$mount();

app.globalData = {
  adInfo: {
    jili: null
  },
  projectId: 'your_project_id', // 请用您的实际项目ID替换
  canShowAd: false
};

app.getAdInfo = function () {
  let _this = this;
  uni.request({
    url: `${config.API}api/w/getAdInfo`,
    data: {
      projectId: _this.globalData.projectId
    },
    method: 'POST',
    success(res) {
      _this.globalData.adInfo = res.data.data;
      _this.globalData.canShowAd = res.data.data.open_ad == 1 ? true : false;
      console.log(_this.globalData.adInfo);
    }
  });
};

app.getAdInfo();
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue';

export function createApp() {
  const app = createSSRApp(App);
  return {
    app
  };
}
// #endif


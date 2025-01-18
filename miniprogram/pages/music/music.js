Page({
  data: {
    isPlaying: false,
    audioContext: null,
    randomPauseTimer: null
  },

  onLoad: function() {
    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext();
    // 使用本地音频文件
    this.audioContext.src = '/assets/music/background.mp3';
    this.audioContext.loop = true;

    // 监听音频加载状态
    this.audioContext.onError((res) => {
      console.error('音频播放错误：', res);
      wx.showToast({
        title: '音频加载失败，请确保音频文件存在',
        icon: 'none',
        duration: 2000
      });
    });

    this.audioContext.onCanplay(() => {
      console.log('音频已准备好播放');
    });

    this.audioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({ isPlaying: true });
    });

    this.audioContext.onPause(() => {
      console.log('暂停播放');
      this.setData({ isPlaying: false });
    });

    this.audioContext.onStop(() => {
      console.log('停止播放');
      this.setData({ isPlaying: false });
    });
  },

  onShow: function() {
    if (this.audioContext) {
      this.audioContext.volume = 1;
    }
  },

  onHide: function() {
    if (this.data.isPlaying) {
      this.pauseMusic();
    }
  },

  onUnload: function() {
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
    if (this.data.randomPauseTimer) {
      clearTimeout(this.data.randomPauseTimer);
    }
  },

  togglePlay: function() {
    if (this.data.isPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  },

  playMusic: function() {
    wx.showLoading({
      title: '正在播放...',
    });

    try {
      this.audioContext.play();
      this.scheduleRandomPause();
    } catch (error) {
      console.error('播放失败：', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none'
      });
    }

    setTimeout(() => {
      wx.hideLoading();
    }, 500);
  },

  pauseMusic: function() {
    try {
      this.audioContext.pause();
      if (this.data.randomPauseTimer) {
        clearTimeout(this.data.randomPauseTimer);
      }
    } catch (error) {
      console.error('暂停失败：', error);
    }
  },

  scheduleRandomPause: function() {
    if (this.data.randomPauseTimer) {
      clearTimeout(this.data.randomPauseTimer);
    }

    // 随机 10-20 秒后暂停
    const randomTime = Math.floor(Math.random() * 10000) + 10000;
    
    this.data.randomPauseTimer = setTimeout(() => {
      if (this.data.isPlaying) {
        this.audioContext.pause();
        wx.showToast({
          title: '随机暂停 5 秒',
          icon: 'none',
          duration: 2000
        });

        // 5秒后自动恢复播放
        setTimeout(() => {
          if (!this.data.isPlaying) {
            this.playMusic();
          }
        }, 5000);
      }
    }, randomTime);
  }
}); 
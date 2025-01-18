Page({
  data: {
    isPlaying: false,
    audioContext: null,
    randomPauseTimer: null,
    currentMusicIndex: 0,
    musicList: [],
    musicNames: []
  },

  onLoad: function() {
    this.scanMusicFiles();
  },

  // 扫描音乐文件
  scanMusicFiles: function() {
    const fs = wx.getFileSystemManager();
    try {
      const path = 'assets/music';
      console.log(`尝试扫描路径: ${path}`);
      const files = fs.readdirSync(path);
      console.log(`在路径 ${path} 找到的文件：`, files);
      
      // 过滤出 MP3 文件
      const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
      console.log(`MP3文件：`, mp3Files);
      
      if (mp3Files.length > 0) {
        // 转换为musicList格式
        const musicList = mp3Files.map(file => {
          const name = file.replace('.mp3', '');
          const src = `${path}/${file}`;
          return {
            name: name,
            src: src
          };
        });

        // 提取音乐名称数组
        const musicNames = musicList.map(music => music.name);
        console.log('音乐名称列表:', musicNames);

        console.log('准备更新音乐列表:', musicList);
        
        // 更新数据
        this.setData({ 
          musicList: musicList,
          musicNames: musicNames,
          currentMusicIndex: 0
        }, () => {
          console.log('音乐列表已更新：', this.data.musicList);
          console.log('音乐名称已更新：', this.data.musicNames);
          this.initAudioContext();
        });
        
        return;
      }
    } catch (error) {
      console.error('扫描失败：', error);
      wx.showToast({
        title: '音乐文件扫描失败',
        icon: 'none',
        duration: 2000
      });
    }

    // 如果没有找到文件
    console.log('未找到MP3文件');
    this.setData({ 
      musicList: [],
      musicNames: [],
      currentMusicIndex: 0
    });
    wx.showToast({
      title: '请将MP3文件放入assets/music目录',
      icon: 'none',
      duration: 2000
    });
  },

  initAudioContext: function() {
    // 销毁旧的音频上下文
    if (this.audioContext) {
      this.audioContext.destroy();
    }

    // 检查是否有可用的音乐
    if (this.data.musicList.length === 0) {
      return;
    }

    // 创建新的音频上下文
    this.audioContext = wx.createInnerAudioContext();
    
    // 使用本地音频文件
    const currentMusic = this.data.musicList[this.data.currentMusicIndex];
    console.log('当前播放音乐：', currentMusic);
    this.audioContext.src = currentMusic.src;
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

  onMusicChange: function(e) {
    const index = e.detail.value;
    console.log('选择音乐索引:', index);
    
    // 更新当前音乐索引
    this.setData({ 
      currentMusicIndex: index 
    }, () => {
      console.log('当前选中的音乐:', this.data.musicList[index]);
      
      // 如果正在播放，需要暂停当前音乐
      if (this.data.isPlaying) {
        this.audioContext.pause();
      }

      // 更新音频源并重新初始化
      this.initAudioContext();

      // 显示切换提示
      wx.showToast({
        title: '已切换到：' + this.data.musicList[index].name,
        icon: 'none',
        duration: 1500
      });

      // 如果之前在播放，则继续播放新选择的音乐
      if (this.data.isPlaying) {
        setTimeout(() => {
          this.audioContext.play();
        }, 100);
      }
    });
  },

  onShow: function() {
    // 每次显示页面时重新扫描音乐文件，以便及时发现新添加的音乐
    this.scanMusicFiles();
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
    if (this.data.musicList.length === 0) {
      wx.showToast({
        title: '请先添加音乐文件',
        icon: 'none',
        duration: 2000
      });
      return;
    }

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
          title: '音乐暂停！快抢座位！',
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
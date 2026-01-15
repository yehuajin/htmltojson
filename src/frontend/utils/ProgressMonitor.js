/**
 * 进度监控器
 * 用于跟踪解析进度
 */

class ProgressMonitor {
  constructor(options = {}) {
    this.onProgress = options.onProgress || null;
    this.onComplete = options.onComplete || null;
    this.onError = options.onError || null;
    
    this.total = 0;
    this.current = 0;
    this.stages = [];
    this.currentStage = null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * 开始监控
   * @param {number} total - 总任务数
   */
  start(total = 100) {
    this.total = total;
    this.current = 0;
    this.stages = [];
    this.startTime = Date.now();
    this.endTime = null;
    this.emitProgress();
  }

  /**
   * 更新进度
   * @param {number} increment - 增量
   * @param {string} message - 消息
   */
  update(increment = 1, message = null) {
    this.current = Math.min(this.current + increment, this.total);
    
    if (message) {
      this.addStage(message);
    }
    
    this.emitProgress();
  }

  /**
   * 设置进度
   * @param {number} current - 当前进度
   * @param {string} message - 消息
   */
  setProgress(current, message = null) {
    this.current = Math.min(Math.max(current, 0), this.total);
    
    if (message) {
      this.addStage(message);
    }
    
    this.emitProgress();
  }

  /**
   * 添加阶段
   * @param {string} message - 阶段消息
   */
  addStage(message) {
    const stage = {
      message,
      timestamp: Date.now(),
      progress: this.getPercentage()
    };
    
    this.stages.push(stage);
    this.currentStage = stage;
  }

  /**
   * 完成监控
   * @param {Object} result - 结果数据
   */
  complete(result = null) {
    this.current = this.total;
    this.endTime = Date.now();
    this.emitProgress();
    
    if (this.onComplete) {
      this.onComplete({
        ...result,
        duration: this.getDuration(),
        stages: this.stages
      });
    }
  }

  /**
   * 报告错误
   * @param {Error|string} error - 错误对象或消息
   */
  error(error) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.addStage(`Error: ${errorMessage}`);
    
    if (this.onError) {
      this.onError(error, {
        progress: this.getPercentage(),
        stages: this.stages,
        duration: this.getDuration()
      });
    }
  }

  /**
   * 获取进度百分比
   * @returns {number} 百分比 (0-100)
   */
  getPercentage() {
    if (this.total === 0) {
      return 0;
    }
    return Math.round((this.current / this.total) * 100);
  }

  /**
   * 获取耗时
   * @returns {number} 耗时（毫秒）
   */
  getDuration() {
    if (!this.startTime) {
      return 0;
    }
    
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  /**
   * 获取预估剩余时间
   * @returns {number} 剩余时间（毫秒）
   */
  getEstimatedRemaining() {
    if (this.current === 0 || this.total === 0) {
      return null;
    }
    
    const elapsed = this.getDuration();
    const rate = this.current / elapsed;
    const remaining = (this.total - this.current) / rate;
    
    return remaining;
  }

  /**
   * 获取速度
   * @returns {number} 速度（项/秒）
   */
  getSpeed() {
    const duration = this.getDuration();
    if (duration === 0) {
      return 0;
    }
    
    return (this.current / duration) * 1000;
  }

  /**
   * 获取状态信息
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      current: this.current,
      total: this.total,
      percentage: this.getPercentage(),
      duration: this.getDuration(),
      estimatedRemaining: this.getEstimatedRemaining(),
      speed: this.getSpeed(),
      currentStage: this.currentStage,
      stages: this.stages
    };
  }

  /**
   * 触发进度事件
   */
  emitProgress() {
    if (this.onProgress) {
      this.onProgress({
        current: this.current,
        total: this.total,
        percentage: this.getPercentage(),
        duration: this.getDuration(),
        estimatedRemaining: this.getEstimatedRemaining(),
        speed: this.getSpeed(),
        currentStage: this.currentStage
      });
    }
  }

  /**
   * 重置监控器
   */
  reset() {
    this.total = 0;
    this.current = 0;
    this.stages = [];
    this.currentStage = null;
    this.startTime = null;
    this.endTime = null;
  }
}

module.exports = ProgressMonitor;


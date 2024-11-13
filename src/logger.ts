import log4js from 'log4js';

log4js.configure({
  appenders: {
    console: { type: 'console' },
    dateFile: { 
      type: 'dateFile', 
      filename: 'logs/runes_mint.log', 
      pattern: '.yyyy-MM-dd', // 每天分割一次
      daysToKeep: 7, // 保留最近 7 天的日志文件
      keepFileExt: true // 保留日志文件的扩展名
    }
  },
  categories: {
    default: { appenders: ['console', 'dateFile'], level: 'info' }
  }
});

const logger = log4js.getLogger();

export default logger;
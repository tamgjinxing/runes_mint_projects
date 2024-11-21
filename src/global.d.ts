// global.d.ts
import { Config } from './types'; // 假设你有一个 Config 类型定义文件

declare global {
    var config: Config;
}

export { }; // 确保这是一个模块

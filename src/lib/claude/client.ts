import Anthropic from "@anthropic-ai/sdk";

/** Anthropic 客户端，自动读取环境变量 ANTHROPIC_API_KEY。 */
export const anthropic = new Anthropic();

/** 识别默认模型：提取准确率优先。高量产可改 claude-sonnet-4-6。 */
export const RECOGNITION_MODEL = "claude-opus-4-8";

/**
 * 科大讯飞语音识别服务
 * WebSocket 实时语音转写
 */

import CryptoJS from 'crypto-js';

interface XfyunConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

interface RecognitionResult {
  text: string;
  isFinal: boolean;
}

export class XfyunSpeechRecognition {
  private config: XfyunConfig;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isRecording = false;
  private frameCount = 0; // 帧计数器
  private audioDataBuffer: Int16Array[] = []; // 音频缓冲区
  private transcriptBuffer = ''; // 累积识别结果

  // 回调函数
  public onResult: ((result: RecognitionResult) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  public onEnd: (() => void) | null = null;

  constructor(config: XfyunConfig) {
    this.config = config;
  }

  /**
   * 生成讯飞API鉴权URL
   */
  private getWebSocketUrl(): string {
    const { apiKey, apiSecret } = this.config;
    const host = 'iat-api.xfyun.cn';
    const path = '/v2/iat';
    const date = new Date().toUTCString();

    // 生成签名
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signature = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    const signatureBase64 = CryptoJS.enc.Base64.stringify(signature);

    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    // 构建URL
    const url = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    return url;
  }

  /**
   * 获取音频流参数
   */
  private getAudioParams() {
    return {
      common: {
        app_id: this.config.appId,
      },
      business: {
        language: 'zh_cn', // 中文
        domain: 'iat', // 实时转写
        accent: 'mandarin', // 普通话
        vad_eos: 2000, // 静音检测时长（毫秒）
        dwa: 'wpgs', // 动态修正
      },
      data: {
        status: 0, // 0: 第一帧，1: 中间帧，2: 最后一帧
        format: 'audio/L16;rate=16000',
        encoding: 'raw', // 原生PCM音频（Base64编码后发送）
        audio: '', // 音频数据（Base64编码）
      },
    };
  }

  /**
   * 开始录音和识别
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      console.warn('已经在录音中');
      return;
    }

    try {
      // 重置识别结果缓冲区
      this.transcriptBuffer = '';

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.mediaStream = stream;

      // 创建AudioContext进行音频处理
      const AudioContextClass = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });

      // 连接WebSocket
      await this.connectWebSocket();

      // 开始录音
      this.startRecording(stream);
      this.isRecording = true;

    } catch (error: any) {
      console.error('启动语音识别失败:', error);
      if (this.onError) {
        if (error.name === 'NotAllowedError') {
          this.onError('麦克风权限被拒绝');
        } else if (error.name === 'NotFoundError') {
          this.onError('未找到麦克风设备');
        } else {
          this.onError(`启动失败: ${error.message}`);
        }
      }
    }
  }

  /**
   * 连接WebSocket
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrl();
        this.websocket = new WebSocket(url);
        // 不设置binaryType，保持默认的'blob'，因为我们发送的是JSON字符串

        this.websocket.onopen = () => {
          console.log('WebSocket连接成功');
          // 重置帧计数
          this.frameCount = 0;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event.data);
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket错误:', error);
          if (this.onError) {
            this.onError('连接语音识别服务失败');
          }
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket连接关闭');
          this.cleanup();
          if (this.onEnd) {
            this.onEnd();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(data: string) {
    try {
      const response = JSON.parse(data);

      // 打印完整的响应数据用于调试
      console.log('收到WebSocket消息:', JSON.stringify(response, null, 2));

      if (response.code !== 0) {
        console.error('识别错误:', response.message);
        if (this.onError) {
          this.onError(`识别失败: ${response.message}`);
        }
        return;
      }

      // 解析识别结果
      if (response.data && response.data.result) {
        const result = response.data.result;
        console.log('识别结果 result:', JSON.stringify(result, null, 2));

        const ws = result.ws;
        const pgs = result.pgs; // apd: append(追加), rpl: replace(替换)

        if (ws && ws.length > 0) {
          let text = '';

          // 遍历每个词
          for (const item of ws) {
            if (item.cw && item.cw.length > 0) {
              // 获取最佳候选词
              const word = item.cw[0].w;
              text += word;
            }
          }

          console.log('本帧拼接的文本:', text, '操作类型:', pgs);

          // 根据 pgs 判断是追加还是替换
          if (text && text !== '。') {
            if (pgs === 'rpl') {
              // 替换模式：直接替换缓冲区（科大讯飞在修正之前的识别）
              this.transcriptBuffer = text;
              console.log('替换模式，更新总文本:', this.transcriptBuffer);
            } else {
              // 追加模式 (apd) 或其他：追加到缓冲区
              this.transcriptBuffer += text;
              console.log('追加模式，累积后的总文本:', this.transcriptBuffer);
            }
          }

          // 如果是最后一帧，返回完整结果
          if (response.data.status === 2) {
            console.log('最后一帧，返回完整结果:', this.transcriptBuffer);

            if (this.transcriptBuffer && this.onResult) {
              this.onResult({
                text: this.transcriptBuffer,
                isFinal: true,
              });
            }
          } else if (text && text !== '。' && this.onResult) {
            // 中间帧，返回当前累积的结果（非最终）
            this.onResult({
              text: this.transcriptBuffer,
              isFinal: false,
            });
          }
        } else {
          console.log('ws 为空或长度为0');
        }
      } else {
        console.log('response.data 或 response.data.result 不存在');
      }

      // 如果是最后一帧，关闭连接
      if (response.data && response.data.status === 2) {
        console.log('收到最后一帧，准备停止');
        // 不调用 this.stop()，因为我们在外部已经处理了停止
      }

    } catch (error) {
      console.error('解析识别结果失败:', error);
    }
  }

  /**
   * 开始录音
   */
  private startRecording(stream: MediaStream) {
    try {
      if (!this.audioContext) {
        throw new Error('AudioContext未初始化');
      }

      // 创建音频源
      const source = this.audioContext.createMediaStreamSource(stream);

      // 创建ScriptProcessorNode（bufferSize=4096, 单声道输入，单声道输出）
      const bufferSize = 4096;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      // 音频处理回调
      this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) {
          return;
        }

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Float32Array

        // 转换为Int16Array
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // 添加到缓冲区
        this.audioDataBuffer.push(int16Data);

        // 每累积约200ms的数据就发送一次（16000Hz * 0.2s = 3200 samples）
        const totalSamples = this.audioDataBuffer.reduce((sum, arr) => sum + arr.length, 0);
        if (totalSamples >= 3200) {
          this.flushAudioBuffer();
        }
      };

      // 连接音频处理链
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      console.log('开始音频处理，采样率:', this.audioContext.sampleRate);

    } catch (error) {
      console.error('开始录音失败:', error);
      if (this.onError) {
        this.onError('录音启动失败');
      }
    }
  }

  /**
   * 发送缓冲区的音频数据
   */
  private flushAudioBuffer() {
    if (this.audioDataBuffer.length === 0) {
      return;
    }

    // 合并所有缓冲区
    const totalLength = this.audioDataBuffer.reduce((sum, arr) => sum + arr.length, 0);
    const mergedBuffer = new Int16Array(totalLength);
    let offset = 0;
    for (const buffer of this.audioDataBuffer) {
      mergedBuffer.set(buffer, offset);
      offset += buffer.length;
    }

    // 清空缓冲区
    this.audioDataBuffer = [];

    // 发送数据
    this.sendAudioData(mergedBuffer.buffer);
  }

  /**
   * 发送音频数据到WebSocket
   */
  private sendAudioData(audioData: ArrayBuffer) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // 将音频数据转为Base64
      const base64Audio = this.arrayBufferToBase64(audioData);

      const params = this.getAudioParams();

      // 根据帧计数器设置status
      if (this.frameCount === 0) {
        params.data.status = 0; // 首帧
      } else {
        params.data.status = 1; // 中间帧
      }

      // 设置音频数据
      params.data.audio = base64Audio;

      this.frameCount++;

      const jsonStr = JSON.stringify(params);
      console.log(`发送音频帧 #${this.frameCount}, status=${params.data.status}, size=${audioData.byteLength}字节, base64长度=${base64Audio.length}`);

      // 首帧时输出完整JSON结构（不包含音频数据）
      if (this.frameCount === 1) {
        console.log('首帧JSON结构:', JSON.stringify({
          ...params,
          data: {
            ...params.data,
            audio: '<base64-data>'
          }
        }, null, 2));
      }

      this.websocket.send(jsonStr);

    } catch (error) {
      console.error('发送音频数据失败:', error);
    }
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }


  /**
   * 停止录音和识别
   */
  stop() {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    // 发送缓冲区剩余数据
    this.flushAudioBuffer();

    // 发送结束帧
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const params = this.getAudioParams();
      params.data.status = 2; // 最后一帧
      params.data.audio = ''; // 最后一帧不包含音频数据

      console.log('发送结束帧');
      this.websocket.send(JSON.stringify(params));
    }

    // 断开ScriptProcessorNode
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    // 停止媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // 清空音频缓冲区
    this.audioDataBuffer = [];

    // 延迟关闭WebSocket，等待最后的识别结果
    setTimeout(() => {
      this.cleanup();
    }, 1000);
  }

  /**
   * 清理资源
   */
  private cleanup() {
    // 关闭WebSocket
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
      }
      this.websocket = null;
    }

    // 断开ScriptProcessorNode
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    // 停止媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // 关闭AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 清空缓冲区
    this.audioDataBuffer = [];
    this.transcriptBuffer = '';
    this.isRecording = false;
    this.frameCount = 0;
  }

  /**
   * 检查是否正在录音
   */
  isActive(): boolean {
    return this.isRecording;
  }
}


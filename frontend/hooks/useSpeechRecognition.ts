import { useState, useEffect, useCallback, useRef } from 'react';
import { XfyunSpeechRecognition } from '@/lib/xfyunSpeech';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<XfyunSpeechRecognition | null>(null);

  useEffect(() => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      return;
    }

    // 检查必要的API支持
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasWebSocket = typeof WebSocket !== 'undefined';

    if (!hasMediaDevices || !hasWebSocket) {
      setIsSupported(false);
      setError('您的浏览器不支持语音识别功能');
      return;
    }

    // 从环境变量获取科大讯飞配置
    const appId = process.env.NEXT_PUBLIC_XFYUN_APP_ID;
    const apiKey = process.env.NEXT_PUBLIC_XFYUN_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_XFYUN_API_SECRET;

    if (!appId || !apiKey || !apiSecret) {
      console.warn('缺少科大讯飞配置，请在.env.local中配置：NEXT_PUBLIC_XFYUN_APP_ID, NEXT_PUBLIC_XFYUN_API_KEY, NEXT_PUBLIC_XFYUN_API_SECRET');
      setIsSupported(false);
      setError('语音识别服务未配置，请联系管理员');
      return;
    }

    setIsSupported(true);

    // 初始化科大讯飞语音识别
    const recognition = new XfyunSpeechRecognition({
      appId,
      apiKey,
      apiSecret,
    });

    // 设置回调函数
    recognition.onResult = (result) => {
      if (result.isFinal) {
        // 最终结果
        setTranscript(prev => prev + result.text);
      }
      setError(null);
    };

    recognition.onError = (errorMessage) => {
      console.error('语音识别错误:', errorMessage);
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onEnd = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // 清理函数
    return () => {
      if (recognitionRef.current && recognitionRef.current.isActive()) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('语音识别服务未初始化');
      return;
    }

    if (isListening) {
      console.warn('已经在录音中');
      return;
    }

    try {
      setError(null);
      await recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('启动语音识别失败:', err);
      setError(err.message || '启动语音识别失败');
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (!isListening) {
      return;
    }

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err: any) {
      console.error('停止语音识别失败:', err);
      setError(err.message || '停止语音识别失败');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}


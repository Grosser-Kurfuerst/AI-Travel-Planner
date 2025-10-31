import { useState, useEffect, useCallback } from 'react';

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
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // 检查浏览器是否支持语音识别
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();

        // 配置语音识别
        recognitionInstance.continuous = true; // 持续识别
        recognitionInstance.interimResults = true; // 显示中间结果
        recognitionInstance.lang = 'zh-CN'; // 中文识别
        recognitionInstance.maxAlternatives = 1;

        // 识别结果处理
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(prev => prev + finalTranscript);
          setError(null);
        };

        // 错误处理
        recognitionInstance.onerror = (event: any) => {
          console.error('语音识别错误:', event.error);
          setIsListening(false);

          switch (event.error) {
            case 'no-speech':
              setError('没有检测到语音，请重试');
              break;
            case 'audio-capture':
              setError('无法访问麦克风，请检查权限');
              break;
            case 'not-allowed':
              setError('麦克风权限被拒绝');
              break;
            case 'network':
              setError('网络错误，请检查网络连接');
              break;
            default:
              setError('语音识别失败，请重试');
          }
        };

        // 识别结束
        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setError(null);
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('启动语音识别失败:', err);
        setError('启动语音识别失败');
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (err) {
        console.error('停止语音识别失败:', err);
      }
    }
  }, [recognition, isListening]);

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


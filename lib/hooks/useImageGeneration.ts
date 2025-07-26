import { useState, useEffect, useRef } from 'react';
import { 
  generateImage, 
  checkImageStatus, 
  generateRecipeImagePrompt, 
  ImageGenParams, 
  ImageModel 
} from '../services/image-service';
import { IMAGE_GEN_CONFIG } from '../config';

interface UseImageGenerationOptions {
  initialModel?: ImageModel;
}

export function useImageGeneration(options: UseImageGenerationOptions = {}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [model, setModel] = useState<ImageModel>(options.initialModel || 'wanx');
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };
  
  useEffect(() => {
    if (taskId) {
      pollingInterval.current = setInterval(async () => {
        const result = await checkImageStatus(taskId, model);
        if (result.success) {
          if (result.status === 'SUCCEEDED') {
            stopPolling();
            setLoading(false);
            setImageUrl(result.imageUrl || null);
            setTaskId(null);
          } else if (result.status === 'FAILED') {
            stopPolling();
            setLoading(false);
            setError(result.error || '图片生成失败');
            setTaskId(null);
          }
          // 如果是 PENDING 或 RUNNING，继续轮询
        } else {
          stopPolling();
          setLoading(false);
          setError(result.error || '检查任务状态失败');
          setTaskId(null);
        }
      }, IMAGE_GEN_CONFIG.POLLING.INTERVAL_MS); // 使用配置中的轮询间隔
    }

    return () => stopPolling(); // 组件卸载时停止轮询
  }, [taskId, model]);
  
  const generateRecipeImage = async (params: Omit<ImageGenParams, 'model'>): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      setImageUrl(null);
      stopPolling(); // 开始新的生成前，停止任何正在进行的轮询

      const result = await generateImage({
        ...params,
        model // 使用当前选择的模型
      });
      
      if (result.success && result.taskId) {
        setTaskId(result.taskId);
        // 轮询将在useEffect中开始
        return null; // 立即返回，因为图片正在生成中
      } else {
        throw new Error(result.error || '图片生成任务提交失败');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '图片生成出错');
      return null;
    }
  };

  const generateImageForRecipe = async (recipe: { 
    name: string; 
    description?: string; 
    ingredients?: string[];
  }, style: ImageGenParams['style'] = 'photographic'): Promise<string | null> => {
    const prompt = generateRecipeImagePrompt(recipe, model);
    
    // 使用配置中定义的负面提示词
    const negativePrompt = model === 'wanx' 
      ? IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.WANX 
      : IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.FLUX;
    
    return generateRecipeImage({
      prompt,
      style: model === 'wanx' ? style : undefined, // style仅对万象模型有效
      negativePrompt
    });
  };

  // 切换图片生成模型
  const switchModel = (newModel: ImageModel) => {
    if (loading) {
      console.warn('Cannot switch model while generation is in progress');
      return;
    }
    setModel(newModel);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setImageUrl(null);
    setTaskId(null);
    stopPolling();
  };

  return {
    generateRecipeImage,
    generateImageForRecipe,
    loading,
    error,
    imageUrl,
    reset,
    model,
    switchModel
  };
}
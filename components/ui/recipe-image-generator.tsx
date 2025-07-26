import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useImageGeneration } from '@/lib/hooks/useImageGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { IMAGE_GEN_CONFIG } from '@/lib/config';
import { ImageStyle, ImageModel } from '@/lib/services/image-service';
import { ModelSelector } from './model-selector';

type RecipeImageGeneratorProps = {
  recipe: {
    name: string;
    description?: string;
    ingredients?: string[];
  };
  onImageGenerated?: (imageUrl: string) => void;
  className?: string;
};

export function RecipeImageGenerator({ 
  recipe, 
  onImageGenerated,
  className = '' 
}: RecipeImageGeneratorProps) {
  const { 
    generateImageForRecipe, 
    loading, 
    error, 
    imageUrl, 
    reset, 
    model,
    switchModel 
  } = useImageGeneration();
  
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('photographic');

  useEffect(() => {
    if (imageUrl && onImageGenerated) {
      onImageGenerated(imageUrl);
    }
  }, [imageUrl, onImageGenerated]);

  const handleGenerateImage = async () => {
    if (loading) return;
    
    await generateImageForRecipe(recipe, selectedStyle);
  };

  const handleStyleChange = (style: ImageStyle) => {
    setSelectedStyle(style);
    // 如果已经生成了图片，切换风格时自动重新生成
    if (imageUrl) {
      reset();
    }
  };
  
  const handleModelChange = (newModel: ImageModel) => {
    switchModel(newModel);
    // 如果已经生成了图片，切换模型时自动重新生成
    if (imageUrl) {
      reset();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Model selector */}
      <ModelSelector 
        selected={model} 
        onChange={handleModelChange}
        disabled={loading}
      />
      
      {/* Style selector - only available for Wanx model */}
      {model === 'wanx' && (
        <div className="flex flex-wrap gap-2">
          {IMAGE_GEN_CONFIG.WANX.STYLES.map((style) => (
            <Button
              key={style}
              variant={selectedStyle === style ? "default" : "outline"}
              size="sm"
              onClick={() => handleStyleChange(style)}
              className="capitalize"
              disabled={loading}
            >
              {style}
            </Button>
          ))}
        </div>
      )}
      
      {/* Image area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-muted">
              <div className="flex flex-col items-center gap-2">
                <Spinner />
                <p className="text-sm text-muted-foreground">
                  {(model as string) === 'flux' ? 'Generating image, please wait 8-15s...' : 'Generating image...'}
                </p>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="relative h-64">
              <Image
                src={imageUrl}
                alt={recipe.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-muted p-4 text-center">
              <p className="text-muted-foreground mb-2">
                {error || "Click the button below to generate a food image"}
              </p>
              {((model as string) === 'flux') && !error && (
                <p className="text-xs text-muted-foreground">
                  Using Flux Schnell model for high-quality images
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerateImage}
          disabled={loading}
          className="w-full"
        >
          {imageUrl ? "Regenerate Image" : "Generate Food Image"}
          {((model as string) === 'flux') && !imageUrl && !loading && " (High Quality)"}
        </Button>
      </div>
    </div>
  );
} 
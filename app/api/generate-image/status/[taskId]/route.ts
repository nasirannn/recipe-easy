import { NextResponse } from 'next/server';
import axios from 'axios';
import type { ImageModel } from '@/lib/services/image-service';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const taskId = params.taskId;
  
  // 从URL参数中获取模型类型
  const url = new URL(request.url);
  const model = (url.searchParams.get('model') || 'wanx') as ImageModel;

  if (!taskId) {
    return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
  }

  try {
    if (model === 'wanx') {
      return await checkWanxTaskStatus(taskId);
    } else if (model === 'flux') {
      return await checkReplicateTaskStatus(taskId);
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported model: ${model}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error(`Error checking task status for ${taskId}:`, error);
    console.error('Error details:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to check task status' 
      },
      { status: 500 }
    );
  }
}

// 检查万象模型任务状态
async function checkWanxTaskStatus(taskId: string) {
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('DASHSCOPE_API_KEY environment variable is not set');
    return NextResponse.json(
      { success: false, error: 'API key is not configured' },
      { status: 500 }
    );
  }

  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      'Accept': 'application/json'
    }
  });

  const taskData = response.data;
  console.log(`万象任务 ${taskId} 状态检查响应:`, JSON.stringify(taskData, null, 2));

  const { task_status, results } = taskData.output;
  
  if (task_status === 'SUCCEEDED') {
    const images = results.map((result: any) => result.url).filter(Boolean);
    return NextResponse.json({
      success: true,
      status: 'SUCCEEDED',
      imageUrl: images[0],
      images: images,
    });
  } else if (task_status === 'FAILED') {
    return NextResponse.json({
      success: false,
      status: 'FAILED',
      error: taskData.output.message || 'Image generation task failed'
    }, { status: 500 });
  } else {
    // PENDING, RUNNING, or other statuses
    return NextResponse.json({
      success: true,
      status: task_status
    });
  }
}

// 检查Replicate任务状态
async function checkReplicateTaskStatus(taskId: string) {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN environment variable is not set');
    return NextResponse.json(
      { success: false, error: 'Replicate API token is not configured' },
      { status: 500 }
    );
  }

  const url = `https://api.replicate.com/v1/predictions/${taskId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Accept': 'application/json'
    }
  });

  const taskData = response.data;
  console.log(`Replicate任务 ${taskId} 状态检查响应:`, JSON.stringify(taskData, null, 2));

  if (taskData.status === 'succeeded') {
    // Replicate返回的是output数组，包含图像URL
    const images = Array.isArray(taskData.output) ? taskData.output : [];
    return NextResponse.json({
      success: true,
      status: 'SUCCEEDED', // 统一使用同样的状态名称
      imageUrl: images[0], // 第一张图片
      images: images,
    });
  } else if (taskData.status === 'failed') {
    return NextResponse.json({
      success: false,
      status: 'FAILED',
      error: taskData.error || 'Replicate image generation failed'
    }, { status: 500 });
  } else {
    // 其他状态: starting, processing
    // 映射到统一的状态名称
    const mappedStatus = taskData.status === 'processing' ? 'RUNNING' : 'PENDING';
    return NextResponse.json({
      success: true,
      status: mappedStatus
    });
  }
} 
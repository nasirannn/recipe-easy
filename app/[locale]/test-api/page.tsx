'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user-usage?userId=157b6650-29b8-4613-87d9-ce0997106151');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testPostApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '157b6650-29b8-4613-87d9-ce0997106151',
          action: 'spend',
          amount: 1,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">API 测试页面</h1>
      
      <div className="space-y-4">
        <button
          onClick={testGetApi}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试 GET /api/user-usage'}
        </button>
        
        <button
          onClick={testPostApi}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? '测试中...' : '测试 POST /api/user-usage'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>错误:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 border border-gray-400 rounded">
          <strong>响应结果:</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
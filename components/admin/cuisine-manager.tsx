"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useCuisines, Cuisine } from '@/hooks/use-cuisines';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';

interface CuisineManagerProps {
  className?: string;
}

export function CuisineManager({ className }: CuisineManagerProps) {
  const { cuisines, loading, error, refetch } = useCuisines();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 这里将来可以添加创建/更新菜系的 API 调用
    console.log('Submit cuisine:', formData);
    
    // 重置表单
    setFormData({ name: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
    
    // 刷新数据
    refetch();
  };

  const handleEdit = (cuisine: Cuisine) => {
    setFormData({
      name: cuisine.name,
      description: cuisine.description || ''
    });
    setEditingId(cuisine.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this cuisine?')) {
      // 这里将来可以添加删除菜系的 API 调用
      console.log('Delete cuisine:', id);
      refetch();
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
        <span className="ml-2">Loading cuisines...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading cuisines: {error}</p>
        <Button onClick={refetch} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Cuisine Management
            </CardTitle>
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Cuisine
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 添加/编辑表单 */}
          {isAdding && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Cuisine Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Italian, Chinese, Mexican"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this cuisine style"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      {editingId ? 'Update' : 'Add'} Cuisine
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 菜系列表 */}
          <div className="grid gap-2">
            {cuisines.map((cuisine) => (
              <div
                key={cuisine.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cuisine.name}</Badge>
                    <span className="text-sm text-muted-foreground">ID: {cuisine.id}</span>
                  </div>
                  {cuisine.description && (
                    <p className="text-sm text-muted-foreground mt-1">{cuisine.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cuisine)}
                    disabled={isAdding}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cuisine.id)}
                    disabled={isAdding}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {cuisines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No cuisines found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

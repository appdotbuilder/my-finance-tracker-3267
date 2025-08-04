
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newCategory, setNewCategory] = useState<CreateCategoryInput>({
    name: '',
    type: 'expense',
    color: null
  });

  const [editCategory, setEditCategory] = useState<UpdateCategoryInput>({
    id: 0,
    name: '',
    color: null
  });

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.createCategory.mutate(newCategory);
      setNewCategory({
        name: '',
        type: 'expense',
        color: null
      });
      setIsCreateOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.updateCategory.mutate(editCategory);
      setEditingCategory(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCategory.mutate({ categoryId });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setEditCategory({
      id: category.id,
      name: category.name,
      color: category.color
    });
    setEditingCategory(category);
  };

  const incomeCategories = categories.filter((cat: Category) => cat.type === 'income');
  const expenseCategories = categories.filter((cat: Category) => cat.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Kategori</h2>
          <p className="text-gray-600">Kelola kategori pemasukan dan pengeluaran Anda</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <span>➕</span>
              <span>Tambah Kategori</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
              <DialogDescription>
                Buat kategori baru untuk mengorganisir transaksi Anda
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kategori</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama kategori"
                    value={newCategory.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewCategory((prev: CreateCategoryInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipe Kategori</Label>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value: 'income' | 'expense') =>
                      setNewCategory((prev: CreateCategoryInput) => ({
                        ...prev,
                        type: value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <div className="flex items-center space-x-2">
                          <span>💰</span>
                          <span>Pemasukan</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expense">
                        <div className="flex items-center space-x-2">
                          <span>💸</span>
                          <span>Pengeluaran</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Warna (Opsional)</Label>
                  <div className="grid grid-cols-8 gap-2">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${!newCategory.color ? 'border-gray-900' : 'border-gray-300'} bg-gray-100`}
                      onClick={() => setNewCategory((prev: CreateCategoryInput) => ({ ...prev, color: null }))}
                    >
                      {!newCategory.color && <span className="text-xs">✓</span>}
                    </button>
                    {predefinedColors.map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${newCategory.color === color ? 'border-gray-900' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategory((prev: CreateCategoryInput) => ({ ...prev, color }))}
                      >
                        {newCategory.color === color && <span className="text-white text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || !newCategory.name.trim()}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <p className="text-sm text-muted-foreground">Total Kategori</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{incomeCategories.length}</div>
            <p className="text-sm text-muted-foreground">Kategori Pemasukan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{expenseCategories.length}</div>
            <p className="text-sm text-muted-foreground">Kategori Pengeluaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💰</span>
              <span>Kategori Pemasukan</span>
            </CardTitle>
            <CardDescription>
              {incomeCategories.length} kategori pemasukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💰</div>
                <p className="text-gray-500">Belum ada kategori pemasukan</p>
                <p className="text-sm text-gray-400">Tambahkan kategori pemasukan pertama Anda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomeCategories.map((category: Category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          Dibuat: {category.created_at.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                      >
                        ✏️
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600">
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus kategori "{category.name}"? 
                              Semua transaksi dengan kategori ini akan terpengaruh.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💸</span>
              <span>Kategori Pengeluaran</span>
            </CardTitle>
            <CardDescription>
              {expenseCategories.length} kategori pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💸</div>
                <p className="text-gray-500">Belum ada kategori pengeluaran</p>
                <p className="text-sm text-gray-400">Tambahkan kategori pengeluaran pertama Anda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenseCategories.map((category: Category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          Dibuat: {category.created_at.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                      >
                        ✏️
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600">
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus kategori "{category.name}"? 
                              Semua transaksi dengan kategori ini akan terpengaruh.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editingCategory !== null} onOpenChange={(open: boolean) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Ubah nama atau warna kategori
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Kategori</Label>
                <Input
                  id="edit-name"
                  placeholder="Masukkan nama kategori"
                  value={editCategory.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditCategory((prev: UpdateCategoryInput) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Warna (Opsional)</Label>
                <div className="grid grid-cols-8 gap-2">
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${!editCategory.color ? 'border-gray-900' : 'border-gray-300'} bg-gray-100`}
                    onClick={() => setEditCategory((prev: UpdateCategoryInput) => ({ ...prev, color: null }))}
                  >
                    {!editCategory.color && <span className="text-xs">✓</span>}
                  </button>
                  {predefinedColors.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${editCategory.color === color ? 'border-gray-900' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditCategory((prev: UpdateCategoryInput) => ({ ...prev, color }))}
                    >
                      {editCategory.color === color && <span className="text-white text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading || !editCategory.name?.trim()}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

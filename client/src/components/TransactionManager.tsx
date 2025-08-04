
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Transaction, Category, CreateTransactionInput, UpdateTransactionInput } from '../../../server/src/schema';

interface TransactionManagerProps {
  transactions: Transaction[];
  categories: Category[];
  formatCurrency: (amount: number) => string;
  onRefresh: () => void;
}

export function TransactionManager({ transactions, categories, formatCurrency, onRefresh }: TransactionManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newTransaction, setNewTransaction] = useState<CreateTransactionInput>({
    category_id: 0,
    amount: 0,
    description: null,
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [editTransaction, setEditTransaction] = useState<UpdateTransactionInput>({
    id: 0,
    category_id: 0,
    amount: 0,
    description: null,
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.createTransaction.mutate(newTransaction);
      setNewTransaction({
        category_id: 0,
        amount: 0,
        description: null,
        transaction_date: new Date().toISOString().split('T')[0]
      });
      setIsCreateOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.updateTransaction.mutate(editTransaction);
      setEditingTransaction(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTransaction.mutate({ transactionId });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditTransaction = (transaction: Transaction) => {
    setEditTransaction({
      id: transaction.id,
      category_id: transaction.category_id,
      amount: transaction.amount,
      description: transaction.description,
      transaction_date: transaction.transaction_date.toISOString().split('T')[0]
    });
    setEditingTransaction(transaction);
  };

  const getCategoryById = (categoryId: number) => {
    return categories.find((cat: Category) => cat.id === categoryId);
  };

  const filteredTransactions = transactions.slice().sort((a: Transaction, b: Transaction) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Transaksi</h2>
          <p className="text-gray-600">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <span>➕</span>
              <span>Tambah Transaksi</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Baru</DialogTitle>
              <DialogDescription>
                Tambahkan transaksi pemasukan atau pengeluaran baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={newTransaction.category_id.toString()}
                    onValueChange={(value: string) =>
                      setNewTransaction((prev: CreateTransactionInput) => ({
                        ...prev,
                        category_id: parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={category.type === 'income' ? 'default' : 'secondary'}
                              className={category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {category.type === 'income' ? '💰' : '💸'}
                            </Badge>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (IDR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={newTransaction.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTransaction((prev: CreateTransactionInput) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0
                      }))
                    }
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Catatan tambahan..."
                    value={newTransaction.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewTransaction((prev: CreateTransactionInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Transaksi</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTransaction((prev: CreateTransactionInput) => ({
                        ...prev,
                        transaction_date: e.target.value
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || newTransaction.category_id === 0}>
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
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                transactions
                  .filter((t: Transaction) => {
                    const category = getCategoryById(t.category_id);
                    return category?.type === 'income';
                  })
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total Pemasukan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                transactions
                  .filter((t: Transaction) => {
                    const category = getCategoryById(t.category_id);
                    return category?.type === 'expense';
                  })
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {transactions.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaksi ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500">Belum ada transaksi</p>
              <p className="text-sm text-gray-400">Tambahkan transaksi pertama Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: Transaction) => {
                const category = getCategoryById(transaction.category_id);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={category?.type === 'income' ? 'default' : 'secondary'}
                          className={category?.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {category?.type === 'income' ? '💰' : '💸'} {category?.name}
                        </Badge>
                        <div className={`text-lg font-bold ${category?.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {category?.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {transaction.transaction_date.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditTransaction(transaction)}
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            🗑️ Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={editingTransaction !== null} onOpenChange={(open: boolean) => !open && setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
            <DialogDescription>
              Ubah detail transaksi yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTransaction}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select
                  value={editTransaction.category_id?.toString() || ''}
                  onValueChange={(value: string) =>
                    setEditTransaction((prev: UpdateTransactionInput) => ({
                      ...prev,
                      category_id: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={category.type === 'income' ? 'default' : 'secondary'}
                            className={category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {category.type === 'income' ? '💰' : '💸'}
                          </Badge>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Jumlah (IDR)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  placeholder="0"
                  value={editTransaction.amount || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTransaction((prev: UpdateTransactionInput) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0
                    }))
                  }
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Catatan tambahan..."
                  value={editTransaction.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditTransaction((prev: UpdateTransactionInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Tanggal Transaksi</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editTransaction.transaction_date || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTransaction((prev: UpdateTransactionInput) => ({
                      ...prev,
                      transaction_date: e.target.value
                    }))
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

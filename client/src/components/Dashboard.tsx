
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DashboardData } from '../../../server/src/schema';

interface DashboardProps {
  data: DashboardData;
  formatCurrency: (amount: number) => string;
  onRefresh: () => void;
}

export function Dashboard({ data, formatCurrency, onRefresh }: DashboardProps) {
  const { current_month_summary, recent_transactions, monthly_comparison, top_categories } = data;

  const getMonthName = (month: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">
            Ringkasan keuangan {getMonthName(current_month_summary.month)} {current_month_summary.year}
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          🔄 Perbarui Data
        </Button>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Pemasukan
            </CardTitle>
            <div className="text-2xl">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(current_month_summary.total_income)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Total Pengeluaran
            </CardTitle>
            <div className="text-2xl">💸</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(current_month_summary.total_expense)}
            </div>
          </CardContent>
        </Card>

        <Card className={`${current_month_summary.balance >= 0 ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${current_month_summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              Saldo Bersih
            </CardTitle>
            <div className="text-2xl">
              {current_month_summary.balance >= 0 ? '📊' : '⚠️'}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${current_month_summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
              {formatCurrency(current_month_summary.balance)}
            </div>
            {current_month_summary.is_overspent && (
              <Badge variant="destructive" className="mt-2">
                Pengeluaran Melebihi Pemasukan
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📝</span>
              <span>Transaksi Terbaru</span>
            </CardTitle>
            <CardDescription>
              {recent_transactions.length} transaksi terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent_transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Belum ada transaksi bulan ini
              </p>
            ) : (
              recent_transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={transaction.category_type === 'income' ? 'default' : 'secondary'}
                        className={transaction.category_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {transaction.category_name}
                      </Badge>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {transaction.transaction_date.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className={`font-bold ${transaction.category_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.category_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Categories with Visual Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏷️</span>
              <span>Kategori Teratas</span>
            </CardTitle>
            <CardDescription>
              Distribusi pengeluaran berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const expenseCategories = top_categories
                .filter((cat) => cat.category_type === 'expense')
                .sort((a, b) => b.total_amount - a.total_amount);

              if (expenseCategories.length === 0) {
                return (
                  <p className="text-gray-500 text-center py-4">
                    Belum ada data kategori pengeluaran
                  </p>
                );
              }

              const colors = [
                { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
                { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
                { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
                { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
                { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' },
                { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-100' },
              ];

              const totalAmount = expenseCategories.reduce((sum, cat) => sum + cat.total_amount, 0);

              return (
                <div className="space-y-6">
                  {/* Visual Bar Chart */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">📊 Distribusi Visual</h4>
                    {expenseCategories.slice(0, 6).map((category, index) => {
                      const percentage = ((category.total_amount / totalAmount) * 100);
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={category.category_id} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${color.bg}`}></div>
                              <span className="font-medium">{category.category_name}</span>
                            </div>
                            <span className={`font-bold ${color.text}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${color.bg} h-2 rounded-full transition-all duration-500 ease-out`}
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Category Summary Cards */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">💰 Detail Kategori</h4>
                    {expenseCategories.slice(0, 5).map((category, index) => {
                      const color = colors[index % colors.length];
                      const percentage = ((category.total_amount / totalAmount) * 100);
                      
                      return (
                        <div key={category.category_id} className={`flex justify-between items-center p-4 ${color.light} rounded-lg border-l-4 ${color.bg.replace('bg-', 'border-')}`}>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900">{category.category_name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${color.bg} text-white font-medium`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{category.transaction_count} transaksi</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`font-bold text-lg ${color.text}`}>
                              {formatCurrency(category.total_amount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        📋 Total Pengeluaran ({expenseCategories.length} kategori)
                      </span>
                      <span className="font-bold text-xl text-red-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Chart (Simple Text-based) */}
      {monthly_comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>Perbandingan Bulanan</span>
            </CardTitle>
            <CardDescription>
              Tren pemasukan dan pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly_comparison.slice(-6).map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{month.month}</h4>
                    <div className="text-sm text-gray-600">
                      Saldo: {formatCurrency(month.income - month.expense)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Pemasukan</span>
                      <span className="font-medium">{formatCurrency(month.income)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Pengeluaran</span>
                      <span className="font-medium">{formatCurrency(month.expense)}</span>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

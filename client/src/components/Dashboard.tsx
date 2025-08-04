
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

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏷️</span>
              <span>Kategori Teratas</span>
            </CardTitle>
            <CardDescription>
              Kategori dengan pengeluaran tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {top_categories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Belum ada data kategori
              </p>
            ) : (
              top_categories
                .filter((cat) => cat.category_type === 'expense')
                .slice(0, 5)
                .map((category) => (
                  <div key={category.category_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{category.category_name}</p>
                      <p className="text-sm text-gray-600">{category.transaction_count} transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(category.total_amount)}
                      </p>
                    </div>
                  </div>
                ))
            )}
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

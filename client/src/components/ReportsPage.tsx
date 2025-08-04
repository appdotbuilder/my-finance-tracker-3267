
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { FinancialReport, DateRangeFilter, MonthlySummary, ExportFormat } from '../../../server/src/schema';

interface ReportsPageProps {
  formatCurrency: (amount: number) => string;
}

export function ReportsPage({ formatCurrency }: ReportsPageProps) {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<DateRangeFilter>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period_type: 'monthly'
  });

  const [monthlyFilter, setMonthlyFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reportData = await trpc.getFinancialReport.query(filter);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Gagal membuat laporan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const generateMonthlySummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const summaryData = await trpc.getMonthlySummary.query(monthlyFilter);
      setMonthlySummary(summaryData);
    } catch (error) {
      console.error('Failed to generate monthly summary:', error);
      setError('Gagal membuat ringkasan bulanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [monthlyFilter]);

  const exportReport = async (format: ExportFormat) => {
    setIsLoading(true);
    try {
      await trpc.exportReport.mutate({
        ...filter,
        format
      });
      // NOTE: This is just a stub call - real implementation would handle file download
      alert(`Laporan ${format.toUpperCase()} berhasil diekspor! (Fitur ini masih dalam pengembangan)`);
    } catch (error) {
      console.error('Failed to export report:', error);
      setError(`Gagal mengekspor laporan ${format.toUpperCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1];
  };

  const setPredefinedDateRange = (type: string) => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();

    switch (type) {
      case 'this_month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        setFilter(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          period_type: 'monthly'
        }));
        break;
      }
      case 'last_month': {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        setFilter(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: lastMonthEnd.toISOString().split('T')[0],
          period_type: 'monthly'
        }));
        break;
      }
      case 'this_quarter': {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        setFilter(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          period_type: 'quarterly'
        }));
        break;
      }
      case 'this_year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        setFilter(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          period_type: 'yearly'
        }));
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h2>
        <p className="text-gray-600">Analisis mendalam tentang kondisi keuangan Anda</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Report Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>Laporan Periode</span>
            </CardTitle>
            <CardDescription>
              Generate laporan berdasarkan rentang waktu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Date Range Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPredefinedDateRange('this_month')}
              >
                Bulan Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPredefinedDateRange('last_month')}
              >
                Bulan Lalu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPredefinedDateRange('this_quarter')}
              >
                Kuartal Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPredefinedDateRange('this_year')}
              >
                Tahun Ini
              </Button>
            </div>

            <Separator />

            {/* Custom Date Range */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Tanggal Mulai</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={filter.start_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilter((prev: DateRangeFilter) => ({
                        ...prev,
                        start_date: e.target.value
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Tanggal Akhir</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={filter.end_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilter((prev: DateRangeFilter) => ({
                        ...prev,
                        end_date: e.target.value
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_type">Tipe Periode</Label>
                <Select
                  value={filter.period_type || 'custom'}
                  onValueChange={(value: 'custom' | 'monthly' | 'quarterly' | 'yearly') =>
                    setFilter((prev: DateRangeFilter) => ({
                      ...prev,
                      period_type: value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Kustom</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="quarterly">Kuartalan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateReport} disabled={isLoading} className="w-full">
                {isLoading ? 'Membuat Laporan...' : '📊 Buat Laporan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Ringkasan Bulanan</span>
            </CardTitle>
            <CardDescription>
              Ringkasan keuangan untuk bulan tertentu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">Tahun</Label>
                <Select
                  value={monthlyFilter.year.toString()}
                  onValueChange={(value: string) =>
                    setMonthlyFilter(prev => ({
                      ...prev,
                      year: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year: number) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Bulan</Label>
                <Select
                  value={monthlyFilter.month.toString()}
                  onValueChange={(value: string) =>
                    setMonthlyFilter(prev => ({
                      ...prev,
                      month: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month: number) => (
                      <SelectItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={generateMonthlySummary} disabled={isLoading} className="w-full">
              {isLoading ? 'Membuat Ringkasan...' : '📅 Buat Ringkasan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Display */}
      {monthlySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ringkasan {getMonthName(monthlySummary.month)} {monthlySummary.year}</span>
              {monthlySummary.is_overspent && (
                <Badge variant="destructive">⚠️ Pengeluaran Berlebih</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlySummary.total_income)}
                </div>
                <p className="text-sm text-green-800">Total Pemasukan</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlySummary.total_expense)}
                </div>
                <p className="text-sm text-red-800">Total Pengeluaran</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${monthlySummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className={`text-2xl font-bold ${monthlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(monthlySummary.balance)}
                </div>
                <p className={`text-sm ${monthlySummary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  Saldo Bersih
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    Laporan Keuangan Periode {new Date(report.period.start_date).toLocaleDateString('id-ID')} - {new Date(report.period.end_date).toLocaleDateString('id-ID')}
                  </CardTitle>
                  <CardDescription>
                    Tipe: {report.period.type} • Total Saldo: {formatCurrency(report.summary.balance)}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport('pdf')}
                    disabled={isLoading}
                  >
                    📄 Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport('excel')}
                    disabled={isLoading}
                  >
                    📊 Export Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.summary.total_income)}
                  </div>
                  <p className="text-sm text-green-800">Total Pemasukan</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(report.summary.total_expense)}
                  </div>
                  <p className="text-sm text-red-800">Total Pengeluaran</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${report.summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className={`text-2xl font-bold ${report.summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(report.summary.balance)}
                  </div>
                  <p className={`text-sm ${report.summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                    Saldo Bersih
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>Breakdown Pemasukan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.categories
                    .filter(cat => cat.category_type === 'income')
                    .sort((a, b) => b.total_amount - a.total_amount)
                    .map((category) => (
                      <div key={category.category_id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{category.category_name}</p>
                          <p className="text-sm text-gray-600">{category.transaction_count} transaksi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(category.total_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {report.categories.filter(cat => cat.category_type === 'income').length === 0 && (
                    <p className="text-center text-gray-500 py-4">Tidak ada pemasukan dalam periode ini</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💸</span>
                  <span>Breakdown Pengeluaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.categories
                    .filter(cat => cat.category_type === 'expense')
                    .sort((a, b) => b.total_amount - a.total_amount)
                    .map((category) => (
                      <div key={category.category_id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
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
                    ))}
                  {report.categories.filter(cat => cat.category_type === 'expense').length === 0 && (
                    <p className="text-center text-gray-500 py-4">Tidak ada pengeluaran dalam periode ini</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          {report.monthly_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Breakdown Bulanan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.monthly_breakdown.map((month) => (
                    <div key={`${month.year}-${month.month}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">
                          {getMonthName(month.month)} {month.year}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {month.is_overspent && (
                            <Badge variant="destructive" className="text-xs">⚠️ Berlebih</Badge>
                          )}
                          <span className={`font-medium ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(month.balance)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Pemasukan:</span>
                          <span className="font-medium">{formatCurrency(month.total_income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Pengeluaran:</span>
                          <span className="font-medium">{formatCurrency(month.total_expense)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!report && !monthlySummary && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Belum Ada Laporan</h3>
            <p className="text-gray-600 mb-4">
              Pilih periode atau bulan untuk membuat laporan keuangan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

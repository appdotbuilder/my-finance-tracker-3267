
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';

// Import components
import { AuthForm } from '@/components/AuthForm';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { CategoryManager } from '@/components/CategoryManager';
import { ReportsPage } from '@/components/ReportsPage';
import { ProfileSettings } from '@/components/ProfileSettings';

// Import types
import type { User, DashboardData, Category, Transaction } from '../../server/src/schema';

// Icons (using emojis for simplicity)
const icons = {
  dashboard: '📊',
  transactions: '💰',
  categories: '🏷️',
  reports: '📈',
  settings: '⚙️',
  logout: '🚪',
  rupiah: '💵'
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load initial data when user is authenticated
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [dashData, userCategories, userTransactions] = await Promise.all([
        trpc.getDashboardData.query(),
        trpc.getCategories.query(),
        trpc.getTransactions.query()
      ]);
      
      setDashboardData(dashData);
      setCategories(userCategories);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    setUser(null);
    setDashboardData(null);
    setCategories([]);
    setTransactions([]);
    setActiveTab('dashboard');
  };

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Format currency in IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // If not authenticated, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">{icons.rupiah}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KeuanganKu</h1>
            <p className="text-gray-600">Aplikasi Pencatat Keuangan Pribadi</p>
          </div>
          
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          <AuthForm onLogin={handleLogin} onError={setError} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{icons.rupiah}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">KeuanganKu</h1>
                <p className="text-sm text-gray-500">Selamat datang, {user.name}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {dashboardData?.current_month_summary.is_overspent && (
                <Badge variant="destructive" className="animate-pulse">
                  ⚠️ Pengeluaran Berlebih
                </Badge>
              )}
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <span>{icons.logout}</span>
                <span>Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:max-w-2xl">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <span>{icons.dashboard}</span>
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <span>{icons.transactions}</span>
              <span className="hidden sm:inline">Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <span>{icons.categories}</span>
              <span className="hidden sm:inline">Kategori</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <span>{icons.reports}</span>
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <span>{icons.settings}</span>
              <span className="hidden sm:inline">Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <Dashboard 
                data={dashboardData} 
                formatCurrency={formatCurrency}
                onRefresh={refreshData}
              />
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionManager
              transactions={transactions}
              categories={categories}
              formatCurrency={formatCurrency}
              onRefresh={refreshData}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager
              categories={categories}
              onRefresh={refreshData}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsPage
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProfileSettings user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;

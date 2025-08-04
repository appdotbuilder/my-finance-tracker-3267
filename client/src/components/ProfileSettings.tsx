
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, ChangePasswordInput } from '../../../server/src/schema';

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState<ChangePasswordInput>({
    current_password: '',
    new_password: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (passwordData.new_password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      setIsLoading(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Kata sandi baru minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.changePassword.mutate(passwordData);
      setSuccess('Kata sandi berhasil diubah');
      setPasswordData({
        current_password: '',
        new_password: ''
      });
      setConfirmPassword('');
    } catch {
      setError('Gagal mengubah kata sandi. Periksa kata sandi lama Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h2>
        <p className="text-gray-600">Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>👤</span>
              <span>Informasi Profil</span>
            </CardTitle>
            <CardDescription>
              Informasi dasar akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Bergabung</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">
                  {user.created_at.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Untuk mengubah nama atau email, silakan hubungi dukungan.
              </p>
              <Button variant="outline" disabled>
                📧 Hubungi Dukungan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔒</span>
              <span>Ubah Kata Sandi</span>
            </CardTitle>
            <CardDescription>
              Pastikan akun Anda tetap aman dengan kata sandi yang kuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Kata Sandi Lama</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Masukkan kata sandi lama"
                  value={passwordData.current_password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordData((prev: ChangePasswordInput) => ({
                      ...prev,
                      current_password: e.target.value
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Kata Sandi Baru</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
                  value={passwordData.new_password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordData((prev: ChangePasswordInput) => ({
                      ...prev,
                      new_password: e.target.value
                    }))
                  }
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmasi Kata Sandi Baru</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Mengubah...' : '🔐 Ubah Kata Sandi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>ℹ️</span>
            <span>Tentang Aplikasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">💵</div>
              <h3 className="font-semibold">KeuanganKu</h3>
              <p className="text-sm text-gray-600">Aplikasi Pencatat Keuangan Pribadi</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold">Aman & Privat</h3>
              <p className="text-sm text-gray-600">Data Anda terlindungi dengan enkripsi</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold">Laporan Lengkap</h3>
              <p className="text-sm text-gray-600">Analisis keuangan yang mendalam</p>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 KeuanganKu. Semua hak dilindungi.</p>
            <p className="mt-1">
              Versi 1.0.0 • 
              <Button variant="link" className="h-auto p-0 ml-1 text-sm">
                Lihat Pembaruan
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

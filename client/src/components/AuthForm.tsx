
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, LoginInput, RegisterInput } from '../../../server/src/schema';

interface AuthFormProps {
  onLogin: (user: User) => void;
  onError: (error: string) => void;
}

export function AuthForm({ onLogin, onError }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<RegisterInput>({
    email: '',
    password: '',
    name: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError('');

    try {
      const result = await trpc.login.mutate(loginData);
      onLogin(result);
    } catch {
      onError('Email atau kata sandi salah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError('');

    try {
      const result = await trpc.register.mutate(registerData);
      onLogin(result);
    } catch {
      onError('Gagal mendaftar. Email mungkin sudah digunakan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Masuk ke Akun Anda</CardTitle>
        <CardDescription>
          Kelola keuangan pribadi Anda dengan mudah
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Kata Sandi</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Masuk...' : 'Masuk'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nama Lengkap</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Nama lengkap Anda"
                  value={registerData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Kata Sandi</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterInput) => ({ ...prev, password: e.target.value }))
                  }
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Mendaftar...' : 'Daftar'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginDto } from '@whatsell/shared';
import { apiPost, apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface MeResponse {
  data: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    onboardingCompleted: boolean;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginDto) => {
    setGlobalError(null);
    try {
      await apiPost<{ message: string }>('/api/v1/auth/login', data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        setGlobalError('Email ou mot de passe invalide.');
      } else {
        setGlobalError('Une erreur est survenue. Veuillez réessayer.');
      }
      return;
    }
    try {
      const me = await apiGet<MeResponse>('/api/v1/auth/me');
      if (me.data.onboardingCompleted) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } catch {
      router.push('/onboarding');
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Se connecter</h2>
        <p className="text-sm text-text-muted mt-1">Accédez à votre dashboard Whatsell</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            {...register('email')}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            Mot de passe
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            {...register('password')}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {globalError && (
          <p role="alert" className="text-sm text-destructive">
            {globalError}
          </p>
        )}

        <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Inscrivez-vous
        </Link>
      </p>
    </Card>
  );
}

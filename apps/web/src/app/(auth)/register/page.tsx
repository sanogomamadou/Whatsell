'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerSchema, type RegisterDto } from '@whatsell/shared';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterDto) => {
    setGlobalError(null);
    try {
      await apiPost<{ message: string }>('/api/v1/auth/register', data);
      router.push('/onboarding');
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        setError('email', {
          message: 'Cet email est déjà associé à un compte. Connectez-vous ?',
        });
      } else {
        setGlobalError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Créer mon compte</h2>
        <p className="text-sm text-text-muted mt-1">Essai Pro 7 jours offert à l&apos;inscription</p>
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
            placeholder="8 caractères minimum"
            autoComplete="new-password"
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
          {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Connectez-vous
        </Link>
      </p>
    </Card>
  );
}

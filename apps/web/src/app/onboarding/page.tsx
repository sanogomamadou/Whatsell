'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { updateProfileSchema, type UpdateProfileDto } from '@whatsell/shared';
import { apiFormData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

type ProfileResponse = { data: { name: string; logoUrl: string | null } };

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdateProfileDto>({ resolver: zodResolver(updateProfileSchema) });

  // Libérer l'URL objet quand le composant est démonté ou quand logoPreview change
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const onSubmit = async (data: UpdateProfileDto) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      await apiFormData<ProfileResponse>('PATCH', '/api/v1/onboarding/profile', formData);
      router.push('/onboarding/whatsapp');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('413')) {
        setError('root', { message: 'Le logo ne peut pas dépasser 5 Mo.' });
      } else if (message.includes('415')) {
        setError('root', { message: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' });
      } else if (message.includes('400')) {
        setError('root', { message: 'Veuillez renseigner un nom de boutique valide.' });
      } else {
        setError('root', { message: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Indicateur d'étape */}
        <OnboardingStep
          stepNumber={1}
          total={5}
          title="Profil boutique"
          status="active"
        />

        {/* Formulaire */}
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary">
              Configurez votre boutique
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Ces informations seront utilisées par votre agent IA.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Champ nom boutique */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-text-primary">
                Nom de votre boutique <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Ex : Boutique Fatou Mode"
                autoComplete="organization"
                className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                {...register('name')}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-required="true"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Upload logo */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">
                Logo de votre boutique (optionnel)
              </span>

              <div className="flex items-center gap-3">
                {/* Prévisualisation */}
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Aperçu du logo"
                    className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0"
                  />
                )}

                {/* Bouton upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-4 py-2 border border-border rounded-lg text-sm text-text-primary hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {logoPreview ? 'Changer le logo' : 'Ajouter un logo (optionnel)'}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                className="sr-only"
                aria-label="Choisir un logo pour la boutique"
              />
              <p className="text-xs text-text-muted">
                JPEG, PNG ou WebP — max 5 Mo
              </p>
            </div>

            {/* Erreur globale */}
            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            {/* Bouton soumission */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement…' : 'Continuer'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

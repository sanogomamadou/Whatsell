'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  connectWhatsappSchema,
  type UpdateProfileDto,
  type ConnectWhatsappDto,
} from '@whatsell/shared';
import { apiGet, apiFormData, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { TrialExpiryBanner } from '@/components/shared';

type ProfileSettings = {
  name: string;
  logoUrl: string | null;
  whatsappBusinessAccountId: string | null;
};

type ProfileSettingsResponse = { data: ProfileSettings };
type UpdateProfileResponse = { data: { name: string; logoUrl: string | null } };
type WhatsappConnectResponse = { data: { whatsappBusinessAccountId: string } };

export default function SettingsPage() {
  const { toast } = useToast();

  // État du chargement du profil
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [connectedWabaId, setConnectedWabaId] = useState<string | null>(null);

  // Upload logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulaire profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
    setError: setProfileError,
  } = useForm<UpdateProfileDto>({ resolver: zodResolver(updateProfileSchema) });

  // Formulaire WhatsApp
  const {
    register: registerWhatsapp,
    handleSubmit: handleSubmitWhatsapp,
    reset: resetWhatsapp,
    formState: { errors: whatsappErrors, isSubmitting: isReconnecting },
    setError: setWhatsappError,
  } = useForm<ConnectWhatsappDto>({ resolver: zodResolver(connectWhatsappSchema) });

  // Libérer l'URL objet lors du démontage
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const loadProfile = () => {
    setLoadError(false);
    apiGet<ProfileSettingsResponse>('/api/v1/settings/profile')
      .then((res) => {
        setProfile(res.data);
        setConnectedWabaId(res.data.whatsappBusinessAccountId);
        resetProfile({ name: res.data.name });
      })
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const onSubmitProfile = async (data: UpdateProfileDto) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (logoFile) formData.append('logo', logoFile);

    try {
      const res = await apiFormData<UpdateProfileResponse>('PATCH', '/api/v1/settings/profile', formData);
      setProfile((prev) =>
        prev ? { ...prev, name: res.data.name, logoUrl: res.data.logoUrl } : prev,
      );
      toast({ description: 'Profil mis à jour' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('413')) {
        setProfileError('root', { message: 'Le logo ne peut pas dépasser 5 Mo.' });
      } else if (message.includes('415')) {
        setProfileError('root', { message: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' });
      } else if (message.includes('400')) {
        setProfileError('root', { message: 'Veuillez renseigner un nom de boutique valide.' });
      } else {
        setProfileError('root', { message: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    }
  };

  const onSubmitWhatsapp = async (data: ConnectWhatsappDto) => {
    try {
      const res = await apiPost<WhatsappConnectResponse>(
        '/api/v1/settings/whatsapp-connect',
        data,
      );
      setConnectedWabaId(res.data.whatsappBusinessAccountId);
      resetWhatsapp();
      toast({ description: 'WhatsApp reconnecté avec succès' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('400')) {
        setWhatsappError('root', {
          message: 'Les informations saisies sont invalides. Vérifiez votre identifiant et votre token.',
        });
      } else if (message.includes('401')) {
        setWhatsappError('root', { message: 'Session expirée. Veuillez vous reconnecter.' });
      } else {
        setWhatsappError('root', {
          message: 'Connexion WhatsApp échouée. Vérifiez vos informations ou contactez le support.',
        });
      }
    }
  };

  // ── Erreur de chargement ────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>
          <Card className="p-6 text-center space-y-4">
            <p className="text-sm text-destructive">
              Impossible de charger vos paramètres. Vérifiez votre connexion.
            </p>
            <Button variant="outline" className="w-full h-12" onClick={loadProfile}>
              Réessayer
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Chargement initial ──────────────────────────────────────────────────────

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
        <div className="w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3" />
          <Card className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded" />
          </Card>
          <Card className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </Card>
        </div>
      </div>
    );
  }

  // ── Page principale ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>

        <TrialExpiryBanner />

        {/* ── Section Profil Boutique ─────────────────────────────────────── */}
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-text-primary">Profil Boutique</h2>
            <p className="text-sm text-text-muted mt-1">
              Ces informations sont utilisées par votre agent IA.
            </p>
          </div>

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} noValidate className="space-y-5">
            {/* Nom boutique */}
            <div className="space-y-1">
              <label htmlFor="shop-name" className="text-sm font-medium text-text-primary">
                Nom de la boutique <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="shop-name"
                type="text"
                placeholder="Ex : Boutique Fatou Mode"
                autoComplete="organization"
                className={`h-12 ${profileErrors.name ? 'border-destructive' : ''}`}
                {...registerProfile('name')}
                aria-describedby={profileErrors.name ? 'name-error' : undefined}
                aria-required="true"
              />
              {profileErrors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            {/* Upload logo */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">
                Logo de la boutique (optionnel)
              </span>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Aperçu du logo"
                    className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0"
                  />
                ) : profile.logoUrl ? (
                  <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-text-muted">Logo actuel</span>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-4 py-2 border border-border rounded-lg text-sm text-text-primary hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {logoPreview || profile.logoUrl ? 'Changer le logo' : 'Ajouter un logo (optionnel)'}
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
              <p className="text-xs text-text-muted">JPEG, PNG ou WebP — max 5 Mo</p>
            </div>

            {/* Erreur globale profil */}
            {profileErrors.root && (
              <p role="alert" className="text-sm text-destructive">
                {profileErrors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full h-12" disabled={isSavingProfile}>
              {isSavingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </Card>

        {/* ── Section WhatsApp Business ───────────────────────────────────── */}
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-text-primary">WhatsApp Business</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-text-muted">Statut :</span>
              {connectedWabaId ? (
                <span className="text-sm font-medium text-agent">✓ Connecté</span>
              ) : (
                <span className="text-sm font-medium text-warning">Non connecté</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitWhatsapp(onSubmitWhatsapp)} noValidate className="space-y-5">
            {/* WABA ID */}
            <div className="space-y-1">
              <label htmlFor="waba-id" className="text-sm font-medium text-text-primary">
                WhatsApp Business Account ID <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="waba-id"
                type="text"
                placeholder="Ex : 123456789012345"
                autoComplete="off"
                className={`h-12 ${whatsappErrors.whatsappBusinessAccountId ? 'border-destructive' : ''}`}
                {...registerWhatsapp('whatsappBusinessAccountId')}
                aria-describedby={whatsappErrors.whatsappBusinessAccountId ? 'waba-error' : undefined}
                aria-required="true"
              />
              {whatsappErrors.whatsappBusinessAccountId && (
                <p id="waba-error" className="text-sm text-destructive" role="alert">
                  {whatsappErrors.whatsappBusinessAccountId.message}
                </p>
              )}
            </div>

            {/* Token */}
            <div className="space-y-1">
              <label htmlFor="waba-token" className="text-sm font-medium text-text-primary">
                Token d&apos;accès <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="waba-token"
                type="password"
                placeholder="Votre token d'accès permanent"
                autoComplete="new-password"
                className={`h-12 ${whatsappErrors.whatsappToken ? 'border-destructive' : ''}`}
                {...registerWhatsapp('whatsappToken')}
                aria-describedby={whatsappErrors.whatsappToken ? 'token-error' : undefined}
                aria-required="true"
              />
              {whatsappErrors.whatsappToken && (
                <p id="token-error" className="text-sm text-destructive" role="alert">
                  {whatsappErrors.whatsappToken.message}
                </p>
              )}
            </div>

            {/* Erreur globale WhatsApp */}
            {whatsappErrors.root && (
              <p role="alert" className="text-sm text-destructive">
                {whatsappErrors.root.message}
              </p>
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full h-12"
              disabled={isReconnecting}
            >
              {isReconnecting ? 'Connexion en cours…' : 'Reconnecter WhatsApp'}
            </Button>
          </form>
        </Card>

        <div className="pb-8" />
      </div>
    </div>
  );
}

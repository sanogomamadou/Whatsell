'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createProductSchema, type CreateProductDto } from '@whatsell/shared';
import { apiFormData, apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

type ProductItem = {
  id: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
};

type ProductsResponse = {
  data: ProductItem[];
  meta: { total: number; page: number; limit: number };
};

type CreateProductResponse = { data: ProductItem };

function ProductsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
      <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
    </div>
  );
}

export default function OnboardingCataloguePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMutatedRef = useRef(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [continueError, setContinueError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<CreateProductDto>({ resolver: zodResolver(createProductSchema) });

  // Chargement initial des produits existants
  useEffect(() => {
    let mounted = true;
    apiGet<ProductsResponse>('/api/v1/products')
      .then((res) => {
        if (mounted && !hasMutatedRef.current) setProducts(res.data);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setIsLoadingProducts(false); });
    return () => { mounted = false; };
  }, []);

  // Cleanup de l'URL objet de prévisualisation
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: CreateProductDto) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('basePrice', String(data.basePrice));
    if (data.description) formData.append('description', data.description);
    if (imageFile) formData.append('image', imageFile);

    try {
      const result = await apiFormData<CreateProductResponse>('POST', '/api/v1/products', formData);
      hasMutatedRef.current = true;
      setProducts((prev) => [result.data, ...prev]);
      reset();
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setContinueError(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('400')) {
        setError('root', { message: 'Les informations saisies sont invalides. Vérifiez le nom et le prix.' });
      } else if (message.includes('413')) {
        setError('root', { message: 'La photo ne peut pas dépasser 5 Mo.' });
      } else if (message.includes('415')) {
        setError('root', { message: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' });
      } else {
        setError('root', { message: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    }
  };

  const handleContinue = () => {
    if (products.length === 0) {
      setContinueError(true);
      return;
    }
    router.push('/onboarding/payment');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Indicateur d'étape */}
        <OnboardingStep
          stepNumber={3}
          total={5}
          title="Catalogue Initial"
          status="active"
        />

        {/* Liste des produits */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">
            Vos produits {products.length > 0 && `(${products.length})`}
          </h2>

          {isLoadingProducts ? (
            <ProductsSkeleton />
          ) : products.length > 0 ? (
            <div className="space-y-2">
              {products.map((product) => (
                <Card key={product.id} className="p-3 flex items-center gap-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-neutral-100 flex-shrink-0 flex items-center justify-center text-xl">
                      🛍️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{product.name}</p>
                    <p className="text-text-muted text-sm">
                      {product.basePrice.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        {/* Formulaire d'ajout de produit */}
        <Card className="p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-text-primary">
              Ajouter un produit
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Ajoutez au moins un produit pour activer votre agent.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Champ nom */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-text-primary">
                Nom du produit <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Ex : Boubou Bazin Bleu Taille L"
                autoComplete="off"
                disabled={isSubmitting}
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

            {/* Champ prix */}
            <div className="space-y-1">
              <label htmlFor="basePrice" className="text-sm font-medium text-text-primary">
                Prix (FCFA) <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="basePrice"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Ex : 15000"
                disabled={isSubmitting}
                className={`h-12 ${errors.basePrice ? 'border-destructive' : ''}`}
                {...register('basePrice')}
                aria-describedby={errors.basePrice ? 'price-error' : undefined}
                aria-required="true"
              />
              {errors.basePrice && (
                <p id="price-error" className="text-sm text-destructive" role="alert">
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            {/* Champ photo optionnel */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">
                Photo du produit (optionnel)
              </span>
              <div className="flex items-center gap-3">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Aperçu du produit"
                    className="w-12 h-12 rounded-md object-cover border border-border flex-shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="min-h-[44px] px-4 py-2 border border-border rounded-lg text-sm text-text-primary hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  {imagePreview ? 'Photo ajoutée ✓' : 'Ajouter une photo'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
                aria-label="Choisir une photo pour le produit"
              />
              <p className="text-xs text-text-muted">JPEG, PNG ou WebP — max 5 Mo</p>
            </div>

            {/* Erreur globale formulaire */}
            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            {/* Bouton ajouter */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ajout en cours…' : 'Ajouter ce produit'}
            </Button>
          </form>
        </Card>

        {/* État vide motivant UX-DR21 */}
        {continueError && products.length === 0 && (
          <Card className="p-4 border-warning bg-warning/5">
            <p className="text-sm font-medium text-text-primary text-center">
              Ajoutez au moins 1 produit pour que votre agent puisse vendre !
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 mt-3"
              onClick={() => document.getElementById('name')?.focus()}
            >
              Ajouter un produit
            </Button>
          </Card>
        )}

        {/* Bouton continuer */}
        <div className="pb-8">
          <Button
            type="button"
            className="w-full h-12"
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}

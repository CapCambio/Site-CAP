import { Suspense, lazy as reactLazy, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// Re-exportação do lazy do React para manter compatibilidade
export const lazy = reactLazy;

type LazyComponentProps = {
  children: ReactNode;
  fallback?: ReactNode | null;
};

export function LazyLoad({ children, fallback }: LazyComponentProps) {
  return (
    <Suspense 
      fallback={fallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    >
      {children}
    </Suspense>
  );
}

type LazyOptions = {
  fallback?: ReactNode;
  prefetch?: boolean;
};

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyOptions = {}
) {
  const LazyComponent = lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.error('Error loading component:', error);
      throw error;
    }
  });

  // Adiciona prefetch se necessário
  if (typeof window !== 'undefined' && options.prefetch) {
    factory().catch(console.error);
  }

  const ComponentWrapper = (props: any) => (
    <LazyLoad fallback={options.fallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  );

  return ComponentWrapper;
}

// Helper para componentes com exportação nomeada
export function lazyNamed<T extends Record<string, any>>(
  importer: () => Promise<T>,
  exportName: keyof T,
  options: LazyOptions = {}
) {
  return lazyWithRetry(
    async () => {
      const module = await importer();
      return { default: module[exportName] as ComponentType<any> };
    },
    options
  );
}

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

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 300;
const RELOAD_GUARD_KEY = 'cap_chunk_reload_ts';
const RELOAD_GUARD_WINDOW_MS = 30 * 1000;

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  );
}

function maybeHardReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
    if (last && Date.now() - last < RELOAD_GUARD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

async function loadWithRetry<T>(factory: () => Promise<{ default: T }>): Promise<{ default: T }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  if (isChunkLoadError(lastError) && maybeHardReload()) {
    // Página está recarregando — mantém promise pendente para Suspense não renderizar erro.
    return new Promise(() => {});
  }
  throw lastError;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyOptions = {}
) {
  const LazyComponent = lazy(async () => {
    try {
      return await loadWithRetry(factory);
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

import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/lib/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Rede de segurança contra exceções de render/lifecycle: sem isto, um card que
// quebra derruba a árvore inteira (tela branca até o usuário recarregar).
// Fallback é estático e o retry só limpa o estado — nunca dá reload automático,
// para não entrar em loop quando o crash é determinístico (dado malformado).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white px-6 text-center">
          <h1 className="text-lg font-semibold">{i18n.t('errorBoundary.title')}</h1>
          <p className="text-sm text-zinc-400 max-w-md">{i18n.t('errorBoundary.message')}</p>
          <button
            onClick={this.handleRetry}
            className="rounded-lg bg-yellow-500 hover:bg-yellow-600 px-4 py-2 text-sm font-medium text-black"
          >
            {i18n.t('network.retry')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/// <reference types="vite/client" />

// Extensão da interface Window para incluir propriedades globais
declare interface Window {
  // Adicione propriedades globais do navegador aqui, se necessário
}

// Extensão da interface ServiceWorkerRegistration para incluir propriedades adicionais
declare interface ServiceWorkerRegistration {
  // Adicione propriedades personalizadas do Service Worker aqui, se necessário
}

// Extensão da interface PushSubscription para incluir propriedades adicionais
declare interface PushSubscription {
  // Adicione propriedades personalizadas da assinatura push aqui, se necessário
}

// Extensão da interface NotificationOptions para incluir propriedades adicionais
declare interface NotificationOptions {
  // Adicione propriedades personalizadas de notificação aqui, se necessário
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Extensão da interface ServiceWorkerGlobalScope para incluir propriedades adicionais
declare var self: ServiceWorkerGlobalScope;

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';
declare module '*.ico';
declare module '*.bmp';
declare module '*.tiff';

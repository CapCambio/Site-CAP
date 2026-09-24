# Seções arquivadas da Home

As seções **Uma jornada sem ruído** e **Centro de confiança CAP** foram removidas da página pública a pedido da CAP Câmbio em agosto de 2026. Seus componentes completos estão preservados em `HomeArchivedSections.tsx`.

Para restaurá-las, importe `ProcessJourneySection` e `TrustCenterSection` em `client/src/pages/Home.tsx`, renderize-as após a seção de serviços e passe, respectivamente, `onPrepareInquiry={prepareInquiry}` e `whatsappUrl={whatsappCaxias}`.

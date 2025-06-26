import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PoliticaDePrivacidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PoliticaDePrivacidadeModal({ isOpen, onClose }: PoliticaDePrivacidadeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 overflow-y-auto">
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-yellow-400 text-xl font-semibold">Política de Privacidade</h2>
          <Button 
            onClick={onClose}
            className="flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-600 border-none transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        
        <div className="text-white max-w-4xl mx-auto">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">1. Introdução</h3>
              <p className="text-zinc-300 mb-4">
                A CAP Câmbio valoriza a privacidade e a proteção dos dados pessoais de seus usuários. Esta Política de Privacidade explica como coletamos, utilizamos, protegemos, armazenamos e, quando necessário, compartilhamos suas informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">2. Informações Coletadas</h3>
              <p className="text-zinc-300 mb-4">
                Coletamos informações pessoais que você fornece diretamente ou que são geradas automaticamente durante o uso da plataforma, incluindo:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Endereço de e-mail;</li>
                <li>Nome;</li>
                <li>Preferências de alertas e notificações;</li>
                <li>Informações de uso da plataforma e dados de navegação (como cookies, endereço IP, tipo de dispositivo, dados de sessão).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">3. Finalidade do Uso dos Dados</h3>
              <p className="text-zinc-300 mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Fornecer e gerenciar o acesso à plataforma de cotações;</li>
                <li>Personalizar sua experiência e enviar alertas de preços configurados por você;</li>
                <li>Melhorar e otimizar nossos serviços;</li>
                <li>Garantir a segurança da plataforma;</li>
                <li>Enviar comunicações importantes sobre o serviço (como atualizações, manutenções e mudanças nos termos).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">4. Compartilhamento de Informações</h3>
              <p className="text-zinc-300 mb-4">
                Não vendemos nem alugamos seus dados pessoais. Somente compartilhamos suas informações quando estritamente necessário para:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Cumprir obrigações legais ou regulatórias;</li>
                <li>Proteger os direitos, a segurança e a integridade da CAP Câmbio e de seus usuários;</li>
                <li>Executar serviços técnicos essenciais, como hospedagem e infraestrutura, sempre com parceiros que também respeitam a LGPD.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">5. Segurança dos Dados</h3>
              <p className="text-zinc-300 mb-4">
                Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados contra acessos não autorizados, perda, uso indevido, alteração ou divulgação indevida. No entanto, nenhum sistema é completamente imune, e recomendamos que você também proteja suas credenciais.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">6. Retenção de Dados</h3>
              <p className="text-zinc-300 mb-4">
                Seus dados serão armazenados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, exceto quando exigido por obrigações legais ou regulatórias que exijam retenção por prazo superior.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">7. Cookies e Tecnologias Similares</h3>
              <p className="text-zinc-300 mb-4">
                Utilizamos cookies e tecnologias semelhantes para:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Melhorar o desempenho da plataforma;</li>
                <li>Analisar padrões de uso;</li>
                <li>Manter sua sessão ativa e lembrar suas preferências.</li>
              </ul>
              <p className="text-zinc-300 mb-4">
                Você pode desativar os cookies nas configurações do seu navegador, mas isso pode afetar a experiência de uso.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">8. Seus Direitos como Titular de Dados</h3>
              <p className="text-zinc-300 mb-4">
                Você tem os seguintes direitos garantidos pela LGPD:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Confirmar se tratamos seus dados e acessá-los;</li>
                <li>Corrigir dados pessoais incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a exclusão dos seus dados, quando aplicável;</li>
                <li>Retirar seu consentimento, quando o tratamento for baseado nele;</li>
                <li>Portabilidade de dados, mediante requisição expressa;</li>
                <li>Solicitar informações sobre compartilhamentos realizados.</li>
              </ul>
              <p className="text-zinc-300 mb-4">
                Para exercer qualquer desses direitos, entre em contato pelos nossos canais oficiais.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">9. Alterações nesta Política</h3>
              <p className="text-zinc-300 mb-4">
                Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos você sobre mudanças relevantes por meio da plataforma ou pelo seu e-mail cadastrado. A versão mais recente sempre estará disponível nesta página.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">10. Contato</h3>
              <p className="text-zinc-300">
                Em caso de dúvidas, solicitações ou para exercer seus direitos como titular de dados, entre em contato conosco pelo e-mail:
              </p>
              <p className="text-zinc-300 mt-2">
                📧 capcambio_caxias@hotmail.com
              </p>
            </section>
            
            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-center">
              <Button 
                onClick={onClose}
                className="flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-600 border-none transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
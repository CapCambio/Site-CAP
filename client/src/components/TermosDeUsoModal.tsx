
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TermosDeUsoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermosDeUsoModal({ isOpen, onClose }: TermosDeUsoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 overflow-y-auto">
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-yellow-400 text-xl font-semibold">Termos de Uso</h2>
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
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">1. Aceitação dos Termos</h3>
              <p className="text-zinc-300 mb-4">
                Ao acessar e utilizar a plataforma CAP Câmbio, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">2. Vigência</h3>
              <p className="text-zinc-300 mb-4">
                Estes Termos de Uso entram em vigor a partir da data de sua publicação e permanecerão válidos enquanto a plataforma estiver ativa ou até que uma nova versão os substitua.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">3. Descrição do Serviço</h3>
              <p className="text-zinc-300 mb-4">
                A CAP Câmbio oferece uma plataforma online para consulta de cotações de moedas estrangeiras e serviços relacionados ao câmbio. As informações são disponibilizadas "como estão" e "conforme disponíveis", com atualizações regulares e finalidade exclusivamente informativa.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">4. Uso Adequado e Responsabilidades do Usuário</h3>
              <p className="text-zinc-300 mb-4">
                Você concorda em utilizar a plataforma de forma ética, legal e responsável. É vedado:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Fornecer informações falsas ou desatualizadas;</li>
                <li>Compartilhar suas credenciais com terceiros ou não protegê-las adequadamente;</li>
                <li>Utilizar o serviço para fins ilegais, fraudulentos ou prejudiciais;</li>
                <li>Tentar acessar áreas restritas do sistema ou interferir em seu funcionamento;</li>
                <li>Reproduzir, distribuir, modificar ou explorar comercialmente qualquer conteúdo sem autorização expressa.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">5. Informações e Cotações</h3>
              <p className="text-zinc-300 mb-4">
                As cotações exibidas são meramente informativas e podem não refletir os valores exatos praticados no momento da consulta. Para transações oficiais, recomendamos contato direto com nossa equipe.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">6. Limitação de Responsabilidade</h3>
              <p className="text-zinc-300 mb-4">
                Na extensão máxima permitida pela legislação aplicável, a CAP Câmbio não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>Quaisquer erros, omissões ou imprecisões nas informações apresentadas;</li>
                <li>Interrupções, falhas técnicas ou indisponibilidades temporárias da plataforma;</li>
                <li>Decisões tomadas com base nas informações disponibilizadas;</li>
                <li>Danos diretos, indiretos, incidentais, especiais, consequentes ou punitivos resultantes do uso (ou da impossibilidade de uso) da plataforma.</li>
              </ul>
              <p className="text-zinc-300 mb-4">
                Esta cláusula não exclui ou limita direitos garantidos por lei ao consumidor.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">7. Propriedade Intelectual</h3>
              <p className="text-zinc-300 mb-4">
                Todo o conteúdo, incluindo marcas, logotipos, textos, imagens e códigos fonte, pertence à CAP Câmbio ou a seus licenciantes. É proibido o uso indevido sem prévia autorização por escrito.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">8. Modificações nos Termos e no Serviço</h3>
              <p className="text-zinc-300 mb-4">
                Podemos alterar estes Termos de Uso a qualquer momento. As modificações entrarão em vigor a partir da publicação nesta página, com indicação da data de atualização.
              </p>
              <p className="text-zinc-300 mb-4">
                Caso você não concorde com os novos termos, deverá descontinuar o uso da plataforma. A continuidade no uso será interpretada como aceitação tácita das alterações.
              </p>
              <p className="text-zinc-300 mb-4">
                Também nos reservamos o direito de modificar, suspender ou encerrar o serviço, total ou parcialmente, sem aviso prévio.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">9. Lei Aplicável e Foro</h3>
              <p className="text-zinc-300 mb-4">
                Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil.
              </p>
              <p className="text-zinc-300 mb-4">
                Fica eleito o foro da comarca de Caxias do Sul-RS, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias decorrentes destes Termos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">10. Contato</h3>
              <p className="text-zinc-300">
                Para dúvidas, sugestões ou solicitações relacionadas a estes Termos de Uso, entre em contato por meio do e-mail: capcambio_caxias@hotmail.com.
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

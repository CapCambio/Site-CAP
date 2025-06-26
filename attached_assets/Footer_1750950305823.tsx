import { useState } from "react";
import { TermosDeUsoModal } from "./TermosDeUsoModal";
import { PoliticaDePrivacidadeModal } from "./PoliticaDePrivacidadeModal";

export function Footer() {
  const [showTermos, setShowTermos] = useState(false);
  const [showPolitica, setShowPolitica] = useState(false);

  return (
    <>
      <footer className="bg-[#000000] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">&copy; {new Date().getFullYear()} CAP Câmbio. Todos os direitos reservados.</p>
            </div>
            <div className="flex space-x-4 text-sm">
              <button 
                onClick={() => setShowTermos(true)}
                className="hover:text-yellow-400 transition-colors underline"
              >
                Termos de Uso
              </button>
              <button 
                onClick={() => setShowPolitica(true)}
                className="hover:text-yellow-400 transition-colors underline"
              >
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>
      </footer>

      <TermosDeUsoModal 
        isOpen={showTermos} 
        onClose={() => setShowTermos(false)} 
      />
      <PoliticaDePrivacidadeModal 
        isOpen={showPolitica} 
        onClose={() => setShowPolitica(false)} 
      />
    </>
  );
}

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function WhatsAppFloatingButton() {
  const [showBranchDialog, setShowBranchDialog] = useState(false);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setShowBranchDialog(true)}
        className="fixed bottom-20 md:bottom-12 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Contato via WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </button>

      {/* Dialog com os contatos */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="bg-zinc-900 border-yellow-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Com qual CAP deseja falar?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {[
              { name: "Caxias do Sul - RS", link: "https://api.whatsapp.com/send?phone=5554984348005&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
              { name: "Bento Gonçalves - RS", link: "https://api.whatsapp.com/send?phone=5554999578486&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
              { name: "Passo Fundo - RS", link: "https://api.whatsapp.com/send?phone=5554996280422&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" }
            ].map((branch) => (
              <a
                key={branch.name}
                href={branch.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
                onClick={() => setShowBranchDialog(false)}
              >
                <FaWhatsapp className="text-green-500 text-xl" />
                <span className="text-yellow-500">{branch.name}</span>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import capLogo from "@assets/cap logo fundo.png";

export function Header() {
  return (
    <header className="bg-[#000000] text-white px-4 py-3 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <img 
            src={capLogo} 
            alt="CAP Câmbio Logo" 
            className="h-14 md:h-16"
          />
        </div>
      </div>
    </header>
  );
}
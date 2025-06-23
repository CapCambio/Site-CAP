import capLogo from "@assets/cap logo fundo.png";

export function Header() {
  return (
    <header className="bg-[#000000] text-white px-4 py-2 shadow-md mb-2">
      <div className="container mx-auto">
        <div className="flex flex-col items-center">
          <img 
            src={capLogo} 
            alt="CAP Câmbio Logo" 
            className="h-24 md:h-28 mb-1"
          />
        </div>
      </div>
    </header>
  );
}
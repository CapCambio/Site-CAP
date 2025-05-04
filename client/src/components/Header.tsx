import capLogo from "@assets/cap logo fundo.png";

export function Header() {
  return (
    <header className="bg-[#000000] text-white px-4 pt-3 pb-1 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <img 
            src={capLogo} 
            alt="CAP Câmbio Logo" 
            className="h-28 md:h-32"
          />
        </div>
      </div>
    </header>
  );
}
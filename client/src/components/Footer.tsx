export function Footer() {
  return (
    <footer className="bg-[#000000] text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">&copy; {new Date().getFullYear()} CAP Cotações. Todos os direitos reservados.</p>
          </div>
          <div>
            <p className="text-sm">Os valores apresentados são informativos e podem variar. Consulte a agência para cotações oficiais.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

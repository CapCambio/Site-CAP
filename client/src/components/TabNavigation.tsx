import { TabType } from "../lib/types";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="mb-6">
      <div className="container mx-auto">
        <div className="flex overflow-x-auto">
          <button 
            onClick={() => onTabChange("current")}
            className={`py-4 px-6 font-medium focus:outline-none transition-colors
              ${activeTab === "current" 
                ? "text-[#1a1a1a] border-b-2 border-[#f3b234]" 
                : "text-gray-500 hover:text-[#1a1a1a] border-b-2 border-transparent hover:border-gray-300"}`}
          >
            Cotações Atuais
          </button>
          <button 
            onClick={() => onTabChange("history")}
            className={`py-4 px-6 font-medium focus:outline-none transition-colors
              ${activeTab === "history" 
                ? "text-[#1a1a1a] border-b-2 border-[#f3b234]" 
                : "text-gray-500 hover:text-[#1a1a1a] border-b-2 border-transparent hover:border-gray-300"}`}
          >
            Histórico
          </button>
        </div>
      </div>
    </div>
  );
}

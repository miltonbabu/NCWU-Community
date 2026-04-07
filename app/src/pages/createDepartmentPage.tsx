import { ThemeProvider } from "@/components/ThemeProvider";
import DepartmentPageContent from "./DepartmentPage";

export interface DepartmentConfig {
  id: string;
  titleKey: string;
  fullNameKey: string;
  year: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  descriptionKey: string;
  scheduleLink: string;
}

export function createDepartmentPage(config: DepartmentConfig) {
  return function DepartmentPage() {
    return (
      <ThemeProvider>
        <DepartmentPageContent config={config} />
      </ThemeProvider>
    );
  };
}

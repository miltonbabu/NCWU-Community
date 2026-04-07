import { createDepartmentPage } from "./createDepartmentPage";
import { Zap } from "lucide-react";

const config = {
  id: "electrical-engineering-2025",
  titleKey: "dept.electricalEngineering2025",
  fullNameKey: "nav.electricalEngineering",
  year: "2025",
  icon: Zap,
  color: "text-emerald-500",
  gradient: "from-emerald-500 to-teal-600",
  descriptionKey: "dept.electricalEngineeringDesc",
  scheduleLink: "/electrical-engineering-2025/class-schedule",
};

export default createDepartmentPage(config);

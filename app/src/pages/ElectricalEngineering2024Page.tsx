import { createDepartmentPage } from "./createDepartmentPage";
import { Zap } from "lucide-react";

const config = {
  id: "electrical-engineering-2024",
  titleKey: "dept.electricalEngineering2024",
  fullNameKey: "nav.electricalEngineering",
  year: "2024",
  icon: Zap,
  color: "text-lime-500",
  gradient: "from-lime-500 to-green-600",
  descriptionKey: "dept.electricalEngineeringDesc",
  scheduleLink: "/electrical-engineering-2024/class-schedule",
};

export default createDepartmentPage(config);

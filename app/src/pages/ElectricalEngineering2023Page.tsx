import { createDepartmentPage } from "./createDepartmentPage";
import { Zap } from "lucide-react";

const config = {
  id: "electrical-engineering-2023",
  titleKey: "dept.electricalEngineering2023",
  fullNameKey: "nav.electricalEngineering",
  year: "2023",
  icon: Zap,
  color: "text-yellow-500",
  gradient: "from-yellow-500 to-amber-600",
  descriptionKey: "dept.electricalEngineeringDesc",
  scheduleLink: "/electrical-engineering-2023/class-schedule",
};

export default createDepartmentPage(config);

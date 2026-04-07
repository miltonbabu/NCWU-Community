import { createDepartmentPage } from "./createDepartmentPage";
import { Building2 } from "lucide-react";

const config = {
  id: "civil-engineering-2025",
  titleKey: "dept.civilEngineering2025",
  fullNameKey: "nav.civilEngineering",
  year: "2025",
  icon: Building2,
  color: "text-red-500",
  gradient: "from-red-500 to-rose-600",
  descriptionKey: "dept.civilEngineeringDesc",
  scheduleLink: "/civil-engineering-2025/class-schedule",
};

export default createDepartmentPage(config);

import { createDepartmentPage } from "./createDepartmentPage";
import { Building2 } from "lucide-react";

const config = {
  id: "civil-engineering-2024",
  titleKey: "dept.civilEngineering2024",
  fullNameKey: "nav.civilEngineering",
  year: "2024",
  icon: Building2,
  color: "text-orange-500",
  gradient: "from-orange-500 to-red-600",
  descriptionKey: "dept.civilEngineeringDesc",
  scheduleLink: "/civil-engineering-2024/class-schedule",
};

export default createDepartmentPage(config);

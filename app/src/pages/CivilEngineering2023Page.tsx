import { createDepartmentPage } from "./createDepartmentPage";
import { Building2 } from "lucide-react";

const config = {
  id: "civil-engineering-2023",
  titleKey: "dept.civilEngineering2023",
  fullNameKey: "nav.civilEngineering",
  year: "2023",
  icon: Building2,
  color: "text-amber-500",
  gradient: "from-amber-500 to-orange-600",
  descriptionKey: "dept.civilEngineeringDesc",
  scheduleLink: "/civil-engineering-2023/class-schedule",
};

export default createDepartmentPage(config);

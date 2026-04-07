import { createDepartmentPage } from "./createDepartmentPage";
import { Cog } from "lucide-react";

const config = {
  id: "mechanical-engineering-2023",
  titleKey: "dept.mechanicalEngineering2023",
  fullNameKey: "nav.mechanicalEngineering",
  year: "2023",
  icon: Cog,
  color: "text-slate-500",
  gradient: "from-slate-500 to-gray-600",
  descriptionKey: "dept.mechanicalEngineeringDesc",
  scheduleLink: "/mechanical-engineering-2023/class-schedule",
};

export default createDepartmentPage(config);

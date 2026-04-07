import { createDepartmentPage } from "./createDepartmentPage";
import { Cog } from "lucide-react";

const config = {
  id: "mechanical-engineering-2025",
  titleKey: "dept.mechanicalEngineering2025",
  fullNameKey: "nav.mechanicalEngineering",
  year: "2025",
  icon: Cog,
  color: "text-stone-500",
  gradient: "from-stone-500 to-warmGray-600",
  descriptionKey: "dept.mechanicalEngineeringDesc",
  scheduleLink: "/mechanical-engineering-2025/class-schedule",
};

export default createDepartmentPage(config);

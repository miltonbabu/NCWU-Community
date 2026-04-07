import { createDepartmentPage } from "./createDepartmentPage";
import { Cog } from "lucide-react";

const config = {
  id: "mechanical-engineering-2024",
  titleKey: "dept.mechanicalEngineering2024",
  fullNameKey: "nav.mechanicalEngineering",
  year: "2024",
  icon: Cog,
  color: "text-zinc-500",
  gradient: "from-zinc-500 to-neutral-600",
  descriptionKey: "dept.mechanicalEngineeringDesc",
  scheduleLink: "/mechanical-engineering-2024/class-schedule",
};

export default createDepartmentPage(config);

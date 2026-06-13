import { Compass, Cpu, Palette, FlaskConical, Dices } from "lucide-react";

export type Category = "all" | "tech" | "art" | "science" | "random";

export const CATEGORIES: {
  value: Category;
  label: string;
  icon: typeof Compass;
}[] = [
  { value: "all", label: "Discover", icon: Compass },
  { value: "tech", label: "Tech", icon: Cpu },
  { value: "art", label: "Art", icon: Palette },
  { value: "science", label: "Science", icon: FlaskConical },
  { value: "random", label: "Random", icon: Dices },
];

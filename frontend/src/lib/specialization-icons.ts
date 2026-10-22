import {
  Baby,
  Bone,
  Brain,
  Droplet,
  Hand,
  HandHeart,
  HeartPulse,
  Pill,
  Ribbon,
  Scan,
  Stethoscope,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { Specialization } from "./constants";

/** One line icon per specialization, shown wherever a doctor's department gets an icon. */
export const SPECIALIZATION_ICONS: Record<Specialization, LucideIcon> = {
  Cardiology: HeartPulse,
  Dermatology: Hand,
  Endocrinology: Droplet,
  Gastroenterology: Pill,
  "General Medicine": Stethoscope,
  Neurology: Brain,
  Oncology: Ribbon,
  Orthopedics: Bone,
  Pediatrics: Baby,
  Psychiatry: HandHeart,
  Pulmonology: Wind,
  Radiology: Scan,
};

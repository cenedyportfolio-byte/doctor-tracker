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

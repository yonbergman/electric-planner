'use client'

import {
  Lightbulb, Lamp, LampDesk, LampFloor, LampCeiling, LampWallUp,
  Fan, AirVent,
  Blinds, PanelTop,
  Sparkles, Star,
  Plug, Refrigerator, WashingMachine, Tv, Monitor, Speaker,
  Coffee, Microwave, CookingPot, Heater,
  Sun, Moon,
  Gamepad2, Toilet, Router, Footprints,
  LucideIcon
} from 'lucide-react'
import { IconName } from '@/types'

const ICON_MAP: Record<IconName, LucideIcon> = {
  Lightbulb,
  Lamp,
  LampDesk,
  LampFloor,
  LampCeiling,
  LampWallUp,
  Fan,
  AirVent,
  Blinds,
  PanelTop,
  Sparkles,
  Star,
  Plug,
  Refrigerator,
  WashingMachine,
  Tv,
  Monitor,
  Speaker,
  Coffee,
  Microwave,
  CookingPot,
  Heater,
  Sun,
  Moon,
  Gamepad2,
  Toilet,
  Router,
  Footprints,
}

interface Props {
  icon: IconName
  size?: number
  className?: string
}

export default function ItemIcon({ icon, size = 16, className = '' }: Props) {
  const Icon = ICON_MAP[icon]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

export { ICON_MAP }

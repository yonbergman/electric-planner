export interface Room {
  id: string
  name: string
}

export interface Box {
  id: string
  roomId: string
  name: string
  size: 3 | 4 | 7 | 14
}

export type ModuleType =
  | 'blank'
  | 'light-switch-dumb'
  | 'socket'
  | 'usb-socket'
  | 'light-switch-smart'
  | 'shutter'
  | 'dimmer'
  | 'scenario'
  | 'ethernet'

export const MODULE_SIZES: Record<ModuleType, number> = {
  'blank': 1,
  'light-switch-dumb': 1,
  'socket': 2,
  'usb-socket': 1,
  'light-switch-smart': 1,
  'shutter': 1,
  'dimmer': 1,
  'scenario': 1,
  'ethernet': 1,
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  'blank': 'Blank',
  'light-switch-dumb': 'Light Switch (Dumb)',
  'socket': 'Socket',
  'usb-socket': 'USB Socket',
  'light-switch-smart': 'Light Switch (Smart)',
  'shutter': 'Shutter',
  'dimmer': 'Dimmer',
  'scenario': 'Scenario',
  'ethernet': 'Ethernet',
}

export interface Module {
  id: string
  boxId: string
  type: ModuleType
  position: number
  label: string
  itemId?: string
  notes?: string // for scenario switches
}

export type ItemType = 'light' | 'ceiling-fan' | 'blinds' | 'leds' | 'appliance'

export const ITEM_LABELS: Record<ItemType, string> = {
  'light': 'Light',
  'ceiling-fan': 'Ceiling Fan',
  'blinds': 'Blinds',
  'leds': 'LEDs',
  'appliance': 'Appliance',
}

// Available icons for items (Lucide icon names)
export const AVAILABLE_ICONS = [
  'Lightbulb', 'Lamp', 'LampDesk', 'LampFloor', 'LampCeiling', 'LampWallUp',
  'Fan', 'AirVent',
  'Blinds', 'PanelTop',
  'Sparkles', 'Star',
  'Plug', 'Refrigerator', 'WashingMachine', 'Tv', 'Monitor', 'Speaker',
  'Coffee', 'Microwave', 'CookingPot', 'Heater',
  'Sun', 'Moon',
  'Gamepad2', 'Toilet', 'Router', 'Footprints',
] as const

export type IconName = typeof AVAILABLE_ICONS[number]

// Default icons per item type
export const DEFAULT_ITEM_ICONS: Record<ItemType, IconName> = {
  'light': 'Lightbulb',
  'ceiling-fan': 'Fan',
  'blinds': 'Blinds',
  'leds': 'Sparkles',
  'appliance': 'Plug',
}

export interface Item {
  id: string
  roomId: string
  name?: string
  type: ItemType
  icon?: IconName
}

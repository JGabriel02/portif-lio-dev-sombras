export type Mode = 'dark' | 'shiny'

export type TokenName =
  | 'bg'
  | 'surface'
  | 'surface-raised'
  | 'line'
  | 'text'
  | 'text-muted'
  | 'accent'
  | 'accent-hover'
  | 'on-accent'
  | 'chip-bg'
  | 'chip-text'
  | 'eye'
  | 'mascote-body'
  | 'mascote-tip'
  | 'focus-ring'

export const sombra: Record<Mode, Record<TokenName, string>> = {
  dark: {
    bg: '#140F1F',
    surface: '#1F1730',
    'surface-raised': '#2A2040',
    line: '#3A2C57',
    text: '#EDE7F6',
    'text-muted': '#9C8FB8',
    accent: '#A77BFF',
    'accent-hover': '#B994FF',
    'on-accent': '#140F1F',
    'chip-bg': '#3A2C57',
    'chip-text': '#D9C9FF',
    eye: '#FF4D6D',
    'mascote-body': '#4A3478',
    'mascote-tip': '#C2367A',
    'focus-ring': '#A77BFF',
  },
  shiny: {
    bg: '#F7F5FB',
    surface: '#FFFFFF',
    'surface-raised': '#FFFFFF',
    line: '#E2DCEE',
    text: '#1E1730',
    'text-muted': '#6B6185',
    accent: '#6D3FD6',
    'accent-hover': '#5A2FC0',
    'on-accent': '#FFFFFF',
    'chip-bg': '#EDE5FF',
    'chip-text': '#4B2A9E',
    eye: '#E0244A',
    'mascote-body': '#E9E3F4',
    'mascote-tip': '#FF8AB0',
    'focus-ring': '#6D3FD6',
  },
}

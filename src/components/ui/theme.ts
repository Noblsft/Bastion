import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f7f7' },
          100: { value: '#beeaea' },
          200: { value: '#8dd8d8' },
          300: { value: '#54c1c1' },
          400: { value: '#2aabab' },
          500: { value: '#0d9191' },
          600: { value: '#0a7272' },
          700: { value: '#075454' },
          800: { value: '#043838' },
          900: { value: '#021c1c' },
        },
      },
      spacing: {
        1: { value: '0.25rem' },
        2: { value: '0.5rem' },
        3: { value: '0.75rem' },
        4: { value: '1rem' },
        8: { value: '2rem' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          panel: {
            value: { base: '{colors.white}', _dark: '{colors.brand.900}' },
          },
          canvas: {
            value: { base: '{colors.gray.50}', _dark: '{colors.gray.950}' },
          },
        },
        border: {
          value: { base: '{colors.gray.300}', _dark: '{colors.gray.700}' },
        },
        brand: {
          solid: { value: '{colors.brand.500}' }, // button bg
          contrast: { value: '{colors.white}' }, // button text on solid
          fg: { value: '{colors.brand.600}' }, // text/icon
          muted: { value: '{colors.brand.100}' }, // ghost bg
          subtle: { value: '{colors.brand.200}' }, // hover
          emphasized: { value: '{colors.brand.300}' }, // active
          focusRing: { value: '{colors.brand.500}' }, // focus ring
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

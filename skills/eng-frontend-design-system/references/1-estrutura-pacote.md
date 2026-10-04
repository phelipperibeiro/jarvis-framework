# Estrutura do Pacote

> Parte do skill `eng-frontend-design-system`. Leia este arquivo quando a tarefa criar ou reorganizar o pacote do design system.

## Estrutura do Pacote

```
packages/design-system/
├── src/
│   ├── tokens/
│   │   ├── colors.ts         ← paleta + semântica de cor
│   │   ├── typography.ts     ← escala tipográfica
│   │   ├── spacing.ts        ← escala de espaçamento
│   │   ├── shadows.ts        ← elevações
│   │   ├── radii.ts          ← border-radius
│   │   └── index.ts          ← re-exporta todos os tokens
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── ...
│   ├── hooks/                ← hooks utilitários (useMediaQuery, useTheme, etc.)
│   ├── utils/                ← cn(), formatters, etc.
│   └── index.ts              ← ponto de entrada público
├── .storybook/
├── tailwind.config.ts        ← ou tokens CSS via CSS custom properties
├── package.json
└── tsconfig.json
```

```json
// package.json — ponto de entrada correto
{
  "name": "@{org}/design-system",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./tokens": {
      "import": "./dist/tokens/index.mjs",
      "types": "./dist/tokens/index.d.ts"
    }
  },
  "sideEffects": ["*.css"]
}
```

---

import type { Config } from "tailwindcss";

import { getVersionedTailwindContent } from "@quri/versioned-squiggle-components/tailwind";

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
    "../ui/src/**/*.{ts,tsx}",
    "../components/src/**/*.{ts,tsx}",
    "./theme.config.jsx",
    ...getVersionedTailwindContent(),
  ],
  theme: {
    extend: {
      fontFamily: {
        lato: '"Lato", sans-serif',
        lora: '"Lora"',
      },
    },
  },
  plugins: [
    require("@quri/squiggle-components/tailwind-plugin"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: "class", // strategy: 'base' interferes with react-select styles
    }),
  ],
} satisfies Config;

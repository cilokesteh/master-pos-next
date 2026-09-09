export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "test-results/**",
      "tests/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "no-unused-vars": "off",
    },
  },
];

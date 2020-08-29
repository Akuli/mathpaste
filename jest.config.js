module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: ["jest-canvas-mock"],
  globals: {
    "ts-jest": {
      // ...
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
};

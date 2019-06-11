module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      // ...
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
};

/** @type {import('jest').Config} */
const config = {
  preset: 'react-native',
  setupFiles: ['./__tests__/setup.ts'],
  clearMocks: true,
  testPathIgnorePatterns: [
    'node_modules',
    './__tests__/setup.ts',
    '__utils__'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
  ],
  moduleNameMapper: {
    '@heartbot/expo-google-authentication': '<rootDir>/src/index.ts',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|react-native-vector-icons|expo-modules-core)/)"
  ]
};

module.exports = config;

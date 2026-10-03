/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Mirror the tsconfig "paths" aliases so imports resolve inside tests too.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    // Only our local @prisma/prisma.* alias — NOT the real @prisma/client package
    // (which the generated client imports and must resolve from node_modules).
    '^@prisma/(prisma\\..*)$': '<rootDir>/prisma/$1',
    '^@generated/(.*)$': '<rootDir>/generated/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Tests don't need the strict app build settings; isolatedModules keeps them fast.
        isolatedModules: true,
      },
    ],
  },
};

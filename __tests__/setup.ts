/**
 * This file sets up common mocks across all tests.
 */
module.exports = async function (globalConfig, projectConfig) {
  // Cannot import native code into the Jest test environment. Mock the native module.
  jest.mock("../src/ExpoGoogleAuthenticationModule", () => {
    const nativeModuleMock = {
      configure: jest.fn(),
      signIn: jest.fn().mockReturnValue(Promise.resolve({})),
      loginFromUserAction: jest.fn().mockReturnValue(Promise.resolve({})),
      loginWithoutUserAction: jest.fn().mockReturnValue(Promise.resolve({})),
      logout: jest.fn(),
    };

    return nativeModuleMock;
  });

  // Allows us to mock Platform.OS in each test
  // Usage:
  //
  // import { Platform } from 'react-native';
  //
  // describe('test', () => {
  //   Platform.OS = 'android';
  // });
  jest.mock("react-native/Libraries/Utilities/Platform", () => {
    let platform = {
      OS: "ios",
    };

    const select = jest.fn().mockImplementation((obj) => {
      const value = obj[platform.OS];
      return !value ? obj.default : value;
    });

    Object.assign(platform, { select });

    return platform;
  });
};

import { Platform } from "react-native";
import RandomProperties from "./__utils__/RandomProperties";
import {
  ExpoGoogleAuthenticationConfigureProps,
  CodedError,
} from "@heartbot/expo-google-authentication";
import * as ExpoGoogleAuthentication from "@heartbot/expo-google-authentication";
import ExpoGoogleAuthenticationModule from "../src/ExpoGoogleAuthenticationModule";

it.each([
  ["ios", true],
  ["android", true],
  ["web", false],
])(
  "Configure calls native configure method on Android and iOS",
  (platform, passes) => {
    Platform.OS = platform;

    const configureOptions: ExpoGoogleAuthenticationConfigureProps = {
      webClientId: RandomProperties.getString(),
    };

    ExpoGoogleAuthentication.configure(configureOptions);

    if (passes) {
      expect(ExpoGoogleAuthenticationModule.configure).toHaveBeenCalledWith(
        configureOptions
      );
    } else {
      expect(ExpoGoogleAuthenticationModule.configure).not.toHaveBeenCalled();
    }
  }
);

it("Google login not supported for web.", async () => {
  Platform.OS = "web";

  const unsupportedError = new CodedError(
    ExpoGoogleAuthentication.UNSUPPORTED_PLATFORM,
    "Unsupported platform"
  );

  await expect(ExpoGoogleAuthentication.login()).rejects.toThrowError(
    unsupportedError
  );

  await expect(
    ExpoGoogleAuthentication.loginWithoutUserIntent()
  ).rejects.toThrowError(unsupportedError);
});

it("iOS calls native signIn method.", async () => {
  Platform.OS = "ios";

  const _response = await ExpoGoogleAuthentication.login();
  expect(ExpoGoogleAuthenticationModule.signIn).toHaveBeenCalled();

  const _response2 = await ExpoGoogleAuthentication.loginWithoutUserIntent();
  expect(ExpoGoogleAuthenticationModule.signIn).toHaveBeenCalled();
});

it("Android calls respective native methods for different sign-in methods.", async () => {
  Platform.OS = "android";

  const _response = await ExpoGoogleAuthentication.login();
  expect(ExpoGoogleAuthenticationModule.loginFromUserAction).toHaveBeenCalled();

  const _response2 = await ExpoGoogleAuthentication.loginWithoutUserIntent();
  expect(
    ExpoGoogleAuthenticationModule.loginWithoutUserAction
  ).toHaveBeenCalled();
});

it.each([["ios"], ["android"], ["web"]])(
  "logout calls native logout method.",
  (platform) => {
    Platform.OS = platform;

    ExpoGoogleAuthentication.logout();
    expect(ExpoGoogleAuthenticationModule.logout).toHaveBeenCalled();
  }
);

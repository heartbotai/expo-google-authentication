// Import the native module. On web, it will be resolved to ExpoGoogleAuthentication.web.ts
// and on native platforms to ExpoGoogleAuthentication.ts
import { Platform } from "react-native";

import {
  ExpoGoogleAuthenticationConfigureProps,
  ExpoGoogleAuthenticationLoginResponse,
} from "./ExpoGoogleAuthentication.types";
import { ExpoGoogleAuthenticationStatusCodes } from "./ExpoGoogleAuthenticationConstants";
import ExpoGoogleAuthenticationModule from "./ExpoGoogleAuthenticationModule";

export function configure(props: ExpoGoogleAuthenticationConfigureProps): void {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    // Configure is only necessary for Android.
    ExpoGoogleAuthenticationModule.configure(props);
  }
}

export function login(): Promise<ExpoGoogleAuthenticationLoginResponse> {
  if (Platform.OS === "ios") {
    return ExpoGoogleAuthenticationModule.signIn();
  } else if (Platform.OS === "android") {
    return ExpoGoogleAuthenticationModule.loginFromUserAction();
  }

  return Promise.reject(
    new CodedError(
      ExpoGoogleAuthenticationStatusCodes.UNSUPPORTED_PLATFORM,
      "Unsupported platform"
    )
  );
}

export function loginWithoutUserIntent(): Promise<ExpoGoogleAuthenticationLoginResponse> {
  if (Platform.OS === "ios") {
    return ExpoGoogleAuthenticationModule.signIn();
  } else if (Platform.OS === "android") {
    return ExpoGoogleAuthenticationModule.loginWithoutUserAction();
  }

  return Promise.reject(
    new CodedError(
      ExpoGoogleAuthenticationStatusCodes.UNSUPPORTED_PLATFORM,
      "Unsupported platform"
    )
  );
}

export function logout(): Promise<any> {
  return ExpoGoogleAuthenticationModule.logout();
}

// Export for testing
export class CodedError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export {
  ExpoGoogleAuthenticationConfigureProps,
  ExpoGoogleAuthenticationStatusCodes,
  ExpoGoogleAuthenticationLoginResponse,
};

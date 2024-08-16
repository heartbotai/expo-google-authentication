export type ExpoGoogleAuthenticationConfigureProps = {
  webClientId: string; // Web client ID from Google Cloud Console.
  profileImageSize?: number; // Size of the profile image in pixels to request from Google.

  // URL-safe, base64 encoded and non-wrapping string with a minimum of 16 characters and
  // a maximum of 500 characters: https://developer.android.com/google/play/integrity/classic#nonce
  // Usage in iOS is pending this pull request: https://github.com/google/GoogleSignIn-iOS/pull/402.
  nonce?: string;
};

export type ExpoGoogleAuthenticationLoginResponse = {
  displayName?: string; // Full name of the user.
  familyName?: string; // Last name of the user.
  givenName?: string; // First name of the user.
  email?: string; // Email. Only available on iOS.
  id?: string; // UserID. Email on Android, ID on iOS.
  idToken: string; // ID token from Google to verify on your server.
  phoneNumber?: string; // Phone number. May not be available.
  profilePictureUri?: string; // URL for the user's profile picture.
};

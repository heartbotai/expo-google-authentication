import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import * as ExpoGoogleAuthentication from "expo-google-authentication";
import {
  ExpoGoogleAuthenticationStatusCodes,
  ExpoGoogleAuthenticationConfigureProps,
} from "expo-google-authentication";

export default function App() {
  const [loginData, setLoginData] = useState({});

  try {
    const configureProps: ExpoGoogleAuthenticationConfigureProps = {
      webClientId:
        "456042836902-s9v13pv9ehkplbclb9ntv8jnp4bpv5ll.apps.googleusercontent.com",
    };
    ExpoGoogleAuthentication.configure(configureProps);
  } catch (error) {
    console.error(error);
  }

  const login = async () => {
    try {
      const loginDataResponse = await ExpoGoogleAuthentication.login();
      setLoginData(loginDataResponse);
    } catch (err) {
      switch (err.code) {
        case ExpoGoogleAuthenticationStatusCodes.LOGIN_CANCELED:
          console.log("Login canceled");
          break;
        case ExpoGoogleAuthenticationStatusCodes.NO_CREDENTIALS:
          console.error("Unknown credentials problem.");
          break;
        case ExpoGoogleAuthenticationStatusCodes.NO_PLAY_SERVICES:
          console.error("Device does not have play services.");
          break;
        case ExpoGoogleAuthenticationStatusCodes.BAD_INPUT:
          console.error(
            "Passed bad input into configure or did not call configure."
          );
          break;
        case ExpoGoogleAuthenticationStatusCodes.INVALID_CREDENTIALS:
          console.error(
            "Issue with credentials. Most often due to invalid sha-1 hash associated with Android credentials."
          );
          break;
        case ExpoGoogleAuthenticationStatusCodes.UNKNOWN_ERROR:
          console.error("Unknown error occurred.");
          break;
        default:
          console.error(
            `Unknown error occurred: ${err.message}, code: ${err.code}`
          );
      }
    }
  };

  const logout = async () => {
    try {
      await ExpoGoogleAuthentication.logout();
      setLoginData({});
    } catch (err) {
      if (err.code === ExpoGoogleAuthenticationStatusCodes.LOGOUT_FAILED) {
        console.error("Logout failed.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(loginData)}</Text>
      <Button onPress={login} title="Login with Google" />
      <Button onPress={logout} title="Logout" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

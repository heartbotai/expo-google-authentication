// Documentation for config plugin build: https://www.npmjs.com/package/expo-module-scripts.
// Documentation for config plugins: https://docs.expo.dev/config-plugins/introduction/.
import { appendScheme } from '@expo/config-plugins/build/ios/Scheme';
import type { ExpoConfig } from 'expo/config';

const pkg = require('../../package.json');

import {
  ConfigPlugin,
  AndroidConfig,
  IOSConfig,
  createRunOncePlugin,
  withPlugins,
  withInfoPlist,
} from 'expo/config-plugins';

type Options = {
  iosUrlScheme: string;
};

const withGooglePlugin: ConfigPlugin<Options> = (
  config: ExpoConfig, 
  options: Options,
) => {
  return withInfoPlist(config, (config) => {
    config.modResults = appendScheme(options.iosUrlScheme, config.modResults);
    return config;
  }); 
};

export default createRunOncePlugin<Options>(
  withGooglePlugin,
  pkg.name,
  pkg.version,
);

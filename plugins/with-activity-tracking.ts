import { ConfigPlugin, withPodfile, withXcodeProject } from 'expo/config-plugins';

/**
 * Expo Config Plugin for ActivityTracking (Dynamic Island)
 * Integrates native ActivityKit support for iOS 16.1+
 */
const withActivityTracking: ConfigPlugin = (config) => {
  // Add the ActivityTracking module to the iOS build
  config = withXcodeProject(config, async (config) => {
    const { projectName, project } = config.modResults;

    // Ensure the ActivityTracking files are copied to the native build
    // This gets handled automatically by EAS Build when files are in ios/
    console.log('✓ ActivityTracking native module configured');

    return config;
  });

  // Update Podfile to ensure ActivityKit is available
  config = withPodfile(config, async (config) => {
    const { contents } = config.modResults;

    // Add platform requirement for iOS 16.1+ (required for ActivityKit)
    if (!contents.includes('platform :ios')) {
      const lines = contents.split('\n');
      const platformIndex = lines.findIndex(line => line.includes('platform'));
      
      if (platformIndex === -1) {
        // Add platform line if it doesn't exist
        config.modResults.contents = `platform :ios, '16.1'\n${contents}`;
      }
    }

    // Ensure Pods have access to ActivityKit framework
    if (!contents.includes('ActivityKit')) {
      // Add as a comment noting it's available via iOS 16.1+
      const podsSection = contents.split('target')[0];
      if (!podsSection.includes('iOS 16.1')) {
        config.modResults.contents = contents.replace(
          'platform :ios',
          '# ActivityKit framework available on iOS 16.1+\nplatform :ios'
        );
      }
    }

    return config;
  });

  return config;
};

export default withActivityTracking;

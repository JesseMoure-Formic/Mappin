const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// On web, stub out react-native-maps with a no-op module
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: require.resolve("./src/stubs/maps.web.js") };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

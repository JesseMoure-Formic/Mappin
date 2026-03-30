// Web stub for react-native-maps
// The full map experience is available on iOS and Android.
const React = require("react");
const { View, Text, StyleSheet } = require("react-native");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  text: { color: "#888", fontSize: 14 },
});

function Placeholder() {
  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(Text, { style: styles.text }, "Map available on iOS & Android")
  );
}

module.exports = {
  __esModule: true,
  default: Placeholder,
  MapView: Placeholder,
  Marker: () => null,
  Polygon: () => null,
  Polyline: () => null,
  Circle: () => null,
  PROVIDER_DEFAULT: null,
  PROVIDER_GOOGLE: null,
};

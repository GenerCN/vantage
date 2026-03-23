import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText
        type="title"
        style={{
          fontFamily: Fonts.rounded,
        }}
      >
        Profile
      </ThemedText>
      <ThemedText>
        This is your profile tab. Customize it with your user info and settings.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
});

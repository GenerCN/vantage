import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/StyleHome";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/")}>
              <Text style={styles.headerButton}>HOME</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.title}>Bienvenido a VINTAGE</Text>
      <Text>Tu Sistema de Inventario</Text>
      <Text>Lograste entrar con una cuenta random 🎉</Text>
    </View>
  );
}

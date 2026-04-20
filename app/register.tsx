import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";

// Importamos los estilos desde la carpeta independiente
import { styles } from "../styles/StyleRegister";

export default function RegisterScreen() {
  const router = useRouter();

  // Memoria para cada campo del formulario
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [password, setPassword] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");

  const manejarRegistro = () => {
    // Generar el nombre de usuario
    const parteApellido = firstLastName.substring(0, 3).toLowerCase();
    const parteNombre = firstName.substring(0, 3).toLowerCase();
    const usuarioGenerado = `${parteApellido}${parteNombre}`;

    // Juntar el nombre completo (quitando espacios extra si los segundos nombres están vacíos)
    const nombreCompleto =
      `${firstName} ${middleName} ${firstLastName} ${secondLastName}`
        .replace(/\s+/g, " ")
        .trim();

    // Navegar a la pantalla de éxito y enviarle los datos
    router.replace({
      pathname: "/register-success",
      params: {
        fullName: nombreCompleto,
        username: usuarioGenerado,
        password: password,
      },
    });
  };

  return (
    // Usamos ScrollView para que la pantalla se pueda deslizar si el teclado la tapa
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Crear una Cuenta</Text>

      <Text style={styles.label}>Primer Nombre *</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder=""
      />

      <Text style={styles.label}>Segundo Nombre (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={middleName}
        onChangeText={setMiddleName}
        placeholder=""
      />

      <Text style={styles.label}>Primer Apellido *</Text>
      <TextInput
        style={styles.input}
        value={firstLastName}
        onChangeText={setFirstLastName}
        placeholder=""
      />

      <Text style={styles.label}>Segundo Apellido (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={secondLastName}
        onChangeText={setSecondLastName}
        placeholder=""
      />

      <Text style={styles.label}>Contraseña *</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Tu contraseña secreta"
        secureTextEntry
      />

      <Text style={styles.label}>Número de Empleado *</Text>
      <TextInput
        style={styles.input}
        value={employeeNumber}
        onChangeText={setEmployeeNumber}
        placeholder="Ejem: 0000"
        keyboardType="numeric" // Abre el teclado numérico directamente
      />

      <TouchableOpacity style={styles.button} onPress={manejarRegistro}>
        <Text style={styles.buttonText}>Registrar y Generar Usuario</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.backButtonText}>Volver al Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

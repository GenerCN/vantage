import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importamos los estilos desde la carpeta independiente
import { authService } from "../services/authService";
import { perfilService } from "../services/perfilService";
import type { Rol } from "../services/rolesService";
import { styles } from "../styles/StyleRegister";
import { translateAuthError } from "../lib/errorHelper";

export default function RegisterScreen({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? "#151718" : "#ffffff";
  const titleColor = isDark ? "#ECEDEE" : "#333333";
  const labelColor = isDark ? "#ECEDEE" : "#555555";
  const inputBg = isDark ? "#1E2022" : "#f9f9f9";
  const inputBorderColor = isDark ? "#3E4145" : "#ccc";
  const inputTextColor = isDark ? "#ECEDEE" : "#333333";
  const placeholderColor = isDark ? "#7E848C" : "#999999";
  const arrowColor = isDark ? "#007AFF" : "#007AFF";

  // Modal selector styles
  const modalOverlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)';
  const modalSheetBg = isDark ? '#1E2022' : '#ffffff';
  const modalBorderColor = isDark ? '#2E3033' : '#ccc';
  const modalHeaderColor = isDark ? '#ECEDEE' : '#333333';

  // Campos del formulario
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("1");
  const [roles, setRoles] = useState<Rol[]>([
    { id: 1, nombre: "Administrador TI", descripcion: "Control total del sistema y sensores" },
    { id: 2, nombre: "Desarrollador", descripcion: "Acceso a depuración y logs de sistema" },
    { id: 3, nombre: "Tester", descripcion: "Encargado de pruebas de calidad y estrés" },
    { id: 4, nombre: "Empleado", descripcion: "Solo apertura de estantes autorizados" },
  ]);

  // Cargar roles al iniciar
  useEffect(() => {
    setLoadingRoles(false);
  }, []);

  const manejarRegistro = async () => {
    // Validaciones específicas
    if (!username) {
      Alert.alert("Error", "El campo 'Nombre de Usuario' es obligatorio (*)");
      return;
    }

    if (!firstName) {
      Alert.alert("Error", "El campo 'Primer Nombre' es obligatorio (*)");
      return;
    }

    if (!firstLastName) {
      Alert.alert("Error", "El campo 'Primer Apellido' es obligatorio (*)");
      return;
    }

    if (!secondLastName) {
      Alert.alert("Error", "El campo 'Segundo Apellido' es obligatorio (*)");
      return;
    }

    if (!password) {
      Alert.alert("Error", "El campo 'Contraseña' es obligatorio (*)");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const nombreCompleto = `${firstName} ${middleName} ${firstLastName} ${secondLastName}`.replace(/\s+/g, ' ').trim();

      // 1. Registrar en Supabase Auth pasando el rol seleccionado
      const { data, error } = await authService.signUp(
        username,
        password,
        nombreCompleto,
        parseInt(selectedRoleId)
      );

      if (error) throw error;

      if (data.user) {
        // Guardar de inmediato en la tabla 'perfiles'
        try {
          await perfilService.upsertPerfil({
            id: data.user.id,
            nombre_completo: nombreCompleto,
            role_id: parseInt(selectedRoleId),
          });
        } catch (perfilError) {
          console.error("Error creando perfil en registro:", perfilError);
        }

        // 2. Éxito - Navegar a la pantalla de éxito
        const selectedRole = roles.find(r => r.id.toString() === selectedRoleId);
        router.replace({
          pathname: "/register-success",
          params: {
            fullName: nombreCompleto,
            username: username,
            role: selectedRole?.nombre || "Empleado",
          },
        });
      }
    } catch (error: any) {
      const translatedMsg = translateAuthError(error);
      Alert.alert("Error en el registro", translatedMsg);
      console.warn("[Vantage Register Error Captured]:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoles) {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: containerBg }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.title, { color: titleColor }]}>Cargando...</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === "android"
    ? (StatusBar.currentHeight || 24) + 16
    : Math.max(insets.top, 44);

  return (
    <View style={{ flex: 1, backgroundColor: containerBg, paddingTop: topPadding }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={containerBg} />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: containerBg, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Botón de Regreso dentro del ScrollView */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => {
              if (onBack) {
                onBack();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color={arrowColor} />
            <Text style={{ fontSize: 16, color: arrowColor, marginLeft: 8 }}>Regresar</Text>
          </TouchableOpacity>
        </View>

        {/* Vantage Logo Premium Header (Register Page) */}
        <View style={{
          alignSelf: 'center',
          padding: 8,
          borderRadius: 24,
          marginBottom: 20,
          marginTop: 10,
        }}>
          <Image
            source={require("../assets/images/vantage.png")}
            style={{
              width: 90,
              height: 90,
              borderRadius: 16,
            }}
            contentFit="contain"
          />
        </View>

        <Text style={[styles.title, { color: titleColor }]}>Crear una Cuenta</Text>

        <Text style={[styles.label, { color: labelColor }]}>Nombre de Usuario *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={username}
          onChangeText={setUsername}
          placeholder="Ej. juan.perez"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Primer Nombre *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ej. Juan"
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Segundo Nombre</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={middleName}
          onChangeText={setMiddleName}
          placeholder="Ej. Carlos (opcional)"
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Primer Apellido *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={firstLastName}
          onChangeText={setFirstLastName}
          placeholder="Ej. Pérez"
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Segundo Apellido *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={secondLastName}
          onChangeText={setSecondLastName}
          placeholder="Ej. García"
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Contraseña *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor, color: inputTextColor }]}
          placeholderTextColor={placeholderColor}
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          editable={!loading}
        />

        <Text style={[styles.label, { color: labelColor }]}>Puesto *</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorderColor }]}
          onPress={() => setShowRoleModal(true)}
          disabled={loading}
        >
          <Text style={{ fontSize: 16, color: roles.find(r => r.id.toString() === selectedRoleId)?.nombre ? inputTextColor : placeholderColor }}>
            {roles.find(r => r.id.toString() === selectedRoleId)?.nombre || "Selecciona un puesto"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showRoleModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: modalOverlayBg }}>
            <View style={{ backgroundColor: modalSheetBg, maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: modalBorderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalHeaderColor }}>Selecciona tu puesto</Text>
                <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                  <Text style={{ fontSize: 28, color: '#007AFF' }}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 16 }}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={{
                      padding: 12,
                      marginVertical: 8,
                      backgroundColor: selectedRoleId === role.id.toString() ? '#007AFF' : (isDark ? '#2E3033' : '#f0f0f0'),
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setSelectedRoleId(role.id.toString());
                      setShowRoleModal(false);
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: selectedRoleId === role.id.toString() ? '#fff' : (isDark ? '#ECEDEE' : '#333'),
                      fontWeight: selectedRoleId === role.id.toString() ? 'bold' : 'normal',
                    }}>
                      {role.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={manejarRegistro}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

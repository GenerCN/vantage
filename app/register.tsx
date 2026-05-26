import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

// Importamos los estilos desde la carpeta independiente
import { authService } from "../services/authService";
import type { Rol } from "../services/rolesService";
import { styles } from "../styles/StyleRegister";

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

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
      
      // 1. Registrar en Supabase Auth
      const { data, error } = await authService.signUp(username, password, nombreCompleto);

      if (error) throw error;

      if (data.user) {
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
      Alert.alert("Error en el registro", error.message || "No se pudo crear la cuenta.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoles) {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.title}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Botón de Regreso dentro del ScrollView */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={{ fontSize: 16, color: '#007AFF', marginLeft: 8 }}>Regresar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Crear una Cuenta</Text>

        <Text style={styles.label}>Nombre de Usuario *</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Ej. juan.perez"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Primer Nombre *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ej. Juan"
          editable={!loading}
        />

        <Text style={styles.label}>Segundo Nombre</Text>
        <TextInput
          style={styles.input}
          value={middleName}
          onChangeText={setMiddleName}
          placeholder="Ej. Carlos (opcional)"
          editable={!loading}
        />

        <Text style={styles.label}>Primer Apellido *</Text>
        <TextInput
          style={styles.input}
          value={firstLastName}
          onChangeText={setFirstLastName}
          placeholder="Ej. Pérez"
          editable={!loading}
        />

        <Text style={styles.label}>Segundo Apellido *</Text>
        <TextInput
          style={styles.input}
          value={secondLastName}
          onChangeText={setSecondLastName}
          placeholder="Ej. García"
          editable={!loading}
        />

        <Text style={styles.label}>Contraseña *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.label}>Puesto *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowRoleModal(true)}
          disabled={loading}
        >
          <Text style={{ fontSize: 16, color: roles.find(r => r.id.toString() === selectedRoleId)?.nombre ? "#333" : "#999" }}>
            {roles.find(r => r.id.toString() === selectedRoleId)?.nombre || "Selecciona un puesto"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showRoleModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Selecciona tu puesto</Text>
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
                      backgroundColor: selectedRoleId === role.id.toString() ? '#007AFF' : '#f0f0f0',
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setSelectedRoleId(role.id.toString());
                      setShowRoleModal(false);
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: selectedRoleId === role.id.toString() ? '#fff' : '#333',
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

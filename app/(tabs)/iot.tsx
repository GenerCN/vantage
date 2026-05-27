import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlobalStyles, Shadows, T } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { estantesService } from "@/services/estantesService";
import { getProductos, type Producto } from "@/services/productosService";

// Tipos locales
interface EstanteDetalle {
  estante_id: string;
  mac_address: string;
  ubicacion_fisica: string | null;
  esta_abierto: number;
  alerta_activa: number;
  ultima_conexion: string;
  inventario_id: string | null;
  producto_id: string | null;
  peso_total_gramos: number | null;
  cantidad_calculada: number | null;
  producto_nombre: string | null;
  producto_peso_individual: number | null;
  producto_stock_actual: number | null;
  ultimo_rfid_escaneado?: string | null;
}

interface PerfilRFID {
  id: string;
  nombre_completo: string;
  rfid_tag: string | null;
  role_id: number;
  roles?: { nombre: string } | null;
  username?: string | null;
}

export default function IotDashboardScreen() {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  // Estados de carga y datos
  const [shelves, setShelves] = useState<EstanteDetalle[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [profiles, setProfiles] = useState<PerfilRFID[]>([]);
  const [currentUser, setCurrentUser] = useState<PerfilRFID | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [linkProductModalVisible, setLinkProductModalVisible] = useState(false);
  const [rfidModalVisible, setRfidModalVisible] = useState(false);

  // Formularios
  const [macInput, setMacInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PerfilRFID | null>(null);
  const [rfidTagInput, setRfidTagInput] = useState("");

  // Flujo automático de vinculación RFID (máquina de estados)
  type RfidLinkPhase = 'waiting' | 'linking' | 'success' | 'timeout' | 'error';
  const [rfidLinkPhase, setRfidLinkPhase] = useState<RfidLinkPhase>('waiting');
  const [rfidCountdown, setRfidCountdown] = useState(10);

  // Ref para acceder al estado del modal RFID desde callbacks de Supabase (evita clausuras obsoletas)
  const rfidModalVisibleRef = useRef(false);
  const selectedProfileRef = useRef<PerfilRFID | null>(null);

  const isAdmin =
    currentUser?.roles?.nombre === "Administrador TI" ||
    currentUser?.roles?.nombre === "Administrador" ||
    currentUser?.role_id === 1;
  const currentUserRoleId = currentUser?.role_id || 4;

  const displayedProfiles = useMemo(() => {
    if (isAdmin) return profiles;
    return profiles.filter(p => p.role_id === currentUserRoleId || p.id === currentUser?.id);
  }, [profiles, currentUser, isAdmin, currentUserRoleId]);

  const groupedProfiles = useMemo(() => {
    if (!isAdmin) return null;
    const groups: Record<string, PerfilRFID[]> = {
      "Administrador TI": [],
      "Desarrollador": [],
      "Tester": [],
      "Empleado": []
    };

    profiles.forEach(p => {
      const roleName = p.roles?.nombre || "Empleado";
      let mappedRole = roleName;
      if (roleName === "Administrador") {
        mappedRole = "Administrador TI";
      } else if (roleName === "Supervisor") {
        mappedRole = "Desarrollador";
      } else if (roleName === "Operador") {
        mappedRole = "Tester";
      }

      if (!groups[mappedRole]) {
        groups[mappedRole] = [];
      }
      groups[mappedRole].push(p);
    });

    return groups;
  }, [profiles, isAdmin]);

  // Filtrar estantes únicos para prevenir advertencias de React por key duplicada
  const uniqueShelves = useMemo(() => {
    const seen = new Set();
    return shelves.filter((s) => {
      if (!s.estante_id) return true;
      const key = s.mac_address;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [shelves]);

  // Cargar datos principales
  async function loadAllData() {
    try {
      // 1. Descargar datos frescos de la nube si hay red
      await estantesService.downloadEstantesFromSupabase();

      // 2. Cargar estantes e inventarios de SQLite
      const dataShelves = await estantesService.getEstantes();
      setShelves(dataShelves);

      // 3. Cargar productos catálogo de SQLite
      const dataProducts = await getProductos();
      setProducts(dataProducts);

      // 4. Cargar perfiles y usuario logueado de Supabase para RFID
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentProfile } = await supabase
            .from("perfiles")
            .select("*, roles(nombre)")
            .eq("id", user.id)
            .single();
          if (currentProfile) {
            setCurrentUser(currentProfile);
          }
        }

        const { data: dataProfiles } = await supabase
          .from("perfiles")
          .select("*, roles(nombre)");
        if (dataProfiles) {
          setProfiles(dataProfiles);
        }
      }
    } catch (error) {
      console.log("Error cargando datos IoT:", error);
    } finally {
      setLoading(false);
    }
  }

  // Suscribirse a cambios en tiempo real en Supabase (WebSockets)
  useEffect(() => {
    loadAllData();

    if (!supabase) return;

    // Escuchar telemetría en inventario_actual
    const channelInv = supabase
      .channel("realtime-iot-inventory")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventario_actual" }, async () => {
        console.log("📡 Telemetría recibida de báscula en tiempo real");
        await estantesService.downloadEstantesFromSupabase();
        const dataShelves = await estantesService.getEstantes();
        setShelves(dataShelves);
      })
      .subscribe();

    // Escuchar cambios en estantes (incluye auto-detección de RFID escaneado)
    const channelShelves = supabase
      .channel("realtime-iot-shelves")
      .on("postgres_changes", { event: "*", schema: "public", table: "estantes" }, async (payload: any) => {
        // Auto-vinculación RFID: si el modal está abierto y llega un escaneo físico
        if (rfidModalVisibleRef.current && payload?.new?.ultimo_rfid_escaneado) {
          const scanned = payload.new.ultimo_rfid_escaneado as string;
          console.log("💳 RFID auto-detectado desde estante:", scanned);
          setRfidTagInput(scanned);
          setRfidLinkPhase('linking');

          // Ejecución directa de vinculación con la referencia fresca del perfil
          const profile = selectedProfileRef.current;
          if (profile) {
            autoAssignRfidDirect(scanned, profile);
          } else {
            console.warn("⚠️ No hay perfil seleccionado para vincular RFID.");
            setRfidLinkPhase('error');
          }
        }
        await estantesService.downloadEstantesFromSupabase();
        const dataShelves = await estantesService.getEstantes();
        setShelves(dataShelves);
      })
      .subscribe();

    // Escuchar cambios en perfiles RFID
    const channelProfiles = supabase
      .channel("realtime-iot-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "perfiles" }, async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentProfile } = await supabase
            .from("perfiles")
            .select("*, roles(nombre)")
            .eq("id", user.id)
            .single();
          if (currentProfile) {
            setCurrentUser(currentProfile);
          }
        }

        const { data: dataProfiles } = await supabase
          .from("perfiles")
          .select("*, roles(nombre)");
        if (dataProfiles) {
          setProfiles(dataProfiles);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelInv);
      supabase.removeChannel(channelShelves);
      supabase.removeChannel(channelProfiles);
    };
  }, []);

  // Recargar datos cuando la pantalla esté enfocada
  useEffect(() => {
    if (isFocused) {
      loadAllData();
    }
  }, [isFocused]);

  // Sincronizar refs del modal RFID y perfil seleccionado para callbacks de Supabase Realtime
  useEffect(() => {
    rfidModalVisibleRef.current = rfidModalVisible;
  }, [rfidModalVisible]);

  useEffect(() => {
    selectedProfileRef.current = selectedProfile;
  }, [selectedProfile]);

  // Cuenta regresiva de 10 segundos mientras espera el escaneo físico
  useEffect(() => {
    if (!rfidModalVisible || rfidLinkPhase !== 'waiting') return;

    if (rfidCountdown <= 0) {
      setRfidLinkPhase('timeout');
      return;
    }

    const timer = setTimeout(() => {
      setRfidCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rfidModalVisible, rfidLinkPhase, rfidCountdown]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Guardar nuevo estante
  async function handleRegisterShelf() {
    if (!macInput.trim() || !locationInput.trim()) {
      Alert.alert("Campos requeridos", "Por favor ingresa la dirección MAC y la ubicación.");
      return;
    }

    // Validar dirección MAC básica
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    const formattedMac = macInput.replace(/[-]/g, ":").toUpperCase().trim();

    if (macInput.length >= 12 && !macRegex.test(formattedMac)) {
      // Intento de corrección para strings pegados de 12 caracteres (AABBCCDDEEFF)
      const clean = macInput.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
      if (clean.length === 12) {
        const parsedMac = clean.match(/.{1,2}/g)?.join(":") || "";
        setMacInput(parsedMac);
      } else {
        Alert.alert("Formato Inválido", "La dirección MAC debe tener un formato válido (Ej: AA:BB:CC:DD:EE:FF).");
        return;
      }
    }

    try {
      setLoading(true);
      await estantesService.registerEstante(formattedMac, locationInput);
      setMacInput("");
      setLocationInput("");
      setRegisterModalVisible(false);
      await loadAllData();
      Alert.alert("Éxito", "Estante inteligente registrado y listo para conectarse.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo registrar el estante.");
    } finally {
      setLoading(false);
    }
  }



  // Vincular producto
  async function handleLinkProduct(productoId: string) {
    if (!selectedShelfId) return;

    try {
      setLoading(true);
      const success = await estantesService.linkProductToShelf(selectedShelfId, productoId);
      setLinkProductModalVisible(false);
      setSelectedShelfId(null);
      await loadAllData();
      if (success) {
        Alert.alert("Estante Vinculado", "La calibración fue transmitida al ESP32.");
      } else {
        Alert.alert("Error", "No se pudo vincular el producto.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Desvincular producto
  async function handleUnlinkProduct(estanteId: string, productoId: string) {
    Alert.alert(
      "Desvincular Producto",
      "¿Seguro que deseas vaciar este estante? La báscula física se desactivará hasta que le asocies otro producto.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await estantesService.unlinkProductFromShelf(estanteId, productoId);
              await loadAllData();
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  // Eliminar estante
  async function handleDeleteShelf(id: string, mac: string) {
    Alert.alert(
      "Eliminar Estante",
      `¿Seguro que deseas eliminar el estante ${mac}? Se borrarán también sus datos de inventario.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await estantesService.deleteEstante(id);
              await loadAllData();
              Alert.alert("Eliminado", "Estante removido del sistema.");
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  // Cerrar modal RFID y resetear estados
  function closeRfidModal() {
    setRfidModalVisible(false);
    setRfidTagInput("");
    setSelectedProfile(null);
    setRfidLinkPhase('waiting');
    setRfidCountdown(10);
  }

  // Asignar tag RFID a empleado automáticamente (sin intervención manual)
  async function autoAssignRfidDirect(scannedRfid: string, profile: PerfilRFID) {
    if (!profile || !scannedRfid.trim()) return;

    const formattedRfid = scannedRfid.toUpperCase().trim();
    console.log(`💾 Intentando vincular RFID [${formattedRfid}] al usuario: ${profile.nombre_completo}`);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("perfiles")
          .update({ rfid_tag: formattedRfid })
          .eq("id", profile.id)
          .select();

        if (error) {
          console.log("❌ Error vinculando RFID en Supabase:", error);
          setRfidLinkPhase('error');
          return;
        }

        if (!data || data.length === 0) {
          console.log("❌ Error RLS: No se pudo actualizar el perfil. Comprueba las políticas RLS en Supabase.");
          setRfidLinkPhase('error');
          return;
        }

        console.log(`✅ RFID [${formattedRfid}] vinculado con éxito para ${profile.nombre_completo}`);
        setRfidLinkPhase('success');
        await loadAllData();

        // Auto-cerrar modal tras 2 segundos de mostrar éxito
        setTimeout(() => {
          closeRfidModal();
        }, 2000);
      }
    } catch (error) {
      console.log("❌ Excepción al vincular RFID:", error);
      setRfidLinkPhase('error');
    }
  }

  // Desvincular RFID de empleado
  async function handleRemoveRfid(profileId: string, nombre: string) {
    Alert.alert(
      "Quitar Tarjeta",
      `¿Deseas desvincular la tarjeta de ${nombre}? Perderá acceso físico a los estantes inmediatamente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              if (supabase) {
                const { data, error } = await supabase
                  .from("perfiles")
                  .update({ rfid_tag: null })
                  .eq("id", profileId)
                  .select();

                if (error) {
                  Alert.alert("Error", "No se pudo desvincular la tarjeta: " + error.message);
                  return;
                }

                if (!data || data.length === 0) {
                  Alert.alert("Error de Permisos", "No tienes permisos para modificar este perfil (comprueba las políticas RLS en Supabase).");
                  return;
                }

                await loadAllData();
              }
            } catch (error) {
              console.log(error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  // Colores dinámicos del tema
  const headingColor = isDark ? "#FFF" : T.text;
  const descriptionColor = isDark ? "#9BA1A6" : T.textSecondary;
  const cardBg = isDark ? "#1E2022" : T.surface;
  const separatorColor = isDark ? "#2E3033" : T.separator;
  const inputBg = isDark ? "#2E3033" : T.surfaceAlt;
  const inputTextColor = isDark ? "#ECEDEE" : T.text;

  return (
    <SafeAreaView
      style={[
        GlobalStyles.screen,
        {
          backgroundColor: isDark ? "#151718" : T.bg,
          paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 0,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingTop: Platform.OS === "ios" ? 30 : T.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: headingColor }]}>Dispositivos IoT</Text>
            <Text style={[styles.subtitle, { color: descriptionColor }]}>
              Monitoreo de básculas de peso y control RFID en tiempo real.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: T.primary }]}
            onPress={() => setRegisterModalVisible(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={14} color="#FFF" />
            <Text style={[styles.addButtonText, { marginLeft: 4 }]}>Estante</Text>
          </TouchableOpacity>
        </View>

            {/* Dashboard de Estantes */}
        {loading && shelves.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={T.primary} />
          </View>
        ) : uniqueShelves.length === 0 ? (
          <EmptyState
            message="No hay estantes inteligentes registrados"
            hint="Presiona '+ Estante' arriba para dar de alta una celda de carga por dirección MAC."
          />
        ) : (
          uniqueShelves.map((item) => {
            const hasProduct = !!item.producto_id;
            const stockActual = item.cantidad_calculada ?? 0;
            const stockMinimo = item.producto_stock_actual ?? 0; // en nuestra app stock_minimo es el stock actual

            // Calcular color de semáforo
            let statusColor = T.textMuted;
            let statusBg = isDark ? "#2E3033" : T.surfaceAlt;
            let statusLabel = "Sin configurar";

            if (hasProduct) {
              if (stockActual > 5) {
                statusColor = T.success;
                statusBg = isDark ? "#14331C" : T.successBg;
                statusLabel = "Stock OK";
              } else if (stockActual > 0) {
                statusColor = T.warning;
                statusBg = isDark ? "#3E2A00" : T.warningBg;
                statusLabel = "Stock Bajo";
              } else {
                statusColor = T.danger;
                statusBg = isDark ? "#3E1616" : T.dangerBg;
                statusLabel = "Crítico / Vacío";
              }
            }

            return (
              <View
                key={item.estante_id}
                style={[
                  styles.shelfCard,
                  {
                    backgroundColor: cardBg,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: separatorColor,
                  },
                  Shadows.md,
                ]}
              >
                {/* Cabecera Tarjeta */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <IconSymbol name="wifi" size={16} color={headingColor} />
                      <Text style={[styles.macText, { color: headingColor, marginBottom: 0 }]}>
                        MAC: {item.mac_address}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="mappin.and.ellipse" size={14} color={descriptionColor} />
                      <Text style={[styles.locationText, { color: descriptionColor, marginTop: 0 }]}>
                        {item.ubicacion_fisica || "Sin ubicación física"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: separatorColor }]} />

                {/* Cuerpo Telemetría */}
                <View style={styles.telemetryRow}>
                  {/* Báscula */}
                  <View style={styles.telemetryBox}>
                    <IconSymbol name="scale.3d" size={24} color={T.primary} style={{ marginRight: 8 }} />
                    <View>
                      <Text style={[styles.telemetryLabel, { color: descriptionColor }]}>Peso</Text>
                      <Text style={[styles.telemetryValue, { color: headingColor }]}>
                        {hasProduct ? `${(item.peso_total_gramos ?? 0).toFixed(1)} g` : "---"}
                      </Text>
                    </View>
                  </View>

                  {/* Piezas */}
                  <View style={styles.telemetryBox}>
                    <IconSymbol name="cube.box.fill" size={24} color={T.primary} style={{ marginRight: 8 }} />
                    <View>
                      <Text style={[styles.telemetryLabel, { color: descriptionColor }]}>Piezas Físicas</Text>
                      <Text style={[styles.telemetryValue, { color: headingColor }]}>
                        {hasProduct ? `${item.cantidad_calculada ?? 0} uds` : "Sin vincular"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Info de Producto Vinculado */}
                {hasProduct ? (
                  <View style={[styles.productDetailsBox, { backgroundColor: isDark ? "#2E3033" : T.surfaceAlt }]}>
                    <Text style={[styles.productName, { color: headingColor }]}>
                      {item.producto_nombre}
                    </Text>
                    <Text style={[styles.productMeta, { color: descriptionColor }]}>
                      Peso unitario: {item.producto_peso_individual}g | Stock actual: {item.producto_stock_actual}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.productDetailsBox, { backgroundColor: isDark ? "#2A1818" : "#FEE2E2", borderStyle: "dashed", borderWidth: 1, borderColor: T.danger }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <IconSymbol name="exclamationmark.triangle" size={16} color={T.danger} />
                      <Text style={[styles.productName, { color: T.danger, fontWeight: T.weightSemi, marginTop: 0 }]}>
                        Requiere Vincular Producto
                      </Text>
                    </View>
                    <Text style={[styles.productMeta, { color: T.danger }]}>
                      Asigna un producto para enviar la tara y factor de peso al ESP32.
                    </Text>
                  </View>
                )}

                {/* Acciones */}
                <View style={styles.cardActions}>
                  {hasProduct ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]}
                      onPress={() => handleUnlinkProduct(item.estante_id, item.producto_id!)}
                      activeOpacity={0.8}
                    >
                      <IconSymbol name="xmark" size={14} color={T.danger} />
                      <Text style={[styles.actionBtnText, { color: T.danger, marginTop: 0 }]}>Vaciar Estante</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]}
                      onPress={() => {
                        setSelectedShelfId(item.estante_id);
                        setLinkProductModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <IconSymbol name="link" size={14} color={T.primary} />
                      <Text style={[styles.actionBtnText, { color: T.primary, marginTop: 0 }]}>Vincular Producto</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnOutline, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]}
                    onPress={() => handleDeleteShelf(item.estante_id, item.mac_address)}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="trash" size={14} color={descriptionColor} />
                    <Text style={[styles.actionBtnText, { color: descriptionColor, marginTop: 0 }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: T.xl }} />

        {/* Sección RFID Personal */}
        <SectionTitle text="Control de Acceso RFID" />

        <View style={{ gap: T.md }}>
          {loading || !currentUser ? (
            <SectionCard>
              <ActivityIndicator size="small" color={T.primary} />
            </SectionCard>
          ) : profiles.length === 0 ? (
            <SectionCard noPadding style={{ borderWidth: isDark ? 1 : 0, borderColor: separatorColor }}>
              <EmptyState message="Cargando empleados..." />
            </SectionCard>
          ) : isAdmin ? (
            // Vista agrupada para el Administrador (Ordenada exactamente como register.tsx)
            (["Administrador TI", "Desarrollador", "Tester", "Empleado"] as const).map((roleName) => {
              const list = groupedProfiles?.[roleName] || [];
              if (list.length === 0) return null;

              // Obtener color por rol
              let roleColor = T.primary;
              let roleLabel: string = roleName;

              if (roleName === "Administrador TI") {
                roleColor = "#D97706"; // Amber
                roleLabel = "Administradores TI";
              } else if (roleName === "Desarrollador") {
                roleColor = "#2563EB"; // Blue
                roleLabel = "Desarrolladores";
              } else if (roleName === "Tester") {
                roleColor = "#059669"; // Green
                roleLabel = "Testers";
              } else if (roleName === "Empleado") {
                roleColor = "#6B7280"; // Gray
                roleLabel = "Empleados";
              }

              return (
                <View key={roleName} style={{ marginBottom: T.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingHorizontal: T.sm }}>
                    <Text style={{ fontSize: T.fontSm, fontWeight: T.weightBold, color: roleColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {roleLabel} ({list.length})
                    </Text>
                  </View>
                  <SectionCard noPadding style={{ borderWidth: isDark ? 1 : 0, borderColor: separatorColor }}>
                    {list.map((p, index) => {
                      const hasCard = !!p.rfid_tag;
                      return (
                        <View
                          key={p.id}
                          style={[
                            styles.profileRow,
                            {
                              borderTopWidth: index === 0 ? 0 : 1,
                              borderTopColor: separatorColor,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.profileName, { color: headingColor }]}>{p.nombre_completo}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <IconSymbol name="person.fill" size={14} color={descriptionColor} />
                              <Text style={[styles.profileRole, { color: descriptionColor, marginTop: 0 }]}>
                                {p.username ? `@${p.username}` : (p.roles?.nombre || "Empleado")}
                              </Text>
                            </View>
                          </View>

                          {hasCard ? (
                            <View style={styles.rfidLinkedContainer}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 6 }}>
                                <IconSymbol name="creditcard" size={14} color={T.success} />
                                <Text style={[styles.rfidTagText, { color: T.success, marginLeft: 0 }]}>{p.rfid_tag}</Text>
                              </View>
                              <TouchableOpacity
                                style={styles.removeRfidBtn}
                                onPress={() => handleRemoveRfid(p.id, p.nombre_completo)}
                              >
                                <IconSymbol name="xmark" size={12} color={T.danger} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[styles.addRfidBtn, { backgroundColor: T.primaryLight }]}
                              onPress={() => {
                                setSelectedProfile(p);
                                setRfidTagInput("");
                                setRfidLinkPhase('waiting');
                                setRfidCountdown(10);
                                setRfidModalVisible(true);
                              }}
                            >
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <IconSymbol name="creditcard" size={14} color={T.primary} />
                                <Text style={[styles.addRfidBtnText, { color: T.primary }]}>Vincular</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </SectionCard>
                </View>
              );
            })
          ) : (
            // Vista plana y enmascarada para empleados regulares (Operador, Empleado, etc.)
            <SectionCard noPadding style={{ borderWidth: isDark ? 1 : 0, borderColor: separatorColor }}>
              {displayedProfiles.map((p, index) => {
                const isSelf = p.id === currentUser.id;
                const hasCard = !!p.rfid_tag;

                return (
                  <View
                    key={p.id}
                    style={[
                      styles.profileRow,
                      {
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: separatorColor,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.profileName, { color: headingColor }]}>
                          {p.nombre_completo}
                        </Text>
                        {isSelf && (
                          <View style={{ backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, color: isDark ? '#93C5FD' : '#2563EB', fontWeight: 'bold' }}>Tú</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <IconSymbol name="person.fill" size={14} color={descriptionColor} />
                        <Text style={[styles.profileRole, { color: descriptionColor, marginTop: 0 }]}>
                          {p.roles?.nombre || "Empleado"}
                        </Text>
                      </View>
                    </View>

                    {hasCard ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: isDark ? '#14331C' : '#E8F5E9' }}>
                        <IconSymbol name="creditcard" size={14} color={T.success} />
                        <Text style={[styles.rfidTagText, { color: T.success, marginLeft: 0, fontWeight: T.weightSemi }]}>
                          {isSelf ? p.rfid_tag : "Tarj. Activa"}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: isDark ? '#2E3033' : '#F5F5F5' }}>
                        <IconSymbol name="creditcard" size={14} color={isDark ? '#7E848C' : '#9E9E9E'} />
                        <Text style={{ fontSize: T.fontSm, color: isDark ? '#7E848C' : '#9E9E9E', fontWeight: T.weightMedium }}>
                          Sin tarjeta
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </SectionCard>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── MODAL 1: REGISTRAR ESTANTE ─── */}
      <Modal visible={registerModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: headingColor }]}>Registrar Estante IoT</Text>
            <Text style={[styles.modalDesc, { color: descriptionColor }]}>
              Registra la celda de carga. Obtén la MAC mostrada por el Monitor Serie en Arduino.
            </Text>

            <Text style={[styles.inputLabel, { color: headingColor }]}>Dirección MAC</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: inputBg, color: inputTextColor }]}
              placeholder="Ej: AA:BB:CC:DD:EE:FF o AABBCCDDEEFF"
              placeholderTextColor={T.textMuted}
              value={macInput}
              onChangeText={setMacInput}
              autoCapitalize="characters"
            />

            <Text style={[styles.inputLabel, { color: headingColor }]}>Ubicación Física</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: inputBg, color: inputTextColor }]}
              placeholder="Ej: Pasillo A - Estante 2"
              placeholderTextColor={T.textMuted}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setRegisterModalVisible(false);
                  setMacInput("");
                  setLocationInput("");
                }}
              >
                <Text style={[styles.modalBtnText, { color: descriptionColor }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: T.primary }]}
                onPress={handleRegisterShelf}
              >
                <Text style={[styles.modalBtnText, { color: "#FFF" }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* ─── MODAL 2: VINCULAR PRODUCTO ─── */}
      <Modal visible={linkProductModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, maxHeight: "80%" }]}>
            <Text style={[styles.modalTitle, { color: headingColor }]}>Seleccionar Producto</Text>
            <Text style={[styles.modalDesc, { color: descriptionColor }]}>
              Selecciona el producto que físicamente se colocará en este estante.
            </Text>

            {products.length === 0 ? (
              <EmptyState message="No hay productos en el catálogo" />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(p) => p.id}
                style={{ width: "100%", marginVertical: T.md }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: separatorColor }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productListItem}
                    onPress={() => handleLinkProduct(item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productListName, { color: headingColor }]}>{item.nombre}</Text>
                      <Text style={[styles.productListWeight, { color: descriptionColor }]}>
                        Peso unitario: {item.peso_individual_gramos}g
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={descriptionColor} />
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel, { width: "100%", flex: 0, marginTop: T.sm }]}
              onPress={() => {
                setLinkProductModalVisible(false);
                setSelectedShelfId(null);
              }}
            >
              <Text style={[styles.modalBtnText, { color: descriptionColor }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: VINCULAR RFID (Auto-Escaneo) ─── */}
      <Modal visible={rfidModalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <View style={[styles.rfidLinkModal, { backgroundColor: cardBg }]}>

            {/* ── FASE 1: ESPERANDO ESCANEO ── */}
            {rfidLinkPhase === 'waiting' && (
              <>
                <View style={[styles.rfidIconCircle, { backgroundColor: isDark ? '#1A2332' : '#EBF5FF' }]}>
                  <IconSymbol name="wifi" size={48} color={isDark ? '#93C5FD' : '#2563EB'} />
                </View>
                <Text style={[styles.rfidPhaseTitle, { color: headingColor }]}>
                  Acerque su tarjeta al lector
                </Text>
                <Text style={[styles.rfidPhaseDesc, { color: descriptionColor }]}>
                  Vinculando a: {selectedProfile?.nombre_completo}
                </Text>
                <View style={[styles.rfidCountdownBadge, { backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE' }]}>
                  <Text style={[styles.rfidCountdownText, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
                    {rfidCountdown}s
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.rfidCancelBtn, { borderColor: separatorColor }]}
                  onPress={closeRfidModal}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rfidCancelBtnText, { color: descriptionColor }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── FASE 2: VINCULANDO (Tarjeta detectada, guardando) ── */}
            {rfidLinkPhase === 'linking' && (
              <>
                <ActivityIndicator size="large" color={T.primary} style={{ marginBottom: T.xl }} />
                <Text style={[styles.rfidPhaseTitle, { color: headingColor }]}>
                  Vinculando...
                </Text>
                <Text style={[styles.rfidPhaseDesc, { color: descriptionColor }]}>
                  Asignando tarjeta a {selectedProfile?.nombre_completo}
                </Text>
              </>
            )}

            {/* ── FASE 3: ÉXITO ── */}
            {rfidLinkPhase === 'success' && (
              <>
                <View style={[styles.rfidIconCircle, { backgroundColor: isDark ? '#14331C' : '#DCFCE7' }]}>
                  <IconSymbol name="checkmark.circle" size={48} color={T.success} />
                </View>
                <Text style={[styles.rfidPhaseTitle, { color: T.success }]}>
                  ¡Tarjeta vinculada!
                </Text>
                <Text style={[styles.rfidPhaseDesc, { color: descriptionColor }]}>
                  {selectedProfile?.nombre_completo} ahora tiene acceso RFID
                </Text>
              </>
            )}

            {/* ── TIMEOUT: Sin lectura en 10s ── */}
            {rfidLinkPhase === 'timeout' && (
              <>
                <View style={[styles.rfidIconCircle, { backgroundColor: isDark ? '#3E2A00' : '#FEF3C7' }]}>
                  <IconSymbol name="clock" size={48} color={T.warning} />
                </View>
                <Text style={[styles.rfidPhaseTitle, { color: T.warning }]}>
                  Tiempo agotado
                </Text>
                <Text style={[styles.rfidPhaseDesc, { color: descriptionColor }]}>
                  No se detectó ninguna tarjeta en 10 segundos.
                </Text>
                <View style={styles.rfidActionRow}>
                  <TouchableOpacity
                    style={[styles.rfidRetryBtn, { backgroundColor: T.primaryLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]}
                    onPress={() => { setRfidLinkPhase('waiting'); setRfidCountdown(10); }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={T.primary} />
                    <Text style={[styles.rfidRetryBtnText, { color: T.primary, marginLeft: 0 }]}>Reintentar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rfidCancelBtn, { borderColor: separatorColor, flex: 1 }]}
                    onPress={closeRfidModal}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rfidCancelBtnText, { color: descriptionColor }]}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── ERROR: Fallo al guardar ── */}
            {rfidLinkPhase === 'error' && (
              <>
                <View style={[styles.rfidIconCircle, { backgroundColor: isDark ? '#3E1616' : '#FEE2E2' }]}>
                  <IconSymbol name="xmark" size={48} color={T.danger} />
                </View>
                <Text style={[styles.rfidPhaseTitle, { color: T.danger }]}>
                  Error al vincular
                </Text>
                <Text style={[styles.rfidPhaseDesc, { color: descriptionColor }]}>
                  No se pudo asignar la tarjeta. Es posible que ya esté en uso.
                </Text>
                <View style={styles.rfidActionRow}>
                  <TouchableOpacity
                    style={[styles.rfidRetryBtn, { backgroundColor: T.primaryLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]}
                    onPress={() => { setRfidLinkPhase('waiting'); setRfidCountdown(10); setRfidTagInput(""); }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={T.primary} />
                    <Text style={[styles.rfidRetryBtnText, { color: T.primary, marginLeft: 0 }]}>Reintentar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rfidCancelBtn, { borderColor: separatorColor, flex: 1 }]}
                    onPress={closeRfidModal}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rfidCancelBtnText, { color: descriptionColor }]}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: T.xl,
    paddingBottom: T.lg,
  },
  title: {
    fontSize: T.fontXxl,
    fontWeight: T.weightBold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: T.fontSm + 1,
    lineHeight: 18,
    marginTop: T.xs,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: T.lg,
    borderRadius: T.radiusMd,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: T.weightBold,
    fontSize: T.fontSm + 1,
  },
  divider: {
    height: 1,
    marginBottom: T.xl,
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  shelfCard: {
    borderRadius: T.radiusLg,
    padding: T.lg,
    marginBottom: T.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  macText: {
    fontSize: T.fontLg,
    fontWeight: T.weightBold,
  },
  locationText: {
    fontSize: T.fontSm,
    marginTop: T.xs,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: T.sm + 2,
    borderRadius: T.radiusSm,
  },
  statusBadgeText: {
    fontSize: T.fontXs - 1,
    fontWeight: T.weightBold,
    textTransform: "uppercase",
  },
  cardDivider: {
    height: 1,
    marginVertical: T.md,
  },
  telemetryRow: {
    flexDirection: "row",
    gap: T.md,
    marginBottom: T.md,
  },
  telemetryBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: T.sm,
  },
  telemetryIcon: {
    fontSize: 22,
  },
  telemetryLabel: {
    fontSize: T.fontXs,
  },
  telemetryValue: {
    fontSize: T.fontMd + 1,
    fontWeight: T.weightBold,
    marginTop: 2,
  },
  productDetailsBox: {
    borderRadius: T.radiusMd,
    padding: T.md,
    marginTop: T.xs,
    marginBottom: T.md,
  },
  productName: {
    fontSize: T.fontMd,
    fontWeight: T.weightSemi,
  },
  productMeta: {
    fontSize: T.fontXs,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: T.sm,
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: T.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimary: {
    backgroundColor: T.primaryLight,
  },
  actionBtnDanger: {
    backgroundColor: T.dangerBg,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: T.border,
  },
  actionBtnText: {
    fontSize: T.fontSm,
    fontWeight: T.weightBold,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: T.md,
  },
  profileName: {
    fontSize: T.fontMd,
    fontWeight: T.weightBold,
  },
  profileRole: {
    fontSize: T.fontXs,
    marginTop: 4,
  },
  rfidLinkedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.sm,
  },
  rfidTagText: {
    fontSize: T.fontSm,
    fontWeight: T.weightBold,
  },
  removeRfidBtn: {
    padding: T.xs,
  },
  addRfidBtn: {
    paddingVertical: 6,
    paddingHorizontal: T.md,
    borderRadius: T.radiusSm,
  },
  addRfidBtnText: {
    fontSize: T.fontXs,
    fontWeight: T.weightBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: T.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: T.radiusLg,
    padding: T.xl,
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: T.fontXl,
    fontWeight: T.weightBold,
    marginBottom: T.xs,
  },
  modalDesc: {
    fontSize: T.fontSm,
    lineHeight: 18,
    marginBottom: T.lg,
  },
  inputLabel: {
    fontSize: T.fontSm,
    fontWeight: T.weightBold,
    marginBottom: T.sm,
  },
  textInput: {
    width: "100%",
    height: 48,
    borderRadius: T.radiusMd,
    paddingHorizontal: T.md,
    fontSize: T.fontMd,
    marginBottom: T.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: T.md,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: T.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: T.border,
  },
  modalBtnConfirm: {
    // Background color determined dynamically
  },
  modalBtnText: {
    fontSize: T.fontMd,
    fontWeight: T.weightBold,
  },
  productListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: T.md,
  },
  productListName: {
    fontSize: T.fontMd,
    fontWeight: T.weightBold,
  },
  productListWeight: {
    fontSize: T.fontXs,
    marginTop: 4,
  },
  // ── Estilos del Modal de Vinculación RFID Automática ──
  rfidLinkModal: {
    width: "85%",
    maxWidth: 340,
    borderRadius: T.radiusLg + 4,
    paddingVertical: T.xl + 8,
    paddingHorizontal: T.xl,
    alignItems: "center",
  },
  rfidIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: T.lg,
  },
  rfidPhaseTitle: {
    fontSize: T.fontXl,
    fontWeight: T.weightBold,
    textAlign: "center",
    marginBottom: T.sm,
  },
  rfidPhaseDesc: {
    fontSize: T.fontSm,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: T.lg,
  },
  rfidCountdownBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: T.xl,
  },
  rfidCountdownText: {
    fontSize: T.fontXl + 2,
    fontWeight: T.weightBold,
  },
  rfidCancelBtn: {
    width: "100%",
    height: 44,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rfidCancelBtnText: {
    fontSize: T.fontMd,
    fontWeight: T.weightSemi,
  },
  rfidActionRow: {
    flexDirection: "row",
    gap: T.sm,
    width: "100%",
  },
  rfidRetryBtn: {
    flex: 1,
    height: 44,
    borderRadius: T.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  rfidRetryBtnText: {
    fontSize: T.fontMd,
    fontWeight: T.weightBold,
  },
});

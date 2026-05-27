import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, StatusBar, Text, TouchableOpacity, useColorScheme, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/StyleIndex";

// Importamos las pantallas de Login y Registro para integrarlas como capas fijas
import LoginScreen from "./login";
import RegisterScreen from "./register";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? "#151718" : "#ffffff";
  const titleColor = isDark ? "#ECEDEE" : "#151414";
  const subtitleColor = isDark ? "#9BA1A6" : "#151414";

  // Inicializamos las posiciones X animadas para las tres pantallas.
  // Al usar Animated.Value en refs, se mantienen estables entre renders.
  const welcomeX = useRef(new Animated.Value(0)).current;
  const loginX = useRef(new Animated.Value(width)).current;
  const registerX = useRef(new Animated.Value(width)).current;

  // Mapa para acceder dinámicamente a las posiciones de cada pantalla
  const positions: { [key: string]: Animated.Value } = {
    welcome: welcomeX,
    login: loginX,
    register: registerX,
  };

  // Historial virtual de navegación
  const [history, setHistory] = useState<string[]>(["welcome"]);

  // Escuchar el botón físico de atrás en Android para integrarlo con la pila virtual de navegación
  useEffect(() => {
    const backAction = () => {
      if (history.length > 1) {
        navigateBack();
        return true; // Bloquea la acción por defecto para evitar que cierre la app o falle el router
      }
      return false; // Deja que el comportamiento nativo de Android continúe si estamos en el inicio
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [history]);

  // Estado de visibilidad para optimizar el rendimiento en Android
  // Al poner display: "none" en pantallas invisibles, Android libera recursos de renderizado nativos al 100%
  const [visibleViews, setVisibleViews] = useState<{ [key: string]: boolean }>({
    welcome: true,
    login: false,
    register: false,
  });

  // Navegar hacia adelante (Push) con animación de empuje en paralelo
  const navigateTo = (target: string) => {
    const current = history[history.length - 1];

    // 1. Activamos la visibilidad (display: "flex") de la pantalla destino antes de animar
    setVisibleViews(prev => ({ ...prev, [target]: true }));
    
    // Colocamos la pantalla de destino justo en el borde derecho antes de deslizar
    positions[target].setValue(width);

    Animated.parallel([
      // La pantalla actual se desliza hacia la izquierda
      Animated.timing(positions[current], {
        toValue: -width,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // La pantalla de destino entra desde la derecha en sincronía perfecta
      Animated.timing(positions[target], {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      // 2. Al finalizar la animación, actualizamos el historial y desactivamos la visibilidad de la anterior (current)
      setHistory(prev => [...prev, target]);
      setVisibleViews(prev => ({ ...prev, [current]: false }));
    });
  };

  // Navegar hacia atrás (Pop) con animación inversa sincronizada
  const navigateBack = () => {
    if (history.length <= 1) return;
    const current = history[history.length - 1];
    const target = history[history.length - 2];

    // 1. Activamos la visibilidad (display: "flex") de la pantalla destino (anterior) antes de animar
    setVisibleViews(prev => ({ ...prev, [target]: true }));

    // Nos aseguramos de que la pantalla destino empiece en el borde izquierdo
    positions[target].setValue(-width);

    Animated.parallel([
      // La pantalla actual sale hacia la derecha
      Animated.timing(positions[current], {
        toValue: width,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // La pantalla destino entra desde la izquierda en sincronía perfecta
      Animated.timing(positions[target], {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      // 2. Al finalizar la animación, actualizamos el historial y desactivamos la visibilidad de la pantalla que ahora está offscreen
      setHistory(prev => prev.slice(0, -1));
      setVisibleViews(prev => ({ ...prev, [current]: false }));
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: containerBg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={containerBg} />
      
      {/* CAPA 0: Bienvenida (Optimizada con display) */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width,
        transform: [{ translateX: welcomeX }],
        display: visibleViews.welcome ? 'flex' : 'none',
      }}>
        <View style={[styles.container, { width, height: '100%', backgroundColor: containerBg, paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Vantage Logo Premium Header */}
          <View style={{
            alignSelf: 'center',
            padding: 12,
            borderRadius: 32,
            backgroundColor: isDark ? 'rgba(46, 48, 51, 0.4)' : 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 6,
            marginBottom: 25,
          }}>
            <Image
              source={require("../assets/images/vantage.png")}
              style={{
                width: 130,
                height: 130,
              }}
              contentFit="contain"
            />
          </View>

          <Text style={[styles.title, { color: titleColor }]}>¡Bienvenido a VANTAGE!</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Seleccione la opción que te gustaría hacer hoy
          </Text>

          {/* Botón de Iniciar Sesión */}
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigateTo("login")}
          >
            <Ionicons name="log-in-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Botón de Registrarse */}
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => navigateTo("register")}
          >
            <Ionicons name="person-add-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* CAPA 1: Iniciar Sesión (Optimizada con display) */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width,
        transform: [{ translateX: loginX }],
        display: visibleViews.login ? 'flex' : 'none',
      }}>
        <View style={{ width, height: '100%' }}>
          <LoginScreen onBack={navigateBack} onRegister={() => navigateTo("register")} />
        </View>
      </Animated.View>

      {/* CAPA 2: Registro (Optimizada con display) */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width,
        transform: [{ translateX: registerX }],
        display: visibleViews.register ? 'flex' : 'none',
      }}>
        <View style={{ width, height: '100%' }}>
          <RegisterScreen onBack={navigateBack} />
        </View>
      </Animated.View>
    </View>
  );
}

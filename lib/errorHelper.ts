/**
 * Traduce y limpia los errores devueltos por Supabase Auth
 * para mostrarlos de forma amigable y profesional al usuario.
 */
export function translateAuthError(error: any): string {
  if (!error) return "Ocurrió un error inesperado.";
  
  let message = "";
  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error.message === 'string') {
    message = error.message;
  } else if (error && typeof error.error_description === 'string') {
    message = error.error_description;
  } else {
    message = String(error);
  }
  
  // Guardar copia para consolas si es necesario
  console.log("[Vantage Auth Error Logger]:", message);

  // 1. Si es un string JSON de error, intentar parsearlo para extraer el mensaje interno
  if (typeof message === 'string' && message.trim().startsWith('{') && message.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.message) message = parsed.message;
      else if (parsed.error_description) message = parsed.error_description;
      else if (parsed.error) message = parsed.error;
    } catch (e) {
      // Ignorar error de parseo y seguir
    }
  }

  // 2. Limpiar de manera extremadamente agresiva cualquier prefijo o fragmento técnico como AuthApiError
  // Quitamos todas las ocurrencias de AuthApiError y derivados con o sin dos puntos, corchetes, o guiones, en cualquier parte del mensaje.
  message = message
    .replace(/(AuthApiError|AuthSessionMissingError|AuthSessionError|AuthInternalError|AuthError|Error|ApiError):\s*/ig, "")
    .replace(/\[?(AuthApiError|AuthSessionMissingError|AuthSessionError|AuthInternalError|AuthError|Error|ApiError)\]?\s*/ig, "")
    .replace(/^[:\-\s\u2014]+/, "") // Quitar dos puntos, guiones o espacios iniciales sobrantes
    .trim();

  const lowerMessage = message.toLowerCase();
  
  // Mapeo de errores comunes (Inglés y Español)
  if (
    lowerMessage.includes("already registered") || 
    lowerMessage.includes("alredy registered") || 
    lowerMessage.includes("already signed up") || 
    lowerMessage.includes("alredy signed up") || 
    lowerMessage.includes("already exists") || 
    lowerMessage.includes("alredy exists") ||
    lowerMessage.includes("user_already_exists") ||
    lowerMessage.includes("registered") ||
    lowerMessage.includes("exists") ||
    lowerMessage.includes("registrado") ||
    lowerMessage.includes("existe") ||
    lowerMessage.includes("ya existe")
  ) {
    return "Este nombre de usuario ya está registrado. Por favor, intenta con otro.";
  }
  
  if (
    lowerMessage.includes("invalid login credentials") || 
    lowerMessage.includes("invalid credentials") || 
    lowerMessage.includes("invalid_credentials") || 
    lowerMessage.includes("credentials_invalid") ||
    lowerMessage.includes("credenciales") ||
    lowerMessage.includes("incorrectas") ||
    lowerMessage.includes("inválidas")
  ) {
    return "El nombre de usuario o la contraseña son incorrectos.";
  }

  if (lowerMessage.includes("signup_disabled") || lowerMessage.includes("signup is disabled") || lowerMessage.includes("registro desactivado")) {
    return "El registro de nuevos usuarios está temporalmente desactivado.";
  }

  if (
    lowerMessage.includes("password should be") || 
    lowerMessage.includes("weak_password") || 
    lowerMessage.includes("password is too weak") ||
    lowerMessage.includes("débil") ||
    lowerMessage.includes("contraseña debe")
  ) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (lowerMessage.includes("email not confirmed") || lowerMessage.includes("email_not_confirmed") || lowerMessage.includes("confirmar cuenta")) {
    return "Por favor, confirma tu cuenta antes de iniciar sesión.";
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("rate_limit") || lowerMessage.includes("too many requests") || lowerMessage.includes("demasiados intentos")) {
    return "Has realizado demasiados intentos. Por favor, espera un momento y vuelve a intentarlo.";
  }

  if (lowerMessage.includes("network error") || lowerMessage.includes("failed to fetch") || lowerMessage.includes("conexión") || lowerMessage.includes("red")) {
    return "Error de conexión. Comprueba tu red y vuelve a intentarlo.";
  }

  // Si no coincide con ninguno conocido, devolvemos el mensaje original limpio
  return message;
}

import * as SQLite from 'expo-sqlite';

/**
 * Inicializa la base de datos SQLite local.
 * Crea las tablas necesarias si no existen.
 */

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db === null) {
    db = await SQLite.openDatabaseAsync('vantage.db');
    await initializeTables(db);
  }
  return db;
}

async function initializeTables(database: SQLite.SQLiteDatabase) {
  try {
    // Verificar si la tabla productos tiene el schema antiguo y migrar si es necesario
    await migrateProductosTable(database);

    // Crear tabla de productos (sincronizada con Supabase) - solo si no existe
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        peso_individual_gramos REAL NOT NULL,
        stock_minimo INTEGER NOT NULL DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        sincronizado INTEGER DEFAULT 0
      );
    `);

    // Crear tabla de estantes (relación producto-estante)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS estantes (
        id TEXT PRIMARY KEY,
        mac_address TEXT UNIQUE NOT NULL,
        ubicacion_fisica TEXT,
        esta_abierto INTEGER DEFAULT 0,
        alerta_activa INTEGER DEFAULT 0,
        ultima_conexion DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla de inventario actual (relación producto-estante)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventario_actual (
        id TEXT PRIMARY KEY,
        estante_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        peso_total_gramos REAL DEFAULT 0,
        cantidad_calculada INTEGER DEFAULT 0,
        ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(estante_id, producto_id),
        FOREIGN KEY(estante_id) REFERENCES estantes(id),
        FOREIGN KEY(producto_id) REFERENCES productos(id)
      );
    `);

    // Crear tabla para rastrear cambios pendientes de sincronizar
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tabla TEXT NOT NULL,
        operacion TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
        producto_id TEXT NOT NULL,
        datos TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        sincronizado INTEGER DEFAULT 0
      );
    `);

    // Crear índices para mejor performance
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
      CREATE INDEX IF NOT EXISTS idx_estantes_mac ON estantes(mac_address);
      CREATE INDEX IF NOT EXISTS idx_inventario_estante ON inventario_actual(estante_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_sincronizado ON sync_queue(sincronizado);
    `);

    // Limpiar IDs inválidos (no-UUID) de la tabla productos
    await cleanupInvalidIds(database);

    // Migrar tabla de movimientos si tiene schema antiguo
    await migrateMovimientosTable(database);

    // Inicializar tabla de movimientos directamente para evitar dependencia circular
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        estante_id TEXT NOT NULL,
        producto_id TEXT NOT NULL DEFAULT '',
        tipo_accion TEXT NOT NULL CHECK (tipo_accion IN ('ENTRADA', 'SALIDA')),
        diferencia_peso_gramos REAL NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 0,
        fecha_hora DATETIME NOT NULL,
        sinc INTEGER DEFAULT 0
      );
    `);

    // Crear índices para mejor performance
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_estante ON movimientos(estante_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos(producto_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo_accion);
      CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha_hora);
      CREATE INDEX IF NOT EXISTS idx_movimientos_sinc ON movimientos(sinc);
    `);

    console.log('Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando tablas SQLite:', error);
    throw error;
  }
}

/**
 * Migra la tabla productos del schema antiguo al nuevo si es necesario
 */
async function migrateProductosTable(database: SQLite.SQLiteDatabase) {
  try {
    // Verificar si la tabla existe y obtener su estructura
    const tableInfo = await database.getAllAsync<{name: string}>(
      "PRAGMA table_info(productos)"
    );
    
    if (!tableInfo || tableInfo.length === 0) {
      // Tabla no existe, nada que migrar
      return;
    }

    // Verificar si tiene las columnas viejas (sku, categoria, precio, stock)
    const columnNames = tableInfo.map((col: any) => col.name);
    const hasOldSchema = columnNames.includes('sku') || 
                         columnNames.includes('categoria') || 
                         columnNames.includes('precio') ||
                         columnNames.includes('stock');
    
    if (hasOldSchema) {
      console.log('Detectado schema antiguo de productos. Migrando...');
      
      // Renombrar tabla vieja
      await database.execAsync('ALTER TABLE productos RENAME TO productos_old;');
      
      // Crear tabla nueva con nuevo schema
      await database.execAsync(`
        CREATE TABLE productos (
          id TEXT PRIMARY KEY,
          nombre TEXT NOT NULL,
          peso_individual_gramos REAL NOT NULL,
          stock_minimo INTEGER NOT NULL DEFAULT 0,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          sincronizado INTEGER DEFAULT 0
        );
      `);
      
      // Copiar datos que podamos mantener (solo nombre, id, stock_minimo)
      // Los demás campos tendrán valores por defecto
      try {
        await database.execAsync(`
          INSERT INTO productos (id, nombre, stock_minimo, creado_en, sincronizado)
          SELECT id, nombre, COALESCE(stock_minimo, 0), 
                 COALESCE(creado_en, DATETIME('now')), 0
          FROM productos_old;
        `);
        console.log('Datos migracion desde schema antiguo');
      } catch (e) {
        console.warn('No se pudieron migrar datos, tabla vieja sin datos relevantes');
      }
      
      // Eliminar tabla vieja
      await database.execAsync('DROP TABLE productos_old;');
    }
  } catch (error) {
    console.error('Error durante migración de schema:', error);
    // No lanzar error, permitir que continúe la inicialización
  }
}

/**
 * Migra la tabla movimientos del schema antiguo al nuevo si es necesario
 * (INGRESO/EXTRACCION → ENTRADA/SALIDA, agrega producto_id y cantidad)
 */
async function migrateMovimientosTable(database: SQLite.SQLiteDatabase) {
  try {
    const tableInfo = await database.getAllAsync<{name: string}>(
      "PRAGMA table_info(movimientos)"
    );
    
    if (!tableInfo || tableInfo.length === 0) {
      // Tabla no existe, nada que migrar
      return;
    }

    const columnNames = tableInfo.map((col: any) => col.name);
    // Verificar si falta alguna de las columnas del nuevo schema
    const requiredColumns = [
      'id',
      'usuario_id',
      'estante_id',
      'producto_id',
      'tipo_accion',
      'diferencia_peso_gramos',
      'cantidad',
      'fecha_hora',
      'sinc'
    ];
    const needsMigration = requiredColumns.some(col => !columnNames.includes(col));
    
    if (needsMigration) {
      console.log('Detectado schema antiguo de movimientos. Migrando (drop & recreate)...');
      // También eliminar los índices correspondientes
      await database.execAsync(`
        DROP INDEX IF EXISTS idx_movimientos_estante;
        DROP INDEX IF EXISTS idx_movimientos_producto;
        DROP INDEX IF EXISTS idx_movimientos_usuario;
        DROP INDEX IF EXISTS idx_movimientos_tipo;
        DROP INDEX IF EXISTS idx_movimientos_fecha;
        DROP INDEX IF EXISTS idx_movimientos_sinc;
        DROP TABLE IF EXISTS movimientos;
      `);
      console.log('✅ Tabla movimientos e índices eliminados para recreación con nuevo schema');
    }
  } catch (error) {
    console.error('Error durante migración de movimientos:', error);
  }
}

/**
 * Limpia IDs inválidos (no-UUID) de la tabla productos y sync_queue
 */
async function cleanupInvalidIds(database: SQLite.SQLiteDatabase) {
  try {
    // Expresión regular para validar UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Obtener todos los productos
    const productos = await database.getAllAsync<{id: string}>(
      'SELECT id FROM productos'
    );
    
    // Encontrar IDs inválidos
    const invalidIds = productos
      .filter((p: any) => !uuidRegex.test(p.id))
      .map((p: any) => p.id);
    
    if (invalidIds.length > 0) {
      console.log(`🧹 Limpiando ${invalidIds.length} IDs inválidos...`);
      
      // Eliminar de productos
      for (const id of invalidIds) {
        await database.runAsync(
          'DELETE FROM productos WHERE id = ?',
          [id]
        );
        // También eliminar de sync_queue
        await database.runAsync(
          'DELETE FROM sync_queue WHERE producto_id = ?',
          [id]
        );
      }
      
      console.log(`Limpieza completada`);
    }
  } catch (error) {
    console.error('Error limpiando IDs inválidos:', error);
  }
}

/**
 * Limpia la base de datos (solo para desarrollo/testing)
 */
export async function resetDatabase() {
  const database = await getDatabase();
  try {
    await database.execAsync(`
      DROP TABLE IF EXISTS sync_queue;
      DROP TABLE IF EXISTS productos;
    `);
    console.log('Base de datos reiniciada');
    await initializeTables(database);
  } catch (error) {
    console.error('Error reiniciando base de datos:', error);
  }
}

/**
 * Obtiene información sobre el estado de la base de datos
 */
export async function getDatabaseInfo() {
  const database = await getDatabase();
  const tables = await database.getAllAsync(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);
  console.log('Tablas en SQLite:', tables);
  return tables;
}

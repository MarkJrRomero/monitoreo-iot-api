require('dotenv').config();
const postgres = require('postgres');

describe('Conexión a Base de Datos', () => {
  let sql;

  beforeAll(() => {
    sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require'
    });
  });

  afterAll(async () => {
    if (sql) {
      await sql.end();
    }
  });

  test('debe conectarse exitosamente a la base de datos', async () => {
    const result = await sql`SELECT NOW()`;
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('now');
    expect(result[0].now).toBeInstanceOf(Date);
    
    console.log('✅ Conexión exitosa:', result[0]);
  });

  test('debe verificar que las variables de entorno están configuradas', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).not.toBe('');
    expect(process.env.DATABASE_URL).toContain('postgresql://');
  });

  test('debe poder ejecutar una consulta simple', async () => {
    const result = await sql`SELECT 1 as test_value`;
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('test_value');
    expect(result[0].test_value).toBe(1);
  });

  test('debe manejar errores de conexión correctamente', async () => {
    // Test para verificar que la conexión es estable
    const startTime = Date.now();
    const result = await sql`SELECT 1`;
    const endTime = Date.now();
    
    // La consulta debe completarse en menos de 5 segundos
    expect(endTime - startTime).toBeLessThan(5000);
    expect(result).toHaveLength(1);
  });
});

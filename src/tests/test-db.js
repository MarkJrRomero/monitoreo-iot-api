require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Conexión exitosa:', result[0]);
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
  }
}

testConnection();

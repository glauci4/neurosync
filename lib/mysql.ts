// lib/mysql.ts
import mysql from "mysql2/promise";

const config = {
  host: process.env.MYSQL_HOST || "localhost", // Onde o MySQL está rodando
  user: process.env.MYSQL_USER || "root", // Usuário do MySQL
  password: process.env.MYSQL_PASSWORD || "", // Senha do MySQL
  database: process.env.MYSQL_DATABASE || "neurosync", // Nome do banco de dados
  port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10), // Porta padrão do MySQL
};

export async function getConnection() {
  try {
    const connection = await mysql.createConnection(config);
    return connection;
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    throw error;
  }
}


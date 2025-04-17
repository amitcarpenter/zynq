import mysql from 'mysql2';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error("database connetion error", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('MySQL Database Connected');
    }
  });

  connection.on('error', (err) => {
    console.error("DB error", err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔁 Reconnecting to the database...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

function makeDb() {
  return {
    async query(sql, args) {
      return util.promisify(connection.query).call(connection, sql, args);
    },
    async close() {
      console.log("Database connection closed");
      return util.promisify(connection.end).call(connection);
    }
  };
}

const db = makeDb();
export default db;

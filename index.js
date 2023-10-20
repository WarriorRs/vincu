const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configura la conexión a la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'la103',
  password: 'javiermero8',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Renderiza tu formulario HTML de inicio de sesión
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Consulta la base de datos para verificar las credenciales
  pool.query('SELECT * FROM usuarios WHERE username = $1 AND password = $2', [username, password], (err, dbRes) => {
    if (err) {
      console.error('Error en la consulta', err);
      res.send('Error en la autenticación');
    } else {
      if (dbRes.rows.length === 1) {
        res.send('Inicio de sesión exitoso');
      } else {
        res.send('Credenciales incorrectas');
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});

const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

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

app.use(cookieParser()); // Configura el middleware cookieParser

app.use(bodyParser.urlencoded({ extended: true }));

// Configurar Express para servir archivos estáticos desde un directorio llamado "public"
app.use(express.static(__dirname + '/public'));

// Obtener index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Obtener login.html
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Definir una lista de elementos
const elementos = [
  'cerveza',
  'whisky',
  'aguardiente',
  'ron',
  'vodka',
  'licor_hierbas',
  'vinos_y_cocteles',
  'tequila',
  'aguas',
  'gaseosas',
  'snack'
];

// Iterar a través de los elementos y crear rutas
elementos.forEach(elemento => {
  app.get(`/${elemento}`, (req, res) => {
    res.sendFile(__dirname + `/pages/${elemento}/${elemento}.html`);
  });
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
        // Autenticación exitosa, establece una cookie "logged_in" con valor "true"
        res.cookie('logged_in', 'true');
        res.redirect('/');
      } else {
        res.redirect('/login?error=Credenciales%20incorrectas');
      }
    }
  });
});

// Agrega la ruta /logout
app.get('/logout', (req, res) => {
  res.clearCookie('logged_in'); // Elimina la cookie "logged_in"
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});

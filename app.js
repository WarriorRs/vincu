const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');

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

// Establece el motor de plantillas como EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // Directorio donde se encuentran los archivos de plantilla
app.use(cookieParser()); // Configura el middleware cookieParser

app.use(bodyParser.urlencoded({ extended: true }));

// Configurar Express para servir archivos estáticos desde un directorio llamado "public"
app.use(express.static(__dirname + '/public'));

// Obtener index.html
app.get('/', (req, res) => {
  const username = req.query.username; // Obtén el nombre de usuario de la query
  res.sendFile(__dirname + '/index.html');
});

// Ruta para renderizar el header dinámico
app.get('/header', (req, res) => {
  res.render('header'); // Renderiza header.ejs
});

// Ruta para renderizar el footer dinámico
app.get('/footer', (req, res) => {
  res.render('footer'); // Renderiza footer.ejs
});

// Obtener login.html
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Obtener otros
app.get('/config', (req, res) => {
  res.sendFile(__dirname + '/pages/otros/config.html');
});
app.get('/contactanos', (req, res) => {
  res.sendFile(__dirname + '/pages/otros/contactanos.html');
});
app.get('/perfil', (req, res) => {
  res.sendFile(__dirname + '/pages/otros/perfil.html');
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
  'snack',
  'log',
];

// Iterar a través de los elementos y crear rutas
elementos.forEach(elemento => {
  app.get(`/${elemento}`, (req, res) => {
    const username = req.query.username; // Obtén el nombre de usuario de la query
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
        res.cookie('username', username); // Almacena el nombre de usuario en la cookie
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

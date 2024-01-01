const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


const app = express();
const port = 3000;

app.use(cors());
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
  const username = req.query.username; // Obtén el nombre de usuario de la query
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

// Definir una lista de elementos
const otros = [
  'config',
  'contactanos',
  'perfil',
  'agregar'
];

// Ruta para obtener las categorías desde la base de datos en formato JSON
app.get('/api/categorias', (req, res) => {
  pool.query('SELECT nombre FROM categorias WHERE nombre != $1', ['log'], (err, dbRes) => {
    if (err) {
      console.error('Error al obtener categorías', err);
      res.status(500).json({ error: 'Error al obtener categorías' });
    } else {
      const categorias = dbRes.rows.map(row => row.nombre.charAt(0).toUpperCase() + row.nombre.slice(1)); // Convertir la primera letra a mayúscula
      res.status(200).json({ categorias });
    }
  });
});

// Agrega una nueva ruta para buscar productos por ID o nombre
app.get('/api/productos/buscar', (req, res) => {
  const searchQuery = req.query.q; // Obtener el parámetro de búsqueda desde la URL

  // Realizar una consulta a la base de datos para buscar por ID o nombre
  pool.query('SELECT * FROM productos WHERE id = $1 OR nombre ILIKE $2', [searchQuery, `%${searchQuery}%`], (err, dbRes) => {
    if (err) {
      console.error('Error al buscar producto', err);
      res.status(500).json({ error: 'Error al buscar producto' });
    } else {
      if (dbRes.rows.length > 0) {
        const productoEncontrado = dbRes.rows[0]; // Tomar el primer resultado (pueden ser múltiples)

        // Enviar los datos del producto encontrado como respuesta
        res.status(200).json({ producto: productoEncontrado });
      } else {
        res.status(404).json({ mensaje: 'Producto no encontrado' });
      }
    }
  });
});


// Iterar a través de los elementos y crear rutas
otros.forEach(otros => {
  app.get(`/${otros}`, (req, res) => {
    const username = req.query.username; // Obtén el nombre de usuario de la query
    res.sendFile(__dirname + `/pages/otros/${otros}.html`);
  });
});

// Ruta para obtener los datos de los productos en formato JSON
elementos.forEach(elemento => {
  app.get(`/api/${elemento}`, (req, res) => {
    pool.query('SELECT p.nombre, p.descripcion, p.precio, p.img, c.nombre AS categoria_nombre FROM productos p INNER JOIN categorias c ON p.categoria_id = c.id WHERE c.nombre = $1', [elemento], (err, dbRes) => {
      if (err) {
        console.error('Error al obtener productos', err);
        res.status(500).json({ error: 'Error al obtener productos' });
      } else {
        res.status(200).json({ productos: dbRes.rows });
      }
    });
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

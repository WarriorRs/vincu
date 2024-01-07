const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Configura el middleware cookieParser
app.use(bodyParser.urlencoded({ extended: true }));

// Configura la conexión a la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'la103',
  password: 'javiermero8',
  port: 5432,
});





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
  pool.query('SELECT * FROM categorias WHERE nombre != $1', ['log'], (err, dbRes) => {
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

  let query = 'SELECT p.*, c.nombre AS categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE ';
  let params = [];

  // Verificar si es un número (probablemente un ID)
  if (!isNaN(searchQuery)) {
    query += 'p.id = $1';
    params.push(searchQuery);
  } else {
    query += 'LOWER(p.nombre) LIKE $1';
    params.push(`%${searchQuery.toLowerCase()}%`);
  }

  pool.query(query, params, (err, dbRes) => {
    if (err) {
      console.error('Error al buscar producto', err);
      res.status(500).json({ error: 'Error al buscar producto' });
    } else {
      if (dbRes.rows.length > 0) {
        const productoEncontrado = dbRes.rows[0]; // Tomar el primer resultado (pueden ser múltiples)

        // Obtener el nombre de la categoría del producto
        const categoriaNombre = productoEncontrado.categoria_nombre;

        // Enviar los datos del producto encontrado como respuesta junto con el nombre de la categoría
        res.status(200).json({ producto: productoEncontrado, categoriaNombre });
      } else {
        res.status(404).json({ mensaje: 'Producto no encontrado' });
      }
    }
  });
});

app.get('/api/productos/autocompletar', (req, res) => {
  const searchTerm = req.query.q.toLowerCase();

  pool.query(
    'SELECT nombre FROM productos WHERE LOWER(nombre) LIKE $1',
    [`%${searchTerm}%`],
    (err, dbRes) => {
      if (err) {
        console.error('Error al buscar productos para autocompletar', err);
        res.status(500).json({ error: 'Error al buscar productos para autocompletar' });
      } else {
        const productos = dbRes.rows.map(row => row.nombre);
        res.status(200).json({ productos });
      }
    }
  );
});

app.post('/api/productos/agregar', (req, res) => {
  const { nombre, descripcion, precio, img, categoriaNombre } = req.body;
  console.log(req.body);

  // Verificar si el nombre del producto ya existe en la tabla de productos
  pool.query('SELECT id FROM productos WHERE LOWER(nombre) = $1', [nombre.toLowerCase()], (err, dbRes) => {
      if (err) {
          console.error('Error al verificar el nombre del producto', err);
          res.status(500).json({ error: 'Error al verificar el nombre del producto', detail: err });
      } else if (dbRes.rows.length > 0) {
          // Si el nombre ya existe, enviar un mensaje de error
          res.status(400).json({ error: 'El nombre del producto ya existe' });
      } else {
          // Si el nombre no existe, continuar con la inserción
          // Buscar el ID de la categoría basado en el nombre recibido en minúscula
          pool.query('SELECT id FROM categorias WHERE LOWER(nombre) = $1', [categoriaNombre.toLowerCase()], (err, catRes) => {
              if (err) {
                  console.error('Error al obtener ID de categoría', err);
                  res.status(500).json({ error: 'Error al obtener ID de categoría', detail: err });
              } else {
                  const categoriaId = catRes.rows[0]?.id; // El ID de la categoría encontrada

                  // Insertar el producto con el ID de la categoría obtenido
                  pool.query('INSERT INTO productos (nombre, descripcion, precio, img, categoria_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                      [nombre, descripcion, precio, img, categoriaId],
                      (insertErr, insertRes) => {
                          if (insertErr) {
                              console.error('Error al agregar el producto', insertErr);
                              res.status(500).json({ error: 'Error al agregar el producto', detail: insertErr });
                          } else {
                              res.status(200).json({ message: 'Producto agregado correctamente', producto: insertRes.rows[0] });
                          }
                  });
              }
          });
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

// Crear archivos HTML para cada producto
function createProductHTML(producto, elemento) {
  const nombreProducto = producto.nombre.toLowerCase().replace(/\s+/g, '_');

  const contenidoHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${producto.nombre}</title>
      <link rel="stylesheet" href="/styles.css">
      <link rel="icon" type="img/png" href="/logo.png">
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    </head>
    <body>
      <header>
        <nav>
            <a href="/"><img src="/logo.png" class="logo" alt=""></a>
            
            <ul>
                <a href="/"><h1>Deposito La 103</h1></a>
            </ul>
            <div class="imgusermenu">
                <img src="/log/user-photo.png" class="user_pic" id="user_pic" alt="" onclick="toggleMenu()">
                    <span onclick="toggleMenu()">usernameDisplay</span>
                </img>
            </div>
            
            
            <a href="/login" class="login-button" id="loginButton" style="display: none;"><img src="/log/user-photo.png" class="login-button" alt=""><span>Iniciar Sesion</span></a>
            <div class="sub-menu-wrap" id="subMenu" style="display: none;">
                <div class="sub-menu">
                    <div class="user-info">
                        <img src="/log/user-photo.png" alt="">
                        <h2>usernameDisplay</h2>
                    </div>
                    <hr>
                    <a href="/perfil" class="sub-menu-link">
                        <img src="/log/perfilwhite.png" alt=""> <p>Perfil</p>
                        <span></span>
                    </a>
                    <a href="/config" class="sub-menu-link">
                        <img src="/log/configuracionwhite.png" alt=""> <p>Configuración</p>
                        <span></span>
                    </a>
                    <a href="/logout" class="sub-menu-link">
                        <img src="/log/salidawhite.png" alt=""> <p>Cerrar Sesión</p>
                        <span></span>
                    </a>
                </div>
            </div>
        </nav>
      </header>
      
      <div class="product-object">
        <section>
          <h1>${producto.nombre}</h1>
          <img src="${producto.img}" alt="${producto.nombre}">
          <p>Descripción: ${producto.descripcion}</p>
          <p>Precio: $${producto.precio}</p>
        </section>
      </div>
    
      <footer>
        <fieldset id="footer-fieldset">
            <p>&copy; 2023 Deposito La 103</p>
        </fieldset>
      </footer>
      <script>
        function closeChatbot() {
            document.querySelector('.chatbot-container').style.display = 'none';
        }

        if (document.cookie.includes('logged_in=true')) {
        // Si está logeado, muestra el menú desplegable y el nombre de usuario
        document.getElementById('loginButton').style.display = 'none'; // Oculta el botón de inicio de sesión
        document.getElementById('subMenu').style.display = 'block'; // Muestra el menú desplegable

        // Configura el nombre de usuario
        const username = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*=\s*([^;]*).*$)|^.*$/, '$1');
        document.querySelector('.user-info h2').textContent = username;
        document.querySelector('.imgusermenu span').textContent = username;

        } else {
            // Si no está logeado, muestra el botón de inicio de sesión y oculta el menú desplegable
            document.getElementById('loginButton').style.display = 'block'; // Muestra el botón de inicio de sesión
            document.getElementById('subMenu').style.display = 'none'; // Oculta el menú desplegable
            document.querySelector('.imgusermenu').style.display= 'none';

        }

        let subMenu = document.getElementById("subMenu");

        function toggleMenu(){
            subMenu.classList.toggle("open-menu")
        }

        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');
        document.getElementById('usernameDisplay').textContent = username;
    </script>
    </body>
    
    </html>
  `;

  const fs = require('fs');
  fs.writeFile(`./pages/${elemento}/${nombreProducto}.html`, contenidoHTML, err => {
    if (err) {
      console.error('Error al escribir archivo HTML', err);
    } else {
      console.log(`Archivo ${nombreProducto}.html creado para el producto ${producto.nombre}`);
    }
  });
}

// Obtener archivos HTML para cada producto al iniciar la aplicación
elementos.forEach(elemento => {
  app.get(`/api/${elemento}`, (req, res) => {
    pool.query('SELECT p.nombre, p.descripcion, p.precio, p.img, c.nombre AS categoria_nombre FROM productos p INNER JOIN categorias c ON p.categoria_id = c.id WHERE c.nombre = $1', [elemento], (err, dbRes) => {
      if (err) {
        console.error('Error al obtener productos', err);
        res.status(500).json({ error: 'Error al obtener productos' });
      } else {
        const productos = dbRes.rows;

        productos.forEach(producto => {
          createProductHTML(producto, elemento);
        });

        res.status(200).json({ productos });
      }
    });
  });

  // Definir la ruta para cada producto
  app.get(`/pages/${elemento}/:productName`, (req, res) => {
    const productName = req.params.productName;
    res.sendFile(`${__dirname}/pages/${elemento}/${productName}.html`);
    const username = req.body.username;
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

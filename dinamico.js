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



// Función para obtener los productos
const obtenerProductos = (categoriaSolicitada) => {
  pool.query('SELECT p.nombre, p.descripcion, p.precio, p.img, p.categoria_id, c.nombre AS categoria_nombre FROM productos p INNER JOIN categorias c ON p.categoria_id = c.id WHERE c.nombre = $1', [categoriaSolicitada], (err, dbRes) => {
    if (err) {
      console.error('Error al consultar la base de datos', err);
    } else {
      const productos = dbRes.rows;
      console.log({ productos }); // Imprimir los productos en la terminal
    }
  });
};

// Llamada a la función para obtener productos de una categoría específica
const categoriaEjemplo = 'cerveza'; // Reemplaza con la categoría deseada
obtenerProductos(categoriaEjemplo);

-- Esquema completo del portafolio. Ejecutar con:  npm run db:setup
CREATE DATABASE IF NOT EXISTS portafolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portafolio;

CREATE TABLE IF NOT EXISTS modulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  tipo ENUM('tarjetas','notas','linea') NOT NULL DEFAULT 'tarjetas',
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seccion VARCHAR(60) NOT NULL DEFAULT 'programacion',
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  tecnologias VARCHAR(255) NULL,
  categoria VARCHAR(100) NULL,
  fecha VARCHAR(40) NULL,
  enlace VARCHAR(255) NULL,
  imagen VARCHAR(255) NULL,
  archivo VARCHAR(255) NULL,
  archivo_nombre VARCHAR(255) NULL,
  topologia VARCHAR(255) NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO modulos (slug, nombre, descripcion, tipo, orden) VALUES
  ('redes', 'Redes', 'Simulaciones y topologías en Packet Tracer.', 'tarjetas', 1),
  ('programacion', 'Programación', 'Algoritmos, bases de datos y software.', 'tarjetas', 2),
  ('notas', 'Notas', 'Comentarios propios sobre estudios e implementación de redes.', 'notas', 3),
  ('logros', 'Títulos y logros', 'Formación, certificaciones y reconocimientos.', 'linea', 4);

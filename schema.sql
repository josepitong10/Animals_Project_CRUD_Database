SHOW DATABASES;
USE ojt_store;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    num_legs INT NOT NULL,
    created_by INT UNSIGNED NULL,
    created_by_name VARCHAR(100) NULL,
    created_by_email VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_by (created_by)
);

INSERT INTO animals (id, name, num_legs) VALUES
(1, 'Dog', 4),
(2, 'Bird', 2),
(3, 'Spider', 8),
(4, 'Ant', 6),
(5, 'Human', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SELECT * FROM animals;
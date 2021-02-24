DROP TABLE IF EXISTS BooksTable;
CREATE TABLE IF NOT EXISTS BooksTable(
   Id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(30),
    image_url VARCHAR(255),
    summary VARCHAR(255)
);
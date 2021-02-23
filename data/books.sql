DROP TABLE IF EXISTS BooksTable;
CREATE TABLE IF NOT EXISTS BooksTable(
   Id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn NUMERIC(18,15),
    image_url VARCHAR(255),
    summary VARCHAR(255)
);
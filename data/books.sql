-- DROP TABLE IF EXISTS BooksTable;
CREATE TABLE IF NOT EXISTS BooksTable(
   Id SERIAL PRIMARY KEY,
    author VARCHAR(1000),
    title VARCHAR(500),
    isbn VARCHAR(1000),
    image_url VARCHAR(1000),
    summary VARCHAR(5000),
    bookshelf VARCHAR(500)
);
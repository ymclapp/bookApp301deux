'use strict';

//Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
pg.defaults.ssl = process.env.NODE_ENV === 'production' && { rejectUnauthorized: false };
const superagent = require('superagent'); 
// const { request } = require('express');  //<<--what is this?
const methodOverride = require('method-override');

// Database Setup
if (!process.env.DATABASE_URL) {
  throw 'DATABASE_URL is missing!';
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });


// Our Dependencies

//Application Setup
const PORT = process.env.PORT || 3001 || 3002 || 3003;
console.log('Server is running on port: ', PORT)
const app = express();

//Express Middleware
app.use(express.urlencoded({ extended: true }));

//Specify a directory for static resources
app.use(express.static('./public'));


//Cors Middleware
app.use(cors());
app.use(methodOverride('_method'));

//Set the view engine for server-side templating
app.set('view engine', 'ejs');


app.get('/searches', booksHandler);
app.post('/searches', booksHandler); //has to match the form action on the new.js for the /searches


app.get('/', getBooks);

//API Routes

app.get('/books/:id', getOneBook);
app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new'); //do not include a / before pages or it will say that it is not in the views folder
});

app.get('/searches/show', (request, response) => {
  response.render('pages/searches/show'); //do not include a / before pages or it will say that it is not in the views folder
});

app.delete('/books/:id', deleteOneBook);
app.put('/books/:id/edit-view', updateOneBook);
app.get('/books/:id/edit-view', editOneBook);


app.post('/books', favoriteBookHandler);

function getBooks(request, response){
  const SQL = `
    SELECT *
    FROM BooksTable
    `;

  client.query(SQL)
    .then(results => {
      const {rowCount, rows} = results;
      console.log('DB', rows, rowCount);
      response.render('pages/index', {
        books: rows,
      });
    })
    .catch(err => {
      errorHandler(err, request, response);
    });
}


function getOneBook(request, response){
  const {id} = request.params;
  console.log('id', id);
  const SQL = `
  SELECT *
  FROM bookstable
  WHERE id =$1
  LIMIT 1`; // make it so only one comes back
  client.query(SQL, [id])
    .then(results => {
      const {rows} = results;
      if(rows.length < 1){
        // console.log('response', response);
        errorHandler('Book not Found', request, response);
      } else{
        response.render('pages/books/detail-view', { // take off /pages if it doesn't work
          book: rows[0]
        });
      }
    })
    .catch(err => {
      errorHandler(err, request, response);
    });
} // end getOneBook function


function booksHandler(request, response) {
  const url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({
      key: process.env.GOOGLE_API_KEY,
      q: `+in${request.body.searchType}:${request.body.searchQuery}`
    })
    .then((booksResponse) => booksResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', {results: results})) //do not include a / before pages or it will say that it is not in the views folder and do not include the .ejs at the end of show
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

} // end booksHandler function

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));


//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

//client goes here

function favoriteBookHandler(request, response) {
  const { author, title, isbn, image_url, summary } = request.body;
  console.log('request body', request.body);
  const SQL = `INSERT INTO bookstable (author, title, isbn, image_url, summary) VALUES ($1, $2, $3, $4, $5) RETURNING id;`;  //<<--make sure there is a semi colon before the back tic
  const parameters = [author, title, isbn, image_url, summary];
  return client.query(SQL, parameters)
    .then(result => {
      let id = result.rows[0].id;
      console.log('id', id);
      response.redirect(`/books/${id}`);
    })
    .catch(err => {
      errorHandler(err, request, response);
      console.err('Error in favoriteBookHandler', err);
    });
} // end favoriteBookHandler function

function deleteOneBook(request, response) {
  console.log('DELETE', request.params.books_id)
  const SQL = `
    DELETE FROM bookstable
    WHERE Id = $1
  `;
  console.log(request.params.id);
  client.query(SQL, [request.params.books_id])
    .then(() => {
      response.redirect('/');
    })
    .catch(err => errorHandler(err, response));
} // end deleteOneBook function

function editOneBook(request, response) {
  const SQL = `
    SELECT *
    FROM bookstable
    WHERE Id = $1
  `;
  client.query(SQL, [request.params.books_id])
    .then(results => {
      const books = results.rows[0];
      const viewModel = {
        books
      };
      response.render(`/books/:id/edit-view`, viewModel);
    })
}  // end editOneBook function

function updateOneBook(request, response) {
  console.log(request.params);
  const { title, author, isbn , image_url, summary, bookshelves } = request.body;
  const SQL = `
    UPDATE bookstable SET
    author=$1,
    title=$2,
    isbn=$3,
    image_url=$4,
    summary=$5,
    bookshelves=$6
    WHERE id = $7
  `;
  const parameters = [author, title, isbn , image_url, summary, bookshelves,  parseInt(request.params.books_id)];
  client.query(SQL, parameters)
    .then(() => {
      response.redirect(`/books/${request.params.books_id}`);
    })
    .catch( error => console.log(error));
}  // end updateOneBook function



function errorHandler(error, request, response, next) {
  console.error(error);
  response.status(500).json({
    error: true,
    message: error.message,
  });
}

function notFoundHandler(request, response) {
  response.status(404).json({
    notFound: true,
  });
}

client.connect() //<<--keep in server.js
  .then(() => {
    console.log('PG connected!');
    app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes
  })
  .catch(err => {
    throw `PG error!:  ${err.message}` //<<--these are tics not single quotes
  });



function Book(booksData) {
  let placeHolder = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g;
  // console.log('constructor function function fun fun function ', booksData.industryIdentifiers[0].identifier );
  this.title = booksData.title;
  this.author = booksData.authors;
  this.isbn = booksData.industryIdentifiers[0].identifier;
  this.summary = booksData.description;
  this.image_url = booksData.imageLinks ? booksData.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeHolder; //if no image, then we use stock that is in Trello card
}



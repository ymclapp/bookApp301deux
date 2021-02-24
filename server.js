'use strict';

//Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent'); //<<--will go in module
const { request } = require('express');

// Database Setup
if (!process.env.DATABASE_URL) {
  throw 'DATABASE_URL is missing!';
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });


// Our Dependencies - modules

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


//Set the view engine for server-side templating
app.set('view engine', 'ejs');


//API Routes
app.get('/', getBooks);

function getBooks(request, response){
  const SQL = `
    SELECT *
    FROM booksTable
    `;
  // const SQLCounter = `
  //   SELECT COUNT(author)
  //   FROM bookstable
  //   `;
  client.query(SQL)
    .then(results => {
      const {rowCount, rows} = results;
      console.log('DB', rows, rowCount);
      response.render('pages/index', {
        books: rows,
      });
    })
    .catch(err => {
      errorHandler(err, response);
    });
}

app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new'); //do not include a / before pages or it will say that it is not in the views folder
});

app.get('/searches/show', (request, response) => {
  response.render('pages/searches/show'); //do not include a / before pages or it will say that it is not in the views folder
});

app.post('/searches', booksHandler); //has to match the form action on the new.js for the /searches

//Will end up going into a module
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

}

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));


//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

//client goes here

//Will end up going into a module
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
  // console.log('constructor function function fun fun function ',booksData.title, booksData.authors, booksData.description );
  this.title = booksData.title;
  this.authors = booksData.authors;
  this.description = booksData.description;
  this.image = booksData.imageLinks ? booksData.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeHolder; //if no image, then we use stock that is in Trello card
}



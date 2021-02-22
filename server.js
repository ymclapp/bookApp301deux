'use strict';

require('dotenv').config();


const express = require('express');
const app = express();

const pg = require('pg');
pg.defaults.ssl = process.env.NODE_ENV === 'production' && { rejectUnauthorized: false };

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const superagent = require('superagent');

const cors = require('cors');

const PORT = process.env.PORT || 3000;
console.log("Server is running on port: ", PORT)

app.use(express.static('./public'));
app.use(cors());

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  response.render('pages/index');
});

app.get('/new', (request, response) => {
  response.render('pages/searches/new');
});

function booksHandler(request, response) {
  console.log(request.body)
  const url = 'https://www.googleapis.com/books/v1/volumes';

  superagent.get(url)
    .query({
      q: `+in${request.body.search}:${request.body.query}`
    })
    .then((booksResponse) => {
      let booksData = json.parse(booksResponse.text);
      let bookReturn = booksData.items.map(book => {
        return new Book (book);
      });
      response.send(bookReturn);  //we will end up putting in the render instead when we move to show
    })
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
    this.title = booksData.volumeInfo.title;
    this.authors = booksData.volumeInfo.authors;
    this.description = booksData.volumeInfo.description;
    this.image = booksData.volumeInfo.imageLinks.smallThumnail;  //if no image, then we use stock that is in Trello card
  }
  }

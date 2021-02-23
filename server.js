'use strict';

require('dotenv').config();
const cors = require('cors');

const express = require('express');
const app = express();
const pg = require('pg');
// const methodOverride = require('method-override'; //need when we add/delete)
// const ejs = require('ejs');
// const expressLayouts = require('express-ejs-layouts');
// const favicon = require('serve-favicon');
const superagent = require('superagent');

// pg.defaults.ssl = process.env.NODE_ENV === 'production' && { rejectUnauthorized: false };

// const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', err => console.error(err));

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
// app.use(methodOverride('_method'));  //goes with methodOverride above

const PORT = process.env.PORT || 3000;
console.log('Server is running on port: ', PORT)

// const path = require('path');
// app.use(express.json());
// app.use(expressLayouts);

// app.set('views', path.join(__dirname, 'views'));


app.get('/', (request, response) => {
  response.render('pages/index');
  console.log('get');
});

app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new');
});

// app.get('/show', (request, response) => {
//   response.render('pages/searches/show');
// });

app.post('/searches', booksHandler);


function booksHandler(request, response) {
  
  const url = 'https://www.googleapis.com/books/v1/volumes';
  
  superagent.get(url)
    .query({
      key: process.env.GOOGLE_API_KEY,
      q: `+in${request.body.radio}:${request.body.searchQuery}`
    })
    .then((booksResponse) => {
      console.log('response', booksResponse);
      // console.log('body', request.body);
      // let booksData = JSON.parse(booksResponse.text);
      // console.log('book response', booksData.items[0].volumeInfo);
      let bookReturn = booksResponse.body.items.map(book => {
        // console.log('book', bookReturn);
        return new Book(book);
        
      });
      // let viewModel = {
      //   books: bookReturn
      // }
      // response.render('pages/searches/show', viewModel);  //we will end up putting in the render instead when we move to show
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

// client.connect() //<<--keep in server.js
//   .then(() => {
//     console.log('PG connected!');

//     app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes
//   })
//   .catch(err => {
//     throw `PG error!:  ${err.message}` //<<--these are tics not single quotes
//   });
app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes

function Book(booksData) {
  this.title = booksData.volumeInfo.title;
  this.authors = booksData.volumeInfo.authors;
  this.description = booksData.volumeInfo.description;
  // this.image = booksData.volumeInfo.imageLinks.smallThumbnail;  //if no image, then we use stock that is in Trello card
}


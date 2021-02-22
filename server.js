'use strict';

require('dotenv').config();


const express = require('express');
const app = express();

const pg = require('pg');
// pg.defaults.ssl = process.env.NODE_ENV === 'production' && { rejectUnauthorized: false };

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// const superagent = require('superagent');

const cors = require('cors');

const PORT = process.env.PORT || 3000;
console.log("Server is running on port: ", PORT)

app.use(express.static('./public'));
app.use(cors());

app.get('/', (request, response) => {
  response.send('You have found the home page! ');
});

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

client.connect() //<<--keep in server.js
  .then(() => {
    console.log('PG connected!');

    app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes
  })
  .catch(err => {
    throw `PG error!:  ${err.message}` //<<--these are tics not single quotes
  });

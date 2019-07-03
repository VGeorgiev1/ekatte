'use strict';

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const Client = require('pg').Client;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ekkate',
  password: 'password',
  port: 5432,
});
const port = 3000;

client.connect();

app.use(express.static(path.join(__dirname, './public')));
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname});
});

app.post('/search', (req, res) => {
  client.query(`
    SELECT 
    l.ekatte as ekkate,
    l.type,
    l.name as localName,
    m.area,
    l.municipality,
    a.area_name as areaName,
    m.municipality_name as municipalityName
    FROM Localities as l
    INNER JOIN Municipalities as m ON l.municipality = m.name
    INNER JOIN Areas as a ON m.area = a.name
    WHERE STRPOS(LOWER(l.name), $1) > 0;`, [req.body.searchValue.toLowerCase()])
      .then((r, err) =>{
        if (err) {
          res.send('Error!');
          throw new Error(err.message);
        }
        res.send({info: r.rows, lables: Object.keys(r.rows[0])});
      }).catch((e)=>{
        console.log(e);
      });
});

app.listen(port, () => {
  console.log('listening on port ' + port);
});

'use  strict';
/* eslint-disable max-len */
const Client = require('pg').Client;
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ekkate',
  password: 'password',
  port: 5432,
});
client.connect().then(async () => {
  const areas = await client.query('SELECT COUNT(*) FROM areas');
  console.log('There are : ' + areas.rows[0].count + ' areas');

  const localities = await client.query('SELECT COUNT(*) FROM localities');
  console.log('There are : ' + localities.rows[0].count + ' localities');

  const municiaplities = await client.query('SELECT COUNT(*) FROM municipalities');
  console.log('There are : ' + municiaplities.rows[0].count + ' municicpalities \n');

  const res = await client.query('SELECT a.name, COUNT(l.ekatte) FROM Localities as l INNER JOIN municipalities as m on m.name = l.municipality INNER JOIN areas as a on m.area = a.name GROUP BY a.name');
  for (const row of res.rows) {
    console.log('In area ' + row.name + ' there are ' + row.count + ' localities');
  }
  client.end();
});

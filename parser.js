'use strict';
const Client = require('pg').Client;
const XLSX = require('xlsx');
const pgPort = 5432;
const fs = require('fs');

const tablesSql = fs.readFileSync('./tables.sql', {encoding: 'UTF-8'});


const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ekkate',
  password: 'password',
  port: pgPort,
});
client.connect();

const shouldAbort = (err) => {
  if (err) {
    console.error('Error in transaction', err.stack);
    client.query('ROLLBACK', (err) => {
      if (err) {
        console.error('Error rolling back client', err.stack);
      }
    });
  }
  return !!err;
};

client.query(tablesSql)
    .then(async (res, err) => {
      client.query('BEGIN', async (err) => {
        if (shouldAbort(err)) return;
        await createRecords('./Ek_obl.xlsx', 'Ek_obl', 2, 'Areas',
            {
              ekatte: 'ekatte',
              area_name: 'name',
              name: 'oblast',
              region: 'region',
            }
        );
        await createRecords('./Ek_obst.xlsx', 'Ek_obst', 2, 'Municipalities',
            {
              ekatte: 'ekatte',
              name: 'obstina',
              municipality_name: 'name',
              area: {col: 'obstina', filter: (val)=>val.substring(0, 3)},
            });
        await createRecords('./Ek_atte.xlsx', 'Ek_atte', 3, 'Localities',
            {
              ekatte: 'ekatte',
              name: 'name',
              municipality: 'obstina',
              type: 't_v_m',
            });
        client.end();
      });
      client.query('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction', err.stack);
        }
      });
    });
/**
 * Creates record in the database by given spredsheet.
 * @param {String} filename The name of the spreadsheet to take records from.
 * @param {String} sheet Which sheet from the spreadsheet to look into.
 * @param {int} header Header offset in the sheet.
 * @param {string} model The name of the table to insert the values in
 * @param {object} defaults The keys represent the column name for the record
 * and values the sheet column to take value from
 * @return {Promise} Fullfiled when all the records get saved in the database.
 */
async function createRecords(filename, sheet, header, model, defaults) {
  const data = XLSX.readFile(filename);
  const rows = XLSX.utils.sheet_to_json(data.Sheets[sheet], {
    header: header,
    defval: '',
    blankrows: false,
  });
  const defKeys = Object.keys(defaults);
  const promissContainer = [];
  for (const row of rows) {
    if (row['ekatte'] !== '00000') {
      const _defaults = {};
      for (const defKey of defKeys) {
        const currentValue = defaults[defKey];
        if (defaults[defKey].filter) {
          _defaults[defKey] = currentValue.filter(row[currentValue.col]);
        } else {
          _defaults[defKey] = row[currentValue];
        }
      }
      const valuesPlaceholders = [...Array(Object.values(_defaults).length)]
          .map((_, i) => '$' + (i+1).toString());
      const values = Object.values(_defaults);

      promissContainer.push(client.query(`
                    INSERT INTO ${model} (${defKeys.join(',')})
                    VALUES(${valuesPlaceholders.join(',')})
                    ON CONFLICT DO NOTHING`, values)
          .then((res, err) => {
            if (shouldAbort(err)) return;
          }));
    }
  }
  return Promise.all(promissContainer);
}

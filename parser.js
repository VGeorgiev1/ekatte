'use strict';
const Pool = require('pg').Pool;
const XLSX = require('xlsx');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ekkate',
  password: 'password',
  port: 5432
});
pool.query(`CREATE TABLE IF NOT EXISTS Areas(
                  name CHAR(3) PRIMARY KEY NOT NULL,
                  ekatte CHAR(5),
                  area_name VARCHAR(20),
                  region CHAR(4),
                  document SMALLINT
              );
              CREATE TABLE IF NOT EXISTS Municipalities(
                  name CHAR(5) PRIMARY KEY NOT NULL,
                  ekatte CHAR(5),
                  municipality_name VARCHAR(20)
              );
              CREATE TABLE IF NOT EXISTS Localities(
                  ekatte CHAR(5) PRIMARY KEY NOT NULL,
                  name VARCHAR(30),
                  area CHAR(3),
                  municipality CHAR(5),
                  FOREIGN KEY(area) REFERENCES Areas(name),
                  FOREIGN KEY(municipality) REFERENCES Municipalities(name)
              );`)
    .then(async (res, err) => {
      if (err) {
        console.log(err);
      }
      await createRecords('./Ek_obst.xlsx', 'Ek_obst', 2, 'Municipalities',
          {
            ekatte: 'ekatte',
            name: 'obstina',
            municipality_name: 'name'
          });
      await createRecords('./Ek_obl.xlsx', 'Ek_obl', 2, 'Areas',
          {
            ekatte: 'ekatte',
            area_name: 'name',
            name: 'oblast',
            region: 'region'
          });
      await createRecords('./Ek_atte.xlsx', 'Ek_atte', 3, 'Localities',
          {
            ekatte: 'ekatte',
            name: 'name',
            area: 'oblast',
            municipality: 'obstina'
          });
      pool.end();
    });

/**
 * Creates record in the databse by given spredsheet.
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
    blankrows: false
  });
  const defKeys = Object.keys(defaults);
  const promissContainer = [];

  for (const row of rows) {
    if (row['ekatte'] !== '00000') {
      const _defaults = {};
      for (const defKey of defKeys) {
        _defaults[defKey] = row[defaults[defKey]];
      }
      const valuesPlaceholders = [...Array(Object.values(_defaults).length)].map((_, i) => '$' + (i+1).toString());
      const values = Object.values(_defaults);
      promissContainer.push(pool.connect().then((client) => {
        return client.query(`INSERT INTO ${model} (${defKeys.join(',')}) VALUES(${valuesPlaceholders.join(',')}) ON CONFLICT DO NOTHING`, values)
            .then((_res) => {
              client.release();
            })
            .catch((e) => {
              client.release();
              console.log(e.stack);
            });
      }));
    }
  }
  return Promise.all(promissContainer);
}

const Pool = require('pg').Pool
const XLSX = require('xlsx')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ekkate',
  password: 'password',
  port: 5432
})
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
      console.log(err)
    }
    await createRecords('./Ek_obst.xlsx', 'Ek_obst', 2, 'Municipalities', { name: 'obstina' },
      {
        ekatte: 'ekatte',
        name: 'obstina',
        municipality_name: 'name'
      })
    await createRecords('./Ek_obl.xlsx', 'Ek_obl', 2, 'Areas', { name: 'oblast' },
      {
        ekatte: 'ekatte',
        area_name: 'name',
        name: 'oblast',
        region: 'region'
      })
    await createRecords('./Ek_atte.xlsx', 'Ek_atte', 3, 'Localities', { ekatte: 'ekatte' },
      {
        ekatte: 'ekatte',
        name: 'name',
        area: 'oblast',
        municipality: 'obstina'
      })
    pool.end()
  })
async function createRecords (filename, sheet, header, model, search, defaults) {
  let data = XLSX.readFile(filename)
  let rows = XLSX.utils.sheet_to_json(data.Sheets[sheet], {
    header: header,
    defval: '',
    blankrows: false
  })
  let defKeys = Object.keys(defaults)
  let searchKeys = Object.keys(search)
  let promissContainer = []

  for (let row of rows) {
    if (row['ekatte'] !== '00000') {
      let _defaults = {}
      let _search = {}
      for (let defKey of defKeys) {
        _defaults[defKey] = row[defaults[defKey]]
      }
      for (let searchKey of searchKeys) {
        _search[searchKey] = row[search[searchKey]]
      }
      promissContainer.push(pool.connect().then(client => {
        return client.query(`INSERT INTO ${model} (${defKeys.join(',')}) VALUES(${Object.values(_defaults).map(v => `'${v}'`).join(',')}) ON CONFLICT DO NOTHING`)
          .then(res => {
            client.release()
          })
          .catch(e => {
            client.release()
            console.log(e.stack)
          })
      }))
    }
  }
  return Promise.all(promissContainer)
}

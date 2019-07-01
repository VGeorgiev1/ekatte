const express = require('express')
const app = express()
const path = require('path')

var pub = path.join(__dirname, './public')
app.use(express.static(pub))

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})
app.listen(3000, () => {
  console.log('worked')
})

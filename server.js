const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');
const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1boTzRAnIv7z25iHA0U7xeGGhR87r25NCHRdhKocWN5k';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  let arrResult = [];

  for (let i = 1; i < rows.length; i++) {
    const user = {};
    for (let j = 0; j < rows[0].length; j++) {
      user[rows[0][j]] = rows[i][j]
    }
    arrResult.push(user);
  }
  res.json(arrResult);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  const table = await sheet.getRows();
  const firstRow = table.rows[0]
  let newRow = [];
  for (const row in messageBody) {
    for (let i = 0; i < firstRow.length; i++) {
      if (row === firstRow[i]) {
        newRow.push(messageBody[row])
      }
    }
  }
  const result = await sheet.appendRow(newRow);
  res.json(result);
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column = req.params.column;
  const value = req.params.value;
  const messageBody = req.body;

  const table = await sheet.getRows();
  const rows = table.rows;

  let numberRow = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].indexOf(value) !== -1) {
      numberRow = i;
      break;
    }
  }
  if (numberRow === null) {
    res.json({
      "response": "success"
    });
  }

  const firstRow = table.rows[0]
  let newRow = [];
  for (const row in messageBody) {
    newRow[firstRow.indexOf(row)] = messageBody[row];
  }

  const result = await sheet.setRow(numberRow, newRow)
  res.json(result);
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  const value = req.params.value;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].indexOf(value) !== -1) {
      const elem = await sheet.deleteRow(i);
      res.json(elem);
      return
    }
  }
  res.json({
    "response": "success"
  });
}
app.delete('/api/:column/:value', onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`CS193X: Server listening on port ${port}!`);
});

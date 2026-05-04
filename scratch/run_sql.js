const fs = require('fs');
const { getPool } = require('./backend/db.js');

async function run() {
  const p = await getPool();
  const queries = fs.readFileSync('./dummy_data_y_refactor.sql', 'utf8').split('GO');
  for (let q of queries) {
      if (q.trim()) {
          try {
             await p.request().query(q);
          } catch(e) {
             console.error('Error with segment: ', e.message);
          }
      }
  }
  console.log('Dummy and refactor completed.');
  process.exit(0);
}
run();

#!/usr/bin/env node

const http = require('http')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database("dancers.sqlite")
db.run(`CREATE TABLE IF NOT EXISTS dancers (
  id integer PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255),
  x float(10,9),
  y float(10,9)
);`)

const handleRequest = (req, res) => {
  const [path, query] = req.url.split('?')
  if([ 'POST', 'PUT', 'DELETE' ].includes(req.method)) {
      let uid = query && query.match(/uid=([0-9a-f-]+)/)
      if(req.method === 'DELETE') {
        if(uid[1]) {
          const q = db.prepare(
            'DELETE FROM dancers WHERE id=?'
          )
          q.run(uid[1])
          res.writeHead(200).end()
        } else {
          res.writeHead(400).end()
        }
      } else {
        let body = ''
        req.on('data', (data) => {
          body += data
        })
        req.on('end', () => {
          try {
            const params = JSON.parse(body)
            if(!uid && req.method == 'POST') {
              const q = db.prepare(
                `INSERT INTO dancers ( name, x, y ) VALUES (?,?,?);`
              )
              q.run(params.name, params.x, params.y)
              res.writeHead(201).end(uid)
            } else if(uid && req.method == 'PUT') {
              const q = db.prepare(`UPDATE dancers
                                       SET name=?, x=?, y=?
                                     WHERE id=?`)
              q.run(params.name, params.x, params.y, uid[1])
              res.writeHead(200).end()
            } else {
              res.writeHead(400).end()
            }
          } catch {
            res.writeHead(400).end()
          }
        })
      }
  } else {
    db.all(
      "SELECT * FROM dancers;",
      (err, dancers) => {
        // TODO: handle errors
        res.writeHead(200, {
          "Content-Type": "application/json"
        })
        res.write(JSON.stringify(dancers))
        res.end()
      }
    )

  }
}
const server = http.createServer(handleRequest)
server.listen(3000)

#!/usr/bin/env node

const http = require('http')
const fs = require('node:fs');
const { createHmac } = require('node:crypto');

const secret = 'abcdefg';
const hash = (str) =>
  createHmac('sha256', secret).update(str).digest('hex');

let users
fs.readFile('passwd.db', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  users = JSON.parse(data)
});


const dancers = []

const authenticate = (auth = '') => {
  const [ user, pass ] = atob(auth.slice(6)).split(':')
  return !!user && !!pass && users[user] === hash(pass + user)
}

const handleRequest = (req, res) => {
  const [path, query] = req.url.split('?')
  if(req.method == "POST") {
    if(!authenticate(req.headers.authorization)) {
      res.writeHead(401, {
        "WWW-Authenticate": "Basic realm='oo laa'"
      })
      res.end()
    } else {
      let body = ''
      req.on('data', (data) => {
        body += data
      })
      req.on('end', () => {
        try {
          const params = JSON.parse(body)
          dancers.push(params)
          kbye(res)
        } catch {
          res.writeHead(400)
          res.end('Bad. Go away.')
        }
      })
    }
  } else {
    kbye(res)
  }
}
const kbye = (res) => {
  res.writeHead(200, {
    "Content-Type": "application/json"
  })
  res.write(JSON.stringify(dancers))
  res.end()
}
const server = http.createServer(handleRequest)
server.listen(3000)

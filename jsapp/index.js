#!/usr/bin/env node

const http = require('http')
const fs = require('fs/promises')
const { createHmac, randomUUID } = require('node:crypto');

const secret = 'abcdefg';
const hash = (str) =>
  createHmac('sha256', secret).update(str).digest('hex');

let users
fs.readFile('passwd.db')
  .then((data) =>users = JSON.parse(data))
  .catch(console.log)

fs.readFile("dancers.json")
  .then(d => dancers = JSON.parse(d))
  .catch(console.log)

const writeDancers = () =>
  fs.writeFile("dancers.json", JSON.stringify(dancers))

let dancers = []

const authenticate = (auth = '') => {
  const [ user, pass ] = atob(auth.slice(6)).split(':')
  return !!user && !!pass && users[user] === hash(pass + user)
}

const handleRequest = (req, res) => {
  const [path, query] = req.url.split('?')
  if([ 'POST', 'PUT', 'DELETE' ].includes(req.method)) {
    if(!authenticate(req.headers.authorization)) {
      res.writeHead(401, {
        "WWW-Authenticate": "Basic realm='oo laa'"
      })
      res.end()
    } else {
      let uid = query && query.match(/uid=([0-9a-f-]+)/)
      if(req.method === 'DELETE') {
        if(uid[1]) {
          dancers = dancers.filter(
            (d) => d.id != uid[1]
          )
          writeDancers().then(() => res.writeHead(200).end())
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
              const id = randomUUID()
              dancers.push({ ...params, id })
              writeDancers().then(() => res.writeHead(201).end(id))
            } else if(uid && req.method == 'PUT') {
              const i = dancers.findIndex(
                (d) => d.id == uid[1]
              )
              if(i >= 0) {
                dancers[i] = params
                writeDancers().then(() => res.writeHead(200).end())
              } else {
                res.writeHead(404).end()
              }
            } else {
              res.writeHead(400).end()
            }
          } catch {
            res.writeHead(400).end()
          }
        })
      }
    }
  } else {
    res.writeHead(200, {
      "Content-Type": "application/json"
    })
    res.write(JSON.stringify(dancers))
    res.end()
  }
}
const server = http.createServer(handleRequest)
server.listen(3000)

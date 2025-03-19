#!/usr/bin/env node

const http = require('http')
const { createHmac, randomUUID } = require('node:crypto');
const locallydb = require('locallydb')

const secret = 'abcdefg';
const hash = (str) =>
  createHmac('sha256', secret).update(str).digest('hex');

const db = new locallydb('./localdb')
const dancers = db.collection('dancers')

let users = {
  rick: 'acbc32eda67ad028764a1424b85c3f31e35585658275ea1b0014adaffa85d1d3'
}
let admins = [ 'rick' ]

const authenticate = (auth = '') => {
  const [ user, pass ] = atob(auth.slice(6)).split(':')
  if(!!user && !!pass && users[user] === hash(pass + user)) {
    return user
  }
}

const handleRequest = (req, res) => {
  const user = authenticate(req.headers.authorization)
  const [path, query] = req.url.split('?')

  if(path === '/api/logout' || !user && (path === '/api/admin' ||
       ['POST', 'PUT', 'DELETE'].includes(req.method))) {
    res.writeHead(401, {
      "WWW-Authenticate": "Basic realm='oo laa'"
    }).end()
  } else if(path === '/api/admin') {
    let uid = query && query.match(/user=([0-9a-f-]+)/)
    if(!admins.includes(user)) {
      res.writeHead(403).end()
    } else {
      switch(req.method) {
        case 'DELETE':
          if(uid && uid[0] && users[uid[0]]) {
            delete users[uid[1]]
            admins = admins.filter(u => uid == u)
            res.writeHead(200).end()
          } else {
            res.writeHead(400).end()
          }
          break
        case 'POST':
        case 'PUT':
          let body = ''
          req.on('data', (data) => {
            body += data
          })
          req.on('end', () => {
            try {
              const params = JSON.parse(body)
              if(params.user && params.pass) {
                users[params.user] = hash(
                  params.pass + params.user
                )
                admins = admins.filter(u => uid !== u)
                if(params.admin) {
                  admins.push(params.user)
                }
                res.writeHead(200).end()
              }
            } catch {
              res.writeHead(400).end()
            }
          })
          break
        default:
          res.end(JSON.stringify(Object.fromEntries(
            Object.keys(users).map(u => [u, admins.includes(u)])
          )))
      }
    }
  } else {
    handleDancer(req, res, user, query)
  }
}

const handleDancer = (req, res, user, query) => {
  if([ 'POST', 'PUT', 'DELETE' ].includes(req.method)) {
    let uid = query && query.match(/uid=([0-9a-f-]+)/)
    if(req.method === 'DELETE') {
      if(uid && uid[1]) {
        dancers.remove(1 * uid[1])
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
            dancers.insert(params)
            res.writeHead(201).end()
          } else if(uid && req.method == 'PUT') {
            if(dancers.get(1 * uid[1])) {
              dancers.replace(
                1 * uid[1],
                params
              )
              res.writeHead(200).end()
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
  } else {
    res.writeHead(200, {
      "Content-Type": "application/json"
    })
    res.write(JSON.stringify(dancers.items))
    res.end()
  }
}
const server = http.createServer(handleRequest)
server.listen(3000)

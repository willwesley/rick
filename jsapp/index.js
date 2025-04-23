#!/usr/bin/env node

import { WebSocketServer } from 'ws'
import http from 'http'
import { createHmac, randomUUID } from 'node:crypto'

const secret = 'abcdefg';
const hash = (str) =>
  createHmac('sha256', secret).update(str).digest('hex');

let users = {
  rick: 'acbc32eda67ad028764a1424b85c3f31e35585658275ea1b0014adaffa85d1d3'
}
let admins = [ 'rick' ]
let dancers = []

const authenticate = (auth = '') => {
  const [ user, pass ] = atob(auth.slice(6)).split(':')
  if(!!user && !!pass && users[user] === hash(pass + user)) {
    return user
  }
}

let subscribers = []
const sub = (...subscriber) => {
  subscribers.push(subscriber)
}
const notify = () => {
  subscribers.forEach(([req, res]) => {
    res.write('data: ' + JSON.stringify(dancers) + '\n\n')
  })
  wsserver.clients.forEach(ws => ws.send(JSON.stringify(dancers)))
}

const countdown = (res, count) => {
  res.write('data: ' + count + '\n\n')
  if(count > 0) {
    setTimeout(() => countdown(res, count - 1), 1000)
  } else {
    res.end()
  }
}
// countdown(res, 10)

const handleRequest = (req, res) => {
  const user = authenticate(req.headers.authorization)
  const [path, query] = req.url.split('?')

  if(path === '/api/dancers') {
    sub(req, res, user, query)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
  } else if(path === '/logout' || !user && (path === '/api/admin' ||
       ['POST', 'PUT', 'DELETE'].includes(req.method))) {
    res.writeHead(401, {
      "WWW-Authenticate": "Basic realm='oo laa'"
    }).end()
  } else if(path === '/api/admin') {
    handleAdmin(req, res, user, query)
  } else {
    handleDancer(req, res, user, query)
  }
}

const handleAdmin = (req, res, user, query) => {
  let uid = query && query.match(/user=([^&]+)/)
  if(!admins.includes(user)) {
    res.writeHead(403).end()
  } else {
    switch(req.method) {
      case 'DELETE':
        if(uid && uid[1] && users[uid[1]]) {
          const adminsleft = admins.filter(u => uid[1] !== u)
          if(adminsleft.length > 0) {
            delete users[uid[1]]
            admins = adminsleft
            res.writeHead(200).end()
          } else {
            res.writeHead(400).end("Don't shoot yourself in the foot.")
          }
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
            if(params.user) {
              if(params.pass) {
                users[params.user] = hash(
                  params.pass + params.user
                )
              }
              admins = admins.filter(u => uid !== u)
              if(params.admin) {
                admins.push(params.user)
              }
              res.writeHead(200).end()
            }
          } catch (e) {
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
}

const handleDancer = (req, res, user, query) => {
  if([ 'POST', 'PUT', 'DELETE' ].includes(req.method)) {
    let uid = query && query.match(/uid=([0-9a-f-]+)/)
    if(req.method === 'DELETE') {
      if(uid && uid[1]) {
        dancers = dancers.filter(
          (d) => d.id != uid[1]
        )
        res.writeHead(200).end()
        notify()
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
            id = randomUUID()
            dancers.push({ ...params, id })
            res.writeHead(201).end(id)
            notify()
          } else if(uid && req.method == 'PUT') {
            const i = dancers.findIndex(
              (d) => d.id == uid[1]
            )
            if(i >= 0) {
              dancers[i] = params
              res.writeHead(200).end()
              notify()
            } else {
              res.writeHead(404).end()
            }
          } else {
            res.writeHead(400).end()
          }
        } catch(e) {
          console.log(e)
          res.writeHead(400).end()
        }
      })
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
const wsserver = new WebSocketServer({ server })
wsserver.on('connection', (ws) => {
  ws.send(JSON.stringify(dancers))
})
server.listen(3000)

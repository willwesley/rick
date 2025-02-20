#!/usr/bin/env node

const http = require('http')

const dancers = []

const handleRequest = (req, res) => {
  const [path, query] = req.url.split('?')
  if(req.method == "POST") {
    let body = ''
    req.on('data', (data) => {
      body += data
    })
    req.on('end', () => {
      const params = Object.fromEntries(body.split('&').map(
        (param) => param.split('=')
      ))
      dancers.push(params)
      kbye(res)
    })
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

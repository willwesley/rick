#!/usr/bin/env node

const http = require('http')

const handleRequest = (req, res) => {
  res.write("Golly.")
  res.end()
}
const server = http.createServer(handleRequest)
server.listen(3000)

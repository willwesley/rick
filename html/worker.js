postMessage("howdy from the web worker")
onmessage = (e) => {
  console.log('looking for ' + e.data)
  for(let i = 0; i < 1e8; i++) {
    if(i == e.data) {
      postMessage('found it')
      return
    }
  }
  postMessage('not there, bro')
}

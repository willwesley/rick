const render = dancers => {
  document.querySelectorAll('img')
    .forEach(
      n => document.body.removeChild(n)
    )
  dancers.forEach((dancer) => {
    const im = document.createElement('img')
    im.src = dancer.name + '.gif'
    im.style.top = `calc(${dancer.y}vh - 226px)`
    im.style.left = `calc(${dancer.x}vw - 203px)`
    im.addEventListener('click',
      (ev) => {
        ev.stopPropagation()
        if(ev.shiftKey) {
          fetch(`/api?uid=${dancer.id}`, {
            method: 'DELETE'
          }).then(refreshDancers)
        } else {
          fetch(`/api?uid=${dancer.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...dancer,
              name: document.querySelector('select').value,
            })
          }).then(refreshDancers)
        }
      }
    )
    document.body.append(im)
  })
}

const refreshDancers = () => {
  fetch('/api')
   .then(body => body.json())
   .then(render)
}
refreshDancers()
document.body.addEventListener(
  'click',
  (ev) => {
    const { width, height } = document.body.getBoundingClientRect()
    const x = ev.x / width * 100
    const y = ev.y / height * 100
    const name = document.querySelector('select').value
    fetch('/api', {
      method: 'POST',
      body: JSON.stringify({ name, x, y })
    }).then(refreshDancers)
  }
)
document.querySelector('select').addEventListener(
  'click',
  (ev) => ev.stopPropagation()
)

document.getElementById('logout').addEventListener(
  'click',
  (ev) => {
    ev.stopPropagation()
    fetch('/logout')
  }
)

/* polling */
// setInterval(refreshDancers, 1000)

/* long-polling */
// async function subscribe() {
//   const res = await fetch('/api/dancers')
//   const dancers = await res.json()
//   render(dancers)
//   subscribe()
// }
// subscribe()


const source = new EventSource('/api/dancers')
source.addEventListener('message', ({ data }) => {
  render(JSON.parse(data))
})

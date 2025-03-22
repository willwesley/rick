const refreshDancers = () => {
  document.querySelectorAll('img')
    .forEach(
      n => document.body.removeChild(n)
    )
  fetch('/api')
   .then(body => body.json())
   .then(dancers => {
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
  })
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

const updateUsers = () => {
  const tbody = document.querySelector('tbody')
  tbody.innerHTML = ''
  fetch('/api/admin')
    .then(r => r.json())
    .then(users => Object.entries(users).map(([u, a]) => {
      const row = document.createElement('tr')
      row.innerHTML = `<td>${u}</td>
                       <td><input type="checkbox"${a ? ' checked' : ''} /></td>
                       <td><button>Delete</button></td>`
      row.querySelector('input').addEventListener('change', console.log)
      row.querySelector('button').addEventListener('click', deleteUser(u))
      tbody.appendChild(row)
    }))
}
updateUsers()

const deleteUser = (u) => () => fetch(
    '/api/admin?user=' + u,
  { method: 'DELETE' }
).then(updateUsers)

document.getElementById('adduser').addEventListener(
  'click',
  (ev) => {
    const user = prompt('Username')
    const pass = prompt('Password')
    fetch('/api/admin', {
      method: 'POST',
      body: JSON.stringify({ user, pass })
    }).then(updateUsers)
  }
)

const fs = require("fs");
const { createFolder, fetchUrl } = require("./utils")

module.exports = async (urls) => {
  const playerPages = await Promise.all(urls.map(async item => fetchUrl(item)))
  const playerDetails = playerPages.map(item => {
    const startIndex = item.indexOf('enroll_1')
    const endIndex = item.indexOf('enroll_2')
    const allPlayersData = item.substring(startIndex, endIndex)
    const players = allPlayersData.split('id="player').filter((_, index) => index > 0).map(playerItem => {
      const endIndex = playerItem.indexOf('<')
      const startIndex = playerItem.lastIndexOf('>', endIndex)
      return playerItem.substring(startIndex + 1, endIndex).replaceAll('\n', '').trim()
    })

    const titleStartStr = 'class="event_information">'
    const titleStartIndex = item.indexOf(titleStartStr) + titleStartStr.length
    const titleEndIndex = item.indexOf('<', titleStartIndex)

    const whenStartStr = 'datetime="'
    const whenStartStrLen = whenStartStr.length
    const whenStartIndex = item.indexOf(whenStartStr) + whenStartStrLen
    const whenEndIndex = item.indexOf('"', whenStartIndex)
    return {
      players,
      title: item.substring(titleStartIndex, titleEndIndex),
      when: item.substring(whenStartIndex, whenEndIndex),
    }
  })

  createFolder(`./content/lottery`)

  const currentTime = new Date().toLocaleString('fi-FI', {timeZone: 'Europe/Helsinki' })


  let text = `---
title: Marikan arvontakone
comments: false
---
Arvonta suoritettu ${currentTime}

${playerDetails.map(event => {
    const date = new Date(event.when)
    const team1 = [];
    while (team1.length < event.players.length) {
      const index = Math.floor(Math.random() * (event.players.length - 1));
      team1.push(event.players[index])
      event.players.splice(index, 1)
    }

    return `

## ${date.getDate()}.${date.getMonth() + 1}. ${event.title}

### Tiimi 1: Oranssit
${team1.sort().map(item => `* ${item}`).join('\n')}

### Tiimi 2: Sinkut
${event.players.sort().map(item => `* ${item}`).join('\n')}
`
  }).join('***\n')}
`

  // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
  // dynamically set cron schedule before each event

  fs.writeFileSync(`./content/lottery/index.md`, text)
}

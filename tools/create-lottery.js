const fs = require("fs");
const { createFolder, fetchUrl } = require("./utils")

module.exports = async (urls) => {
  const getRandomTeams = (teamCount, players) => {
    const isEvenDayFactor = new Date().getDate() % 2 === 0 ? 1 : -1
    const availablePlayers = [...players];
    availablePlayers.sort((a, b) => (a < b ? -1 : 1) * isEvenDayFactor);

    const teams = [...new Array(teamCount)].map(() => [])
    let teamIndex = 0;
    while (availablePlayers.length) {
      const index = Math.floor(Math.random() * (availablePlayers.length - 1));
      teams[teamIndex].push(availablePlayers[index])
      availablePlayers.splice(index, 1)
      teamIndex = (teamIndex + 1) % teamCount
    }

    return teams
  };
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
  const firstTime = new Date(playerDetails[0].when)

  let text = `---
title: Marikan arvontakone
comments: false
---
Arvonta suoritettu ${currentTime}

${playerDetails.filter(
  event => (new Date(event.when).getTime() - firstTime.getTime()) / 1000 * 60 * 60 < 24
).map(event => {
    const date = new Date(event.when)
    const twoTeams = getRandomTeams(2, event.players)
    const threeTeams = getRandomTeams(3, event.players)
  
    return `

## ${date.getDate()}.${date.getMonth() + 1}. ${event.title}

### Kahden tiimin jaot

#### Tiimi 1: Orkut
${twoTeams[0].sort().map(item => `* ${item}`).join('\n')}

#### Tiimi 2: Sinkut
${twoTeams[1].sort().map(item => `* ${item}`).join('\n')}

${threeTeams[2].length > 1 ? `
### Kolmen tiimin jaot

#### Tiimi 1: Orkut
${threeTeams[0].sort().map(item => `* ${item}`).join('\n')}

#### Tiimi 2: Sinkut
${threeTeams[1].sort().map(item => `* ${item}`).join('\n')}

#### Tiimi 3: Keltsit
${threeTeams[2].sort().map(item => `* ${item}`).join('\n')}
`: ''}

`
  }).join('***\n')}
`

  // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
  // dynamically set cron schedule before each event

  fs.writeFileSync(`./content/lottery/index.md`, text)
}

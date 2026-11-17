const fs = require("fs");
const crypto = require("crypto");
const { fetchUrl } = require("./utils")

module.exports = async (urls) => {
  const renderTeams = (event) => {
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
  };

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
  if (urls.length === 0) {
    console.log("No upcoming event URLs; leaving the current lottery unchanged.")
    return false
  }

  const playerPages = await Promise.all(urls.map(async item => fetchUrl(item)))
  const playerDetails = playerPages.map((item, index) => {
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
    const parsedWhen = item.substring(whenStartIndex, whenEndIndex);
    return {
      url: urls[index],
      players,
      title: item.substring(titleStartIndex, titleEndIndex).trim(),
      when: parsedWhen.startsWith('2') ? parsedWhen : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  })

  const firstTime = new Date(playerDetails[0].when)
  const relevantEvents = playerDetails.filter(
    event => (new Date(event.when).getTime() - firstTime.getTime()) / (1000 * 60 * 60) < 24
  )
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify(
    relevantEvents.map(event => ({
      url: event.url,
      title: event.title,
      when: event.when,
      players: event.players
        .map(player => player.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fi-FI"))
        .filter(Boolean)
        .sort()
    }))
  )).digest("hex")
  const outputPath = "./content/lottery/index.md"
  if (fs.existsSync(outputPath)) {
    const existingText = fs.readFileSync(outputPath, "utf8")
    const existingFingerprint = existingText.match(/^fingerprint:\s*([a-f0-9]{64})\s*$/m)?.[1]
    if (existingFingerprint === fingerprint) {
      console.log("Lottery event and participants are unchanged.")
      return false
    }
  }

  fs.mkdirSync("./content/lottery", { recursive: true })
  const currentTime = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })
  let text = `---
title: Marikan arvontakone
comments: false
aliases:
  - arvontakone
fingerprint: ${fingerprint}
---
Arvonta suoritettu ${currentTime}

${relevantEvents.map(event => event.title === '' ?
    '## Tapahtuman tiedot ei saatavilla\n\n' :
    renderTeams(event)).join('***\n')}
`

  fs.writeFileSync(outputPath, text)
  return true
}

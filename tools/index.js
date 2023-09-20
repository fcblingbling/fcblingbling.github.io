const fs = require("fs");
const http = require("https");

const fetchMatches = require('./fetch-matches')

const fetchUrl = async (url, path) =>
  new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(path);
    http
      .request(url, function (res) {
        res.pipe(fileStream);
        res.on("end", resolve);
        res.on("error", reject);
      })
      .end();
  });

const parse = async () => {
  const fileName = './events.csv'
  await fetchUrl('https://fcblingbling.nimenhuuto.com/calendar/csv', fileName)

  const zeroPad = (num, places) => String(num).padStart(places, '0')

  const content = fs.readFileSync(fileName).toString()
  const lines = content.split('\n')
  let i = 1;
  let count = 0;
  let text = ''
  while (count < 3 && i < lines.length) {
    const line = lines[i++]
    if (line.includes(',')) {
      const words = line.split(',')

      const date = new Date(`${words[1]}T${words[2]}:00.000Z`)
      if (date.getDate() > 0) {
        count++
        const fmtDate = `${date.toLocaleString('fi-FI', {weekday: 'short'})} ${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()} klo ${date.getUTCHours()}:${zeroPad(date.getUTCMinutes(), 2)}`
        const title = words[0].replace('FC Bling Bling: ', '')
        const location = words[3].replaceAll('"', '')

        text += `* ${fmtDate}${location ? ` *${location}*` : ''}: **${title}**\n`
      }
    }
  }

  const eventsText = text
  text = `![Logo](/img/avatar-icon.png)\n\n`
  text = `${text}\n\n
FC Bling Bling on tamperelainen naisten futisjoukkue. Höntsäämme hyvällä fiiliksellä ja rennolla meiningillä.

Talvikaudella pelaamme futsalia, säbää ja käymme salilla 💪
Kesäkaudella pelaamme naisten kuntopalloa sekä reenaamme omissa höntsyissä ⚽️

Osallistumme erilaisiin tapahtumiin pitkin vuotta, mm:

* [Unelmacup](https://www.palloliitto.fi/kilpailut/turnaukset-ja-lopputurnaukset/unelma-cuppi/)
* [Reiskahöntsyt](https://reiskahontsy.fi/)
* [Villasukkajuoksun SM](https://villasukkajuoksunsm.fi/)

Ota SoMe-kanavamme seurantaan:

* [Facebook](https://www.facebook.com/fcblingbling)
* [Instagram](https://www.instagram.com/fcblingbling)

Lähetä viestiä SoMessa tai [sähköpostilla](mailto:fcblingbling@gmail.com), jos haluat mukaan toimintaan!`


  text = `${text}\n\n## Seuraavat tapahtumat\n\n${eventsText}\n\n`
  text = `${text}\n\n  [Kaikki tapahtumat](https://fcblingbling.nimenhuuto.com/events)`

  fs.writeFileSync('./content/_index.md', text)  

  text = `---
title: Kuntopallo
comments: false
---
  `

  text = `${text}\n\n ${await addMatches()}`
  fs.writeFileSync('./content/series/index.md', text)  

}

const addMatches = async () => {
  const matches = await fetchMatches()

  let text = `### [Taulukko](https://tulospalvelu.palloliitto.fi/category/NH1!lanhl23/group/3/)`

  const printMatch = match => {
    const date = new Date(match.date)
    return `* *${date.toLocaleString('fi-FI', {weekday: 'short'})} ${date.toLocaleDateString('fi-FI')}*: ${match.team_A_name} – ${match.team_B_name} ${match.fs_A ? `**${match.fs_A}–${match.fs_B}**` : ''} `
  }
  const printRow = team => `|${team.current_standing} | ${team.team_name} | ${team.points} |`
  const printEmphasizedRow = team => `| **${team.current_standing}** | **${team.team_name}** | **${team.points}** |`
  
  text += `\n| # | Joukkue | Pisteet |\n`
  text += `|---|---------| ---|\n`
  text += matches.status.map(team => team.team_name === 'FC Bling Bling' ? printEmphasizedRow(team) : printRow(team)).join('\n')
  text += '\n\n### Pelit\n\n'
  text += matches.matches.map(printMatch).join('\n')
  return text
}

parse()

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

  text = `![Logo](/img/avatar-icon.png)\n\n## Seuraavat tapahtumat\n\n${text}`
  text = `${text}\n\n  [Kaikki tapahtumat](https://fcblingbling.nimenhuuto.com/events)`
  text = `${text}\n\n ${await addMatches()}`

  fs.writeFileSync('./content/_index.md', text)  
}

const addMatches = async () => {
  const matches = await fetchMatches()

  let text = `## Kuntopallo\n\n`

  const printMatch = match => 
    `* ${new Date(match.date).toLocaleDateString("fi")} ${match.venue_location_name}: ${match.team_A_name} - ${match.team_B_name} ${match.fs_A ? `**${match.fs_A}–${match.fs_B}**` : ''} `
  const printRow = team => `|${team.current_standing} | ${team.team_name} | ${team.matches_played} | ${team.matches_won} | ${team.matches_tied} | ${team.matches_lost} | ${team.goals_for}–${team.goals_against} | ${team.points} |`
  const printEmphasizedRow = team => `| **${team.current_standing}** | **${team.team_name}** | **${team.matches_played}** | **${team.matches_won}** | **${team.matches_tied}** | **${team.matches_lost}** | **${team.goals_for}–${team.goals_against}** | **${team.points}** |`
  
  text += `\n| # | Joukkue | P | V | T | H | Maalit | Pisteet |\n`
  text += `|---|---------|---|---|---|---|---|---|\n`
  text += matches.status.map(team => team.team_name === 'FC Bling Bling' ? printEmphasizedRow(team) : printRow(team)).join('\n')
  text += '\n\n### Pelikalenteri\n\n'
  text += matches.matches.map(printMatch).join('\n')
  return text
}

parse()

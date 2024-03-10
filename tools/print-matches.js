const fs = require("fs");
const fetchMatches = require('./fetch-matches')
const { createFolder } = require("./utils")

const addMatches = async (competitionId, categoryId, season, seriesName) => {
  const matches = await fetchMatches(competitionId, categoryId)
  if (!matches.length) {
    return ''
  }

  let text = `FC Bling Bling osallistuu kaudella ${season} palloliiton [${seriesName} -sarjaan](https://tulospalvelu.palloliitto.fi/category/${categoryId}!${competitionId}/tables).\n\n
### Taulukko`

  const printMatch = match => {
    const date = new Date(match.date)
    return `* *${date.toLocaleString('fi-FI', {weekday: 'short'})} ${date.toLocaleDateString('fi-FI')}*:\\\n  ${match.team_A_name} – ${match.team_B_name} ${match.fs_A ? `**${match.fs_A}–${match.fs_B}**` : ''} `
  }
  const printRow = team => `|${team.current_standing} | ${team.team_name} | ${team.points} |`
  const printEmphasizedRow = team => `| **${team.current_standing}** | **${team.team_name}** | **${team.points}** |`
  
  text += `\n| # | Joukkue | Pisteet |\n`
  text += `|---|---------| ---|\n`
  text += matches.status.map(team => team.team_name === 'FC Bling Bling' ? printEmphasizedRow(team) : printRow(team)).join('\n')
  text += '\n\n### Pelit\n\n'
  text += matches.matches.map(printMatch).join('\n')
  text += '\n\n### Maalit\n\n'
  text += `\n| Pelaaja | Maalit |\n`
  text += `|---| ---|\n`
  text += matches.goals.map(item => `|${item.name} | ${item.goals} |`).join('\n')
  return text
}

module.exports = async (
  title = 'Kuntopallo',
  competitionId = 'lanhl23',
  categoryId = 'NH1',
  season = '2023',
  seriesName = 'Tampereen kuntopallo',
  shortName = 'series'
) => {
  const matches = await addMatches(competitionId, categoryId, season, seriesName)
  if (!matches) {
    return
  }
  let text = `---
title: ${title}
comments: false
---
  `

  text = `${text}\n\n ${matches}`
  createFolder(`./content/${shortName}`)
  fs.writeFileSync(`./content/${shortName}/index.md`, text)  

}

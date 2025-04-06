const fs = require("fs");
const fetchMatches = require('./fetch-matches')
const { createFolder } = require("./utils")

const addMatches = async (latest, competitionId, categoryId, season, seriesName) => {
  const matches = await fetchMatches(competitionId, categoryId)
  if (!matches.matches) {
    return ''
  }

  let text = `FC Bling Bling ${latest ? 'osallistuu' : 'osallistui'} kaudella ${season} palloliiton [${seriesName} -sarjaan](https://tulospalvelu.palloliitto.fi/category/${categoryId}!${competitionId}/tables).\n\n
### Taulukko`

  const printMatch = match => {
    const date = new Date(match.date)
    return `* *${date.toLocaleString('fi-FI', { weekday: 'short' })} ${date.toLocaleDateString('fi-FI')}*:\\\n  ${match.team_A_name} – ${match.team_B_name} ${match.fs_A ? `**${match.fs_A}–${match.fs_B}**` : ''} `
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
  seasons = [{
    competitionId: 'lanhl23',
    categoryId: 'NH1',
    season: '2023',
    seriesName: 'Tampereen kuntopallo',
    shortName: 'series'
  }]
) => {
  for (season of seasons) {
    if (!season.active) {
      console.log(`Season ${season.season} not active, skipping fetch`)
      continue
    }
    const { latest, competitionId, categoryId, season: seasonName, shortName, seriesName } = season;
    const matches = await addMatches(latest, competitionId, categoryId, seasonName, seriesName)
    if (!matches) {
      break
    }
    let text = `---
title: ${title}
comments: false
layout: single
---

${seasons.map(item => season.competitionId === item.competitionId ?
      item.season :
      `[${item.season}](/${shortName}/${item.latest ? '' : item.season})`).join(' | ')}
`

    text = `${text}\n\n ${matches}`
    if (season.latest) {
      fs.writeFileSync(`./content/${shortName}/_index.md`, text)
    } else {
      fs.writeFileSync(`./content/${shortName}/${seasonName}.md`, text)
    }

  }

}

const fs = require("fs");
const { createFolder } = require("./utils")
const players = require('./tournament.json')


module.exports = () => {

  createFolder(`./content/unelma`)

  const currentTime = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })

  const types = players.reduce((acc, item) => {
    return { ...acc, [item.type]: [...(acc[item.type] || []), item] }
  }, {})

  const team1 = [];
  const team2 = [];
  let round = 1;

  Object.keys(types).forEach(type => {
    while (types[type].length > 0) {
      const index = Math.floor(Math.random() * (types[type].length - 1));
      (round == 1 ? team1 : team2).push(types[type][index])
      types[type].splice(index, 1)
      round = round == 1 ? 2 : 1;
    }
  });

  const text = `---
title: Unelman arvontakone
comments: false
---
Arvonta suoritettu ${currentTime}

## Tiimi 1 (${team1.length} pelaajaa)
${team1.sort((a, b) => a.name > b.name ? 1 : -1).map(item => `* ${item.name} - *${item.type}*`).join('\n')}

## Tiimi 2 (${team2.length} pelaajaa)
${team2.sort((a, b) => a.name > b.name ? 1 : -1).map(item => `* ${item.name} - *${item.type}*`).join('\n')
    }
`

  fs.writeFileSync(`./content/unelma/index.md`, text)
}

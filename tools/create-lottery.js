const fs = require("fs");
const { createFolder, fetchUrl } = require("./utils")

module.exports = async (urls) => {
  const playerPages = await Promise.all(urls.map(async item => fetchUrl(item)))
  const playerDetails = playerPages.map(item => {
    const startIndex = item.indexOf('enroll_1')
    const endIndex = item.indexOf('enroll_2')
    const allPlayersData = item.substring(startIndex, endIndex)
    const players = allPlayersData.split('id="player').filter((_, index) => index > 0).map(playerItem => {
      const endIndex = playerItem.indexOf('</span>')
      const startIndex = playerItem.lastIndexOf('>', endIndex)
      return playerItem.substring(startIndex + 1, endIndex).replaceAll('\n', '').trim()
    })
    return players
  })
  createFolder(`./content/lottery`)
  let text = `---
title: Marikan arvontakone
comments: false
---
`
    // console.log(playerDetails)
    // list event info and teams
    // https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
    // dynamically set cron schedule before each event

    fs.writeFileSync(`./content/lottery/index.md`, text)  
}

const { fetchUrl } = require("./utils")
const createLottery = require("./create-lottery")

const updateLottery = async () => {
  const content = await fetchUrl("https://fcblingbling.nimenhuuto.com/calendar/csv")
  const lines = content.split("\n")
  const eventURLs = []
  let count = 0

  for (const line of lines.slice(1)) {
    if (count >= 3) break
    if (!line.includes(",")) continue

    const words = line.split(",")
    const date = new Date(`${words[1]}T${words[2]}:00.000Z`)
    if (!(date.getDate() > 0)) continue

    count++
    const url = words[words.length - 1].replaceAll('"', "").trim()
    if (url.startsWith("https://fcblingbling.nimenhuuto.com/events")) {
      eventURLs.push(url.split(" ")[0])
    }
  }

  await createLottery(eventURLs)
}

updateLottery().catch(error => {
  console.error(error)
  process.exitCode = 1
})

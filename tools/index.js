const fs = require("fs");
const http = require("https");

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

  text = `![Logo](/img/avatar-icon.png)\n\n**Seuraavat tapahtumat:**\n\n${text}`
  text = `${text}\n\n  [Kaikki tapahtumat](https://fcblingbling.nimenhuuto.com/events)`

  fs.writeFileSync('./content/_index.md', text)  
}

parse()

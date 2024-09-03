const fs = require("fs");
const http = require("https");

const printMatches = require('./print-matches')
const parseFeed = require("./parser/feed");
const createLottery = require("./create-lottery");
const createTournamentTeams = require("./create-tournament");
const { createFolder } = require("./utils")

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
  const eventURLs = []
  const nextEventAlarm = { day: 0, hour: 0, minutes: 0 };
  while (count < 3 && i < lines.length) {
    const line = lines[i++]
    if (line.includes(',')) {
      const words = line.split(',')
      const date = new Date(`${words[1]}T${words[2]}:00.000Z`)
      if (date.getDate() > 0) {
        if (count === 0) {
          // TODO: clean up this ugly mess to handle time zone diff
          const timeZoneDiff = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki', timeZoneName: 'short' }).split('+')[1];
          const utcAlarmDate = new Date(date.getTime() - 30 * 1000 * 60)
          const alarmDate = new Date(utcAlarmDate.toISOString().replace("Z", "+0" + timeZoneDiff + ":00"))
          nextEventAlarm.day = alarmDate.getUTCDay()
          nextEventAlarm.hour = alarmDate.getUTCHours()
          nextEventAlarm.minutes = alarmDate.getUTCMinutes()
        }
        count++
        const fmtDate = `${date.toLocaleString('fi-FI', { weekday: 'short' })} ${date.getUTCDate()}.${date.getUTCMonth() + 1}.${date.getUTCFullYear()} klo ${date.getUTCHours()}:${zeroPad(date.getUTCMinutes(), 2)}`
        const title = words[0].replace('FC Bling Bling: ', '')
        const locationStr = (words.length > 7 ? words[4] : words[3]).replaceAll('"', '').trim()
        const location = locationStr.includes(" - ") ? locationStr.split(" - ")[1] : locationStr

        text += `* ${fmtDate}${location ? ` *${location}*` : ''}: **${title}**\n`

        const url = words[words.length - 1].replaceAll('"', '')
        if (url.startsWith('https://fcblingbling.nimenhuuto.com/events')) {
          eventURLs.push(url.split(' ')[0])
        }
      }
    }
  }

  const workflowContent = fs.readFileSync('tools/deploy.yml').toString();
  const extraWorkflowContent = workflowContent.replaceAll(
    "0 0 * * *", `${nextEventAlarm.minutes} ${nextEventAlarm.hour} * * ${nextEventAlarm.day}`)
  fs.writeFileSync('.github/workflows/extra.yml', extraWorkflowContent)

  const eventsText = text
  text = `![Logo](/img/avatar-icon.png)\n\n`
  text = `${text}\n\n
FC Bling Bling on tamperelainen naisten futisjoukkue. Höntsäämme hyvällä fiiliksellä ja rennolla meiningillä.

Talvikaudella harjoittelemme futsalia ja säbää sekä käymme salilla 💪 Kaudella 2023-24 osallistumme myös [Harrastefutsal-sarjaan](/futsal). Kesäkaudella pelaamme [naisten kuntopalloa](/series) ja reenaamme omissa höntsyissä ⚽️ Osallistumme erilaisiin tapahtumiin pitkin vuotta, mm. [Unelmacuppiin](https://www.palloliitto.fi/kilpailut/turnaukset-ja-lopputurnaukset/unelma-cuppi/), [Reiskahöntsyihin](https://reiskahontsy.fi/) ja 
[Villasukkajuoksun SM-kisoihin](https://villasukkajuoksunsm.fi/).

Seuraa meitä [Facebookissa](https://www.facebook.com/fcblingbling) tai [Instagramissa](https://www.instagram.com/fcblingbling)! Lähetä viestiä tai [sähköpostia](mailto:fcblingbling@gmail.com), jos haluat mukaan toimintaan.`


  text = `${text}\n\n## Seuraavat tapahtumat\n\n${eventsText}\n\n`
  text = `${text}\n\n  [Kaikki tapahtumat](https://fcblingbling.nimenhuuto.com/events)`

  fs.writeFileSync('./content/_index.md', text)

  await printMatches('Kuntopallo', [{
    latest: true,
    active: true,
    competitionId: 'lanhl24',
    categoryId: 'NH1',
    season: '2024',
    seriesName: 'Tampereen kuntopallo',
    shortName: 'series'
  },
  {
    latest: false,
    active: false,
    competitionId: 'lanhl23',
    categoryId: 'NH1',
    season: '2023',
    seriesName: 'Tampereen kuntopallo',
    shortName: 'series'
  }])
  await printMatches('Futsal', [{
    latest: true,
    active: false,
    competitionId: 'lanfshl2324',
    categoryId: 'FNH1',
    season: '2023-24',
    seriesName: 'Tampereen harrastefutsal',
    shortName: 'futsal'
  }])

  await createLottery(eventURLs)

  // if (!fs.existsSync('./content/unelma')) {
  //   createTournamentTeams();
  // }
}

const copyLastPost = () => {
  createFolder('./content/post')
  const year = fs.readdirSync('./content/feed').sort((a, b) => a < b ? 1 : -1).find(item => parseInt(item, 10) > 0)
  if (year) {
    const lastPost = fs.readdirSync(`./content/feed/${year}`).sort((a, b) => a < b ? 1 : -1)[0]
    const target = `./content/post/latest.md`
    fs.copyFileSync(`./content/feed/${year}/${lastPost}`, target)
    const contents = fs.readFileSync(target).toString()
    fs.writeFileSync(target, `${contents}\n\n***\n\n[**Lisää uutisia ➡️**](./feed)`)
  }
}

parse()
parseFeed();
copyLastPost();

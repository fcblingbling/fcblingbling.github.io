const fs = require("fs");
const http = require("https");

const fetchUrl = async (url) =>
  new Promise((resolve, reject) => {
    let result = ''
    http
      .request(url, { headers: { accept: 'json/df8e84j9xtdz269euy3h'}}, function (res) {
        res.on('data', data => result += data);
        res.on('end', () => resolve(result));
        res.on('error', reject);
      })
      .end();
  });

module.exports = async () => {
  const res = await fetchUrl('https://spl.torneopal.net/taso/rest/getMatches?competition_id=lanhl23&category_id=NH1&tpid=-187858559')
  const matches = JSON.parse(res).matches
  if (!matches.length) {
    console.log(`Encountered error fetching matches ${res}`)
    process.exit(1)
  }

  const categoryRes = await fetchUrl("https://spl.torneopal.net/taso/rest/getCategory?competition_id=lanhl23&category_id=NH1&tpid=807056810")
  const category = JSON.parse(categoryRes).category
  if (!category.groups.length) {
    console.log(`Encountered error fetching matches ${categoryRes}`)
    process.exit(1)
  }
  const group = category.groups.find(item => item.teams.find(team => team.team_name === 'FC Bling Bling'))
  const teams = group.teams.sort((a, b) => a.current_standing > b.current_standing ? 1 : -1)
  return {
    matches: matches.filter(item => item.team_A_name === 'FC Bling Bling' || item.team_B_name === 'FC Bling Bling'),
    status: teams
  }
}

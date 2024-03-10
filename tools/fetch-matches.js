const exec = require('child_process').exec;

const fetchUrl = async (url) =>
  new Promise((resolve, reject) => {
    // TODO: node client is blocked by CF
    const command =   `curl '${url}' -H 'accept: json/df8e84j9xtdz269euy3h' -H 'user-agent: script'`
    exec(command, (error, stdout, stderr) => {
      //console.log(stderr)
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  });

module.exports = async (competitionId = 'lanhl23', categoryId = 'NH1') => {
  const res = await fetchUrl(`https://spl.torneopal.net/taso/rest/getMatches?competition_id=${competitionId}&category_id=${categoryId}&tpid=-187858559`)
  let matches = []
  try {
    matches = JSON.parse(res).matches.filter(item => item.team_A_name === 'FC Bling Bling' || item.team_B_name === 'FC Bling Bling')
  } catch {
    console.log("Failed to fetch data:", res)
    return {}
  }
  if (!matches.length) {
    console.log(`Encountered error fetching matches ${res}`)
    process.exit(1)
  }

  const categoryRes = await fetchUrl(`https://spl.torneopal.net/taso/rest/getCategory?competition_id=${competitionId}&category_id=${categoryId}&tpid=807056810`)
  const category = JSON.parse(categoryRes).category
  if (!category.groups.length) {
    console.log(`Encountered error fetching matches ${categoryRes}`)
    process.exit(1)
  }
  const group = category.groups.find(item => item.teams.find(team => team.team_name === 'FC Bling Bling'))
  const teams = group.teams.sort((a, b) => a.current_standing > b.current_standing ? 1 : -1)
  const teamId = group.teams.find(item => item.team_name == 'FC Bling Bling').team_id
  const matchDetails = await Promise.all(matches.map(async item => fetchUrl(`https://spl.torneopal.net/taso/rest/getMatch?match_id=${item.match_id}`)))
  const goalMakers = await matchDetails.reduce((result, item) => {
    
    JSON.parse(item).match.events
      .filter(matchItem => matchItem.team_id === teamId && matchItem.code === "maali")
      .map(matchItem => {
        result[matchItem.player_name] = (result[matchItem.player_name] ? result[matchItem.player_name] : 0 ) + 1
      })
    return result
  }, {})
  const goals = Object.keys(goalMakers).map(item => {
    const name = item.startsWith("(") ? item : (
      () => {
        const parts = item.split(" ")
        return `${parts[1]} ${parts[0].charAt(0)}.`
      }
    )()
    
    return { name, goals: goalMakers[item]}
  }).sort((a, b) => a.goals === b.goals ? (a.name < b.name ? -1 : 1) : (a.goals < b.goals ? 1 : -1))
  return {
    matches: matches,
    status: teams,
    goals
  }
}

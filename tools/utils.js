const fs = require("fs");
const http = require("https");

module.exports = {
  createFolder:  target =>  {
    if (fs.existsSync(target)) {
      fs.rmSync(target, {
          recursive: true,
          force: true
      })
    }
    fs.mkdirSync(target)
  },

  fetchUrl: async (url) =>
  new Promise((resolve, reject) => {
    let result = ''
    http
      .request(url, { headers: {}}, function (res) {
        res.on('data', data => result += data);
        res.on('end', () => resolve(result));
        res.on('error', reject);
      })
      .end();
  })

}

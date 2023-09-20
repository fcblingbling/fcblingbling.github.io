const fs = require('fs')

const parseFeed = () => {
    const basePath = './data/fb';
    const target = './content/feed'

    if (fs.existsSync(target)) {
        fs.rmSync(target, {
            recursive: true,
            force: true
        })
    }
    fs.mkdirSync(target)

    const filePaths = fs.readdirSync(basePath)
        .reduce((result, dir) => [
            ...result,
            ...fs.readdirSync(`${basePath}/${dir}`)
                .reduce((mResult, mDir) => [
                    ...mResult,
                    ...fs.readdirSync(`${basePath}/${dir}/${mDir}`)
                        .filter(filename => filename.endsWith(".json"))
                        .map(filename => `${basePath}/${dir}/${mDir}/${filename}`)
                ], [])
        ], [])

    const posts = filePaths.reduce((result, path) => {
        const json = JSON.parse(fs.readFileSync(path))
            .filter(({ message }) => message)
            .map(item => ({ filePath: path, ...item }))
        return [...result, ...json]
    }, [])

    posts.forEach((item => {
        const timestamp = new Date(item.created_time)
        const year = timestamp.getFullYear()
        const content = `
---
date: ${item.created_time}
featured_image: "/feed/${year}/${item.id}.jpg"
disable_share: true
---
    
${item.message || ""}
    
{{< figure src = "/feed/${year}/${item.id}.jpg" >}}

`
        const folder = `${target}/${year}`
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
        }

        const lastIndex = item.filePath.lastIndexOf('/')
        const picPath = `${item.filePath.substring(0, lastIndex)}/${item.id}.jpg`
        if (fs.existsSync(picPath)) {
            fs.writeFileSync(`${folder}/${item.created_time}.md`, content)
            fs.copyFileSync(picPath, `${folder}/${item.id}.jpg`)
        }
    }))

    const indexContent = `
---
title: "Uutiset"
omit_header_text: true
---
    `
    fs.writeFileSync(`${target}/_index.md`, indexContent)
}

module.exports = parseFeed

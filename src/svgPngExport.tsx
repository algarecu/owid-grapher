import * as fs from 'fs-extra'
import * as sharp from 'sharp'
import * as path from 'path'

declare var global: any
global.window = { location: { search: "" }}
global.App = { isEditor: false }
global.Global = { rootUrl: "https://ourworldindata.org/grapher" }

require('module-alias').addAliases({
    'react'  : 'preact-compat',
    'react-dom': 'preact-compat'
})

import ChartConfig, { ChartConfigProps } from '../js/charts/ChartConfig'

export async function bakeMediaCard(outDir: string, jsonConfig: ChartConfigProps, vardata: string) {
    const chart = new ChartConfig(jsonConfig, { isMediaCard: true })
    chart.vardata.receiveData(vardata)
    const outPath = path.join(outDir, chart.props.slug as string)
    return Promise.all([
//        fs.writeFile(`${outPath}.svg`, chart.staticSVG).then(_ => console.log(`${outPath}.svg`)),
        sharp(new Buffer(chart.staticSVG), { density: 144 }).png().resize(chart.idealBounds.width, chart.idealBounds.height).flatten().background('#ffffff').toFile(`${outPath}.png`)
    ])
}

export async function chartToSvg(jsonConfig: ChartConfigProps, vardata: string, opts: { queryStr?: string } = {}) {
    const chart = new ChartConfig(jsonConfig, opts)
    chart.isLocalExport = true
    chart.vardata.receiveData(vardata)
    return { svg: chart.staticSVG, width: chart.idealBounds.width, height: chart.idealBounds.height }
}
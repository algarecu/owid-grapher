import * as _ from 'lodash'
import * as parseUrl from 'url-parse'
import {createConnection, DatabaseConnection} from './database'
import {DB_NAME} from './settings'
import * as parseArgs from 'minimist'
const argv = parseArgs(process.argv.slice(2))
import { getVariableData } from './models/Variable'
import * as fs from 'fs-extra'
import * as md5 from 'md5'
import * as filenamify from 'filenamify'

declare var global: any
global.window = { location: { search: "" }}
global.App = { isEditor: false }
global.Global = { rootUrl: "https://ourworldindata.org/grapher" }

require('module-alias').addAliases({
    'react'  : 'preact-compat',
    'react-dom': 'preact-compat'
})

import ChartConfig, { ChartConfigProps } from '../js/charts/ChartConfig'


async function getChartsBySlug(db: DatabaseConnection) {
    const chartsBySlug: Map<string, ChartConfigProps> = new Map()
    const chartsById = new Map()

    const chartsQuery = db.query(`SELECT * FROM charts`)
    const redirectQuery = db.query(`SELECT slug, chart_id FROM chart_slug_redirects`)

    for (const row of await chartsQuery) {
        const chart = JSON.parse(row.config)
        chart.id = row.id
        chartsBySlug.set(row.slug, chart)
        chartsById.set(row.id, chart)
    }

    for (const row of await redirectQuery) {
        chartsBySlug.set(row.slug, chartsById.get(row.chart_id))
    }

    return chartsBySlug
}

interface ImageMeta {

}

async function main(chartUrls: string[], outDir: string) {
    const db = createConnection({ database: DB_NAME })
    try {
        const imagesByUrl: {[key: string]: ImageMeta} = {}
        await fs.mkdirp(outDir)
        const chartsBySlug = await getChartsBySlug(db)

        for (const urlStr of chartUrls) {
            const url = parseUrl(urlStr)
            const slug = _.last(url.pathname.split('/')) as string
            const jsonConfig = chartsBySlug.get(slug)
            if (jsonConfig) {
                const queryStr = url.query as any
                const outPath = `${outDir}/${slug}${queryStr ? "_"+filenamify(queryStr, { replacement: '_' }) : ""}_v${jsonConfig.version}.svg`

                const chart = new ChartConfig(jsonConfig, { queryStr: queryStr })
                chart.isLocalExport = true

                const {width, height} = chart.idealBounds

                if (!fs.existsSync(outPath)) {
                    const variableIds = _.uniq(chart.dimensions.map(d => d.variableId))
                    const vardata = await getVariableData(variableIds, db)
                    chart.vardata.receiveData(vardata)
                    fs.writeFile(outPath, chart.staticSVG)
                }
            }
        }

        console.log(JSON.stringify(imagesByUrl))
    } finally {
        db.end()
    }
}

main(argv._.slice(0, -1), argv._[argv._.length-1])
/*

Add a google translation to each subtitle, in case the english was changed
dramatically

*/
import { config as dotenv } from "dotenv"
import fs from "fs/promises"
import { v2 } from "@google-cloud/translate"
import convertHanziToPinyin from "hanzi-to-pinyin"
import PromisePool from "@supercharge/promise-pool"

const Translate = v2.Translate
dotenv()

if (!process.env.GOOGLE_PROJECT_ID)
  throw new Error(
    "Need to set GOOGLE_PROJECT_ID and any other required auth setup for @google-cloud/translate"
  )

const translate = new Translate({ projectId: process.env.GOOGLE_PROJECT_ID })

let pinyinCount = 0,
  translationCount = 0

async function updateSubtitle(subtitle: any) {
  for (const cnKey of ["zh-twFemaleVariant", "zh-twMaleVariant"]) {
    if (!subtitle[cnKey]) continue
    if (!subtitle[`${cnKey}Translation`]) {
      const [translation] = await translate.translate(subtitle[cnKey], "en")
      subtitle[`${cnKey}Translation`] = translation
      translationCount += 1
    }
    if (!subtitle[`${cnKey}Pinyin`]) {
      pinyinCount += 1
      subtitle[`${cnKey}Pinyin`] = (
        await convertHanziToPinyin(subtitle[cnKey], {
          segmented: true,
        })
      )
        .join("  ")
        .replace(/  /g, " ")
    }
  }
}

export default async function main() {
  const subtitles = JSON.parse(
    (
      await fs
        .readFile("global-subtitles-with-translations.json")
        .catch((e) => fs.readFile("global-subtitles.json"))
    ).toString()
  )

  const subtitleList: Array<any> = Object.values(subtitles)

  const chunkSize = 1000
  for (let i = 0; i < subtitleList.length; i += chunkSize) {
    await new PromisePool()
      .withConcurrency(50)
      .for(subtitleList.slice(i, i + chunkSize))
      .process(updateSubtitle)
    await fs.writeFile(
      "global-subtitles-with-translations.json",
      JSON.stringify(subtitles, null, "  ")
    )
    process.stdout.write(
      `translations ${i}/${subtitleList.length} (py=${pinyinCount} tr=${translationCount})\r`
    )
  }
}

if (!module.parent) {
  main()
}

/*

Create a global subtitles.json file that maps every string id to it's
translation.

*/

import chalk from "chalk"
import fs from "fs/promises"
import glob from "glob-promise"
import { Opaque } from "type-fest"
import JSONbig from "json-bigint"
import slash from "slash"

// All the translation strings are corrupted in the .json.json files because of
// (I think) some bug in Wolvenkit
// This is how you fix it in python:
// str(bytes(corrupted_string, encoding="raw_unicode_escape"), encoding="utf-8")
// In javascript we have to do something like this:
export function fixCorruptedString(a?: CorruptString): string | undefined {
  if (!a) return a
  return Buffer.from(a, "binary").toString()
}

type CorruptString = Opaque<string, "corrupt">
type FilePath = Opaque<string, "filepath">
// these string ids are a "big number" that can't be held
// as a regular number in nodejs
type BigNumber = Opaque<number, "big">

type JSONResourceFile = {
  Extension: ".json"
  Chunks: {
    [someNumber: string]:
      | {
          Type: "JsonResource"
        }
      | {
          Type: "localizationPersistenceSubtitleEntries"
          Properties: {
            entries: [
              {
                stringId: BigNumber
                femaleVariant?: CorruptString
                maleVariant?: CorruptString
              }
            ]
          }
        }
      | {
          Type: "locVoiceoverMap"
          Properties: {
            entries: Array<{
              stringId: BigNumber
              femaleResPath: FilePath
              maleResPath: FilePath
            }>
          }
        }
  }
}

export default async function main() {
  const files = await glob("Mod/**/*.json.json")
  const globalSubtitles: any = {}

  let filesParsed = 0
  for (const fi of files) {
    filesParsed += 1
    if (filesParsed % 200 === 0) {
      console.log(`Parsed ${filesParsed}/${files.length} files`)
    }
    let fileContent: JSONResourceFile
    try {
      fileContent = JSONbig.parse((await fs.readFile(fi)).toString())
    } catch (e: any) {
      console.error(`Error parsing ${fi}: ${e.toString()}`)
      continue
    }

    const language = fi.split("localization/")[1].split("/")[0]

    if (!language) {
      console.log(`bailing on ${fi} because I couldn't find a language`)
      continue
    }

    for (const chunk of Object.values(fileContent.Chunks)) {
      if (chunk.Type === "JsonResource") {
        continue
      }
      if (chunk.Type === "localizationPersistenceSubtitleEntries") {
        if (!chunk.Properties) continue
        for (const { stringId, femaleVariant, maleVariant } of chunk.Properties
          .entries) {
          globalSubtitles[stringId.toString()] ||= {}
          const entry = globalSubtitles[stringId.toString()]
          entry[`${language}MaleVariant`] = fixCorruptedString(
            maleVariant as any
          )
          entry[`${language}FemaleVariant`] = fixCorruptedString(
            femaleVariant as any
          )
        }
      } else if (chunk.Type === "locVoiceoverMap") {
        if (!chunk.Properties) continue
        for (const [
          i,
          { stringId, femaleResPath, maleResPath },
        ] of Object.entries(chunk.Properties.entries)) {
          if (!stringId) {
            console.log(
              chalk.gray(
                `bailing on ${fi} chunk Property ${JSON.stringify(
                  chunk.Properties.entries[i as any]
                )} because I couldn't find a stringId`
              )
            )
            continue
          }
          globalSubtitles[stringId.toString()] ||= {}
          const entry = globalSubtitles[stringId.toString()]
          entry[`${language}MaleResPath`] = slash(maleResPath)
          entry[`${language}FemaleResPath`] = slash(femaleResPath)
        }
      }
    }
  }

  await fs.writeFile(
    "global-subtitles.json",
    JSON.stringify(globalSubtitles, null, "  ")
  )
}

if (!module.parent) {
  main()
}

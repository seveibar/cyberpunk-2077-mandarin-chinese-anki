import fs from "fs/promises"
import grade, { getDefinitions } from "hsk-grader"
import hash from "hash-it"

// Here's an example anki card in the notes.txt format
// The front and back are separated by a \t
// [sound:aldecaldo_bard_q114_f_1c3c95871d3c5000.mp3]<br><br>你好，世界<br>Nǐ hǎo, shìjiè	Hello World

type Subtitle = {
  "en-usFemaleVariant": string
  "en-usMaleVariant": string

  "zh-twFemaleVariant": string
  "zh-twFemaleVariantTranslation": string
  "zh-twFemaleVariantPinyin": string
  "zh-twMaleVariant": string
  "zh-twMaleVariantTraditional": string
  "zh-twMaleVariantPinyin": string

  "zh-cnFemaleResPath": string
  "zh-cnFemaleVariant": string
  "zh-cnFemaleVariantTranslation": string
  "zh-cnFemaleVariantTraditional": string
  "zh-cnFemaleVariantPinyin": string
  "zh-cnFemaleVariantPinyin2": string
  "zh-cnMaleResPath": string
  "zh-cnMaleVariant": string
  "zh-cnMaleVariantTranslation": string
  "zh-cnMaleVariantTraditional": string
  "zh-cnMaleVariantPinyin": string
  "zh-cnMaleVariantPinyin2": string
}

async function getLine(
  sub: Subtitle,
  sex: "Male" | "Female"
): Promise<{
  line: string
  lineWithoutPinyin: string
  difficulty: number
} | null> {
  const otherSex = sex === "Male" ? "Female" : "Male"
  const keyPhrase =
    sub[`zh-cn${sex}VariantTraditional`] ||
    sub[`zh-cn${otherSex}VariantTraditional`]
  if (!keyPhrase) return null
  const pinyin =
    sub[`zh-cn${sex}VariantPinyin2`] || sub[`zh-cn${otherSex}VariantPinyin2`]
  const gameTranslation =
    sub[`en-us${sex}Variant`] || sub[`en-us${otherSex}Variant`]
  const googleTranslation =
    sub[`zh-cn${sex}VariantTranslation`] ||
    sub[`zh-cn${otherSex}VariantTranslation`]
  const soundFileName = sub[`zh-cn${sex}ResPath`]
    .split("/")
    .slice(-1)[0]
    .replace(".wem", ".mp3")
  const fullLine = [
    `[sound:${soundFileName}]` + `<br><br><span style="font-size: 1.5em">`,
    keyPhrase + "</span><br><br>",
    `<span class="pinyin" style="opacity: 0.75;">${pinyin}</span>`,
    `\t`,
    gameTranslation + "<br><br>",
    googleTranslation + "<br><br><br>",
    `<table>` +
      (await getDefinitions(keyPhrase))
        .filter((d) => d.hsk !== 1)
        .map(
          (d) =>
            `<tr><td style="font-size: 2em">${d.traditional}</td><td>${
              d.pinyin
            }</td><td style="text-align:left; padding-left: 1em; width: 50%; font-size:0.5em;">${d.translations.join(
              ","
            )}</td></tr>`
        )
        .join("") +
      "</table>",
  ]
  return {
    line: fullLine.join(""),
    lineWithoutPinyin: fullLine.slice(0, 2).concat(fullLine.slice(3)).join(""),
    difficulty:
      (await grade(keyPhrase || "")) +
      0.5 * (hash(soundFileName + "seed1") / Number.MAX_SAFE_INTEGER),
  }
}

export default async function main() {
  const subtitles: Array<Subtitle> = Object.values(
    JSON.parse(
      (await fs.readFile("global-subtitles-with-translations.json")).toString()
    )
  )

  let lines: Array<{
    line: string | null
    lineWithoutPinyin: string | null
    difficulty: number
  }> = []

  let subtitlesConverted = 0
  for (const sub of subtitles) {
    subtitlesConverted += 1
    if (subtitlesConverted % 100 === 0) {
      console.log(`${subtitlesConverted}/${subtitles.length}`)
    }
    if (sub["zh-cnFemaleResPath"]) {
      lines.push((await getLine(sub, "Female")) as any)
    }
    if (
      sub["zh-cnMaleResPath"] &&
      sub["zh-cnMaleResPath"] !== sub["zh-cnFemaleResPath"]
    ) {
      lines.push((await getLine(sub, "Male")) as any)
    }
  }
  lines = lines.filter(Boolean)

  lines.sort((a, b) => a.difficulty - b.difficulty)

  for (const withPinyin of [false, true]) {
    await fs.writeFile(
      `cyberpunk-anki-deck-full${withPinyin ? "-pinyin" : ""}.txt`,
      lines.map((l) => (withPinyin ? l.line : l.lineWithoutPinyin)).join("\n")
    )
    for (const [start, size] of [
      [0, 100],
      [100, 1000],
      [1100, 10000],
    ]) {
      await fs.writeFile(
        `cyberpunk-anki-deck-${size}${withPinyin ? "-pinyin" : ""}.txt`,
        lines
          .slice(start, start + size)
          .map((l) => (withPinyin ? l.line : l.lineWithoutPinyin))
          .join("\n")
      )
    }
  }
}

if (!module.parent) {
  main()
}

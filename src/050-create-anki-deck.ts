import fs from "fs/promises"
import grade from "hsk-grader"
import hash from "hash-it"

// Here's an example anki card in the notes.txt format
// The front and back are separated by a \t
// [sound:aldecaldo_bard_q114_f_1c3c95871d3c5000.mp3]<br><br>你好，世界<br>Nǐ hǎo, shìjiè	Hello World

type Subtitle = {
  "en-usFemaleVariant": string
  "zh-cnFemaleResPath": string
  "zh-twFemaleVariant": string
  "zh-twFemaleVariantTranslation": string
  "zh-twFemaleVariantPinyin": string
  "en-usMaleVariant": string
  "zh-cnMaleResPath": string
  "zh-twMaleVariant": string
  "zh-twMaleVariantTranslation": string
  "zh-twMaleVariantPinyin": string
}

async function getLine(
  sub: Subtitle,
  sex: "Male" | "Female"
): Promise<{ line: string; difficulty: number } | null> {
  const otherSex = sex === "Male" ? "Female" : "Male"
  const keyPhrase = sub[`zh-tw${sex}Variant`] || sub[`zh-tw${otherSex}Variant`]
  if (!keyPhrase) return null
  const pinyin =
    sub[`zh-tw${sex}VariantPinyin`] || sub[`zh-tw${otherSex}VariantPinyin`]
  const gameTranslation =
    sub[`en-us${sex}Variant`] || sub[`en-us${otherSex}Variant`]
  const googleTranslation =
    sub[`zh-tw${sex}VariantTranslation`] ||
    sub[`zh-tw${otherSex}VariantTranslation`]
  const soundFileName = sub[`zh-cn${sex}ResPath`]
    .split("/")
    .slice(-1)[0]
    .replace(".wem", ".mp3")
  return {
    line: [
      `[sound:${soundFileName}]` + "<br><br>",
      keyPhrase + "<br><br>",
      pinyin,
      `\t`,
      gameTranslation + "<br><br>",
      googleTranslation,
    ].join(""),
    difficulty:
      (await grade(keyPhrase || "")) +
      2 * (hash(soundFileName) / Number.MAX_SAFE_INTEGER),
  }
}

export default async function main() {
  const subtitles: Array<Subtitle> = Object.values(
    JSON.parse(
      (await fs.readFile("global-subtitles-with-translations.json")).toString()
    )
  )

  let lines: Array<{ line: string | null; difficulty: number }> = []

  for (const sub of subtitles) {
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

  await fs.writeFile(
    "cyberpunk-anki-deck.txt",
    lines.map(({ line }) => line).join("\n")
  )
}

if (!module.parent) {
  main()
}

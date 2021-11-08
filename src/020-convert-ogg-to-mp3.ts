import { spawn } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import { config as dotenv } from "dotenv"
import chalk from "chalk"

dotenv()

export default async function main() {
  const oggFileNames = await fs.readdir("ogg_files")

  let filesProcessed = 0
  for (const oggFileName of oggFileNames) {
    filesProcessed += 1
    console.log(
      chalk.yellow(`ogg file ${filesProcessed}/${oggFileNames.length}`)
    )
    const mp3FileName = oggFileName.replace(/\.ogg$/, ".mp3")
    const oggPath = path.resolve("ogg_files", oggFileName)
    const mp3Path = path.resolve("mp3_files", oggFileName)

    const proc = spawn(`ffmpeg`, ["-i", oggPath, "-y", mp3Path], {
      stdio: "inherit",
      shell: true,
    })
    await new Promise((resolve) => proc.on("exit", resolve))
  }
  console.log(chalk.green("finished converting ogg to mp3!"))
}

if (!module.parent) {
  main()
}

import { spawn } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import { config as dotenv } from "dotenv"
import chalk from "chalk"
import PromisePool from "@supercharge/promise-pool"

dotenv()

export default async function main() {
  const oggFileNames = await fs.readdir("ogg_files")
  let filesProcessed = 0

  await new PromisePool()
    .withConcurrency(16)
    .for(oggFileNames)
    .process(async (oggFileName) => {
      filesProcessed += 1
      console.log(
        chalk.yellow(`ogg2mp3 file ${filesProcessed}/${oggFileNames.length}`)
      )
      const mp3FileName = oggFileName.replace(/\.ogg$/, ".mp3")
      const oggPath = path.resolve("ogg_files", oggFileName)
      const mp3Path = path.resolve("mp3_files", mp3FileName)

      const proc = spawn(`ffmpeg`, ["-i", oggPath, "-y", mp3Path], {
        // stdio: "inherit",
        shell: true,
      })
      await new Promise((resolve) => proc.on("exit", resolve))
    })
  console.log(chalk.green("finished converting ogg to mp3!"))
}

if (!module.parent) {
  main()
}

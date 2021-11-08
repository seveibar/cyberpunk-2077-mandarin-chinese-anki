import { spawn } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import { config as dotenv } from "dotenv"
import chalk from "chalk"

dotenv()

export default async function main() {
  if (!process.env.WW2OGG_PATH) {
    throw new Error(
      "WW2OGG_PATH not set, clone https://github.com/hcs64/ww2ogg and set this path to the cloned directory after building (you should have the ww2ogg executable in that dir)"
    )
  }

  const wemFileNames = await fs.readdir("wem_files")

  let filesProcessed = 0
  for (const wemFileName of wemFileNames) {
    filesProcessed += 1
    console.log(
      chalk.yellow(`wem file ${filesProcessed}/${wemFileNames.length}`)
    )
    const oggFileName = wemFileName.replace(/\.wem$/, ".ogg")
    const wemPath = path.resolve("wem_files", wemFileName)

    const proc = spawn(
      `./ww2ogg`,
      ["--pcb", "./packed_codebooks_aoTuV_603.bin", wemPath],
      {
        cwd: process.env.WW2OGG_PATH,
        stdio: "inherit",
        shell: true,
      }
    )
    await new Promise((resolve) => proc.on("exit", resolve))
    await fs.rename(
      wemPath.replace(/\.wem$/, ".ogg"),
      path.resolve("ogg_files", oggFileName)
    )
  }
  console.log(chalk.green("finished converting wem to ogg!"))
}

if (!module.parent) {
  main()
}

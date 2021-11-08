# Cyberpunk 2077 Chinese Anki

Language learning is difficult without immersion- you have to memorize thousands
of words and phrases without any real purpose or objective. **This project will
help you learn enough Chinese to immerse yourself in Chinese Cyberpunk 2077**.

The dialog and voice acting within Cyberpunk 2077 is dynamic, exciting and but
there are some differences between dialog on Cyberpunk and dialog in an ordinary
introductory course. For example, instead of learning to say:

> - Is this bus going to Hong Kong?
> - I'd like to order rice and fish.
> - Hello, my name is Paul.

You might learn to say...

> - Tell her to lay low somewhere. They'll be lookin' for your family and friends... You understand?
> - Can't we dissolve it in acid? Flush it down the can...?
> - Got a rat problem on my block. Who doesn't, right? Thing is, these rats are human-sized.

The audio and subtitles files from Cyberpunk 2077 are used to generate an Anki
deck. Anki is a spaced repitition system for learning Chinese, it's one of the most
widely used tools for memorizing vocabulary and phrases for learning Chinese.

There are about 70,000 audio files in the full anki deck.

> I used Traditional Chinese for this deck, but you can regenerate it for simplifed
> chinese using the same steps. The audio is the same for both written forms.

## Development

### Initial Files (from Cyberpunk 2077)

> NOTE: Most of these programs for this part are only Windows compatible

1. Install [WolvenKit, a cyberpunk mod editor](https://github.com/WolvenKit/Wolvenkit)

Cyberpunk is shipped with a bunch of archive files which make up a directory
structure. After opening WolvenKit, you can use the asset browser to add the
needed files to the project. Right click and add the following folders:

- base/localization/en-us
- base/localization/zh-tw
- base/localization/zh-cn

2. Convert all the JSON files to real JSON

For some reason, the json files aren't actually json. They're this weird
format called CR2W. We'll use a WolvenKit command line tool to convert the
CR2W json files to real json files. The new real json files will automatically
be named `*.json.json`

Execute the command `cp77tools cr2w -s -p ./Mod` (where Mod is inside your WolvenKit
project).

3. Copy the `Mod` folder into this project directory

### Preprocessing Audio

> If you haven't already, install npm, node, and yarn, then install this project
> with `yarn install`

1. Copy the `wem` files from the `Mod/base/localization/zh-cn/vo` into `wem_files`
2. Convert the `wem` files into `ogg` files using the `wem2ogg` with `yarn run esr src/010-convert-web-to-ogg.ts`
3. Convert the `ogg` files into `mp3` files using the `ffmpeg` with `yarn run esr src/020-convert-ogg-to-mp3.ts`

### Create Cards

1. Run `yarn run esr

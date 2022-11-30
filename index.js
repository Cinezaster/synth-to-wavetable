import easymidi from 'easymidi'
import convertToNote from 'midi-note'
import AudioRecorder from 'node-audiorecorder'
import fs from 'fs-extra'
import path from 'node:path'
import WaveDecoder from 'wav-decoder'
import asciichart from 'asciichart'

const timeout = ms => new Promise((resolve) => setTimeout(resolve, ms));

function findClosestIndex(arr, element) {
  let from = 0, until = arr.length - 1
  while (true) {
    const cursor = Math.floor((from + until) / 2);
    if (cursor === from) {
      const diff1 = element - arr[from];
      const diff2 = arr[until] - element;
      return diff1 <= diff2 ? from : until;
    }

    const found = arr[cursor];
    if (found === element) return cursor;

    if (found > element) {
      until = cursor;
    } else if (found < element) {
      from = cursor;
    }
  }
}

const recordWaveForm = async () => {
  const outputs = easymidi.getOutputs();
  const midiOutput = new easymidi.Output(outputs[0]);
  await fs.ensureDir(outputDir)
  // loop from C2 to C5 or from 36 to 72
  for (let index = 36; index < 72 + 1; index++) {
    const midiNote = index
    const note = convertToNote(midiNote)
    const freq = 440.0 * Math.pow(2.0, (midiNote - 69) * 0.08333333)
    const recOptions = {
      program: `rec`, // Which program to use, either `arecord`, `rec`, or `sox`.
      bits: 16,
      channels: 1, // Channel count.
      encoding: `signed-integer`, // Encoding type. (only for `rec` and `sox`)
      rate: freq * 256, // Sample rate.
      type: `wav`, // Format type.
      keepSilence: true
    }
    const fileName = path.join(
      outputDir,
      `${type}-${midiNote}-${note}.wav`
    )
    const fileStream = fs.createWriteStream(fileName, { encoding: 'binary' });
    console.log(midiNote, note, freq, fileName)
    midiOutput.send('noteon', {
      note: midiNote,
      velocity: 90,
      channel: 1
    })
    await timeout(400)
    const audioRecorder = new AudioRecorder(recOptions, console)
    audioRecorder.on('error', function () {
      console.warn('Recording error.');
    });
    audioRecorder.start().stream().pipe(fileStream);
    await timeout(800)
    audioRecorder.stop()
    midiOutput.send('noteoff', {
      note: midiNote,
      velocity: 90,
      channel: 1
    })
    await timeout(400)
  }
}

const transformWaveToData = async () => {
  const files = await fs.readdir(outputDir);
  console.log(files);
  const outputData = []
  for (const file of files) {
    const fileName = file.split('.')[0]
    if (file.split('.')[1] === 'wav') {
      const filePath = path.join(
        outputDir,
        file
      )
      const buffer = await fs.readFile(filePath)
      const wave = await WaveDecoder.decode(buffer)
      const channel1 = wave.channelData[0]
      let waveform = []
      for (let index = 0; index < channel1.length; index++) {
        const element = channel1[index];
        const nextElement = channel1[index + 1];

        if (element < 0 && nextElement >= 0) {
          waveform = channel1.slice(index + 1, index + 1 + (256 * 2))
          break;
        }

      }
      waveform = waveform.map(w => w * 100000)
      const shift = Math.max(...waveform) - 32766
      waveform = waveform.map(w => w - shift) // shift
      const map = (value, in_min, in_max, out_min, out_max) => (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
      const maxValue = Math.max(...waveform)
      const minValue = Math.min(...waveform)
      waveform = waveform.map(w => map(w, minValue, maxValue, -32766, 32766))
      for (let index = 0; index < waveform.length; index++) {
        const element = waveform[index];
        const nextElement = waveform[index + 1];

        if (element < 0 && nextElement >= 0) {
          waveform = waveform.slice(index + 1, index + 1 + 256)
          break;
        }
      }


      const shiftedWaveForms = [waveform]
      for (let index = 0; index < waveform.length - 10; index++) {
        const element = waveform[index];
        const nextElement = waveform[index + 1];

        if (element < 0 && nextElement >= 0) {
          shiftedWaveForms.push([...waveform.slice(index + 1), ...waveform.slice(0, index + 1)])
        }
      }
      if (shiftedWaveForms.length > 1) {

        let version = 0
        for (const shiftedWaveForm of shiftedWaveForms) {
          version++
          switch (fileName) {
            case "square-46-Bb2":
              waveform = shiftedWaveForms[1]
              break;
            case "square-45-A2":
              waveform = shiftedWaveForms[1]
              break;
            case "square-37-Db2":
              waveform = shiftedWaveForms[1]
              break;
            case "square-38-D2":
              waveform = shiftedWaveForms[1]
              break;
            case "square-39-Eb2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-45-A2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-44-Ab2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-43-G2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-42-Gb2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-41-F2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-40-E2":
              waveform = shiftedWaveForms[1]
              break;
            case "triangle-37-Db2":
              waveform = shiftedWaveForms[1]
              break;

            case "triangle-36-C2":
              waveform = shiftedWaveForms[1]
              break;
            default:
              break;
          }
        }
      }

      console.log(asciichart.plot(waveform, { height: 10 }))
      waveform = waveform.map(w => parseInt(w))
      outputData.push(waveform)
    }
  }
  const output = `int16_t ${type} [${files.length}][256] = {${outputData.map(note => '{' + note.join(', ') + '}').join(',\n ')}}`
  const filePath = path.join(
    outputDir,
    type + '.h'
  )
  await fs.writeFile(filePath, output, { encoding: "utf8" })

}


const type = 'square'
const outputDir = './waveOutput/' + type

// recordWaveForm()
transformWaveToData()






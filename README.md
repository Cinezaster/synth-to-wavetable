# synth-to-wavetable

record wavetables from a synth via midi

This project I created to record waves from a Behringer TD-3 to be usde as wavetables in a digital synth I'm building with a teensy 4.1.

This script plays a note via midi to the TD-3. It next captures the sound at 256 * the frequency I'm playing at, so I have 256 samples per wave. Since I have no control on the duration of the recording I'm recoding 0.8 of a second.
I record a wave for every note since the waveform differces during to the whole range of notes.

In the next step I'm cutting a wave out of the recording and normalise it to unsigned 16bit value.
To select one wave I used a zero crossing to find the start of the wave and took 256 samples out of it.
This created some issues because some waveforms in the lower range have multiple zero crossings in their wave. Since I couldn't come up with a good solution to shift them correctly I added some manual code.

(This code is work in progress)

import fs from 'fs'
import path from 'path'

function sampleMarsElevation(buffer, lat, lonEast) {
  const normLon = ((lonEast % 360) + 360) % 360
  const line = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const sample = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (line * 1440 + sample) * 2
  return buffer.readInt16BE(offset)
}

function sampleMoonHeight(buffer, lat, lonEast) {
  const normLon = ((lonEast % 360) + 360) % 360
  const line = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const sample = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (line * 1440 + sample) * 2
  const dn = buffer.readInt16LE(offset)
  return dn * 0.5
}

const marsBuffer = fs.readFileSync('raw-data/mars/megt90n000cb.img')
const moonBuffer = fs.readFileSync('raw-data/moon/ldem_4.img')

console.log('Mars buffer bytes:', marsBuffer.length)
console.log('Moon buffer bytes:', moonBuffer.length)

console.log('Mars Jezero Crater elevation:', sampleMarsElevation(marsBuffer, 18.38, 77.58), 'meters')
console.log('Mars Gale Crater elevation:', sampleMarsElevation(marsBuffer, -5.36, 137.86), 'meters')
console.log('Mars Olympus Mons summit elevation:', sampleMarsElevation(marsBuffer, 18.65, 226.2), 'meters')
console.log('Mars Hellas Planitia floor elevation:', sampleMarsElevation(marsBuffer, -42.4, 70.5), 'meters')

console.log('Moon Shackleton Crater height:', sampleMoonHeight(moonBuffer, -89.9, 0.0), 'meters')
console.log('Moon Apollo 11 Landing Site height:', sampleMoonHeight(moonBuffer, 0.674, 23.47), 'meters')
console.log('Moon Tycho Crater height:', sampleMoonHeight(moonBuffer, -43.31, 348.64), 'meters')

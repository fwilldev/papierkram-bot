import { readFile, writeFile } from 'fs/promises'
const fileName = 'history.json'

const history = () => {
  let historyObject = {}

  readFile(new URL(`./${fileName}`, import.meta.url), { encoding: 'utf8' })
    .then(value => (historyObject = JSON.parse(value)))
    .catch(err => {})

  return {
    get: key => historyObject[key],
    set: (key, value) => (historyObject[key] = value),
    save: () => {
      writeFile(fileName, JSON.stringify(historyObject, null, 4)).then(() => {})
    }
  }
}

export default history()

#!/usr/bin/env node

import puppeteer from 'puppeteer'
import moment from 'moment'
import history from './history.js'
import regionCodes from './regioncodes.js'
import { isHoliday } from 'feiertagejs'
import keychain from 'keychain'
import { confirm, select, password } from '@inquirer/prompts'

const isValidUrl = urlString => {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // validate fragment locator
  return !!urlPattern.test(urlString)
}

const getPassword = email =>
  new Promise((resolve, reject) => {
    keychain.getPassword(
      {
        account: email,
        service: 'Papierkram Credentials',
        type: 'internet'
      },
      (err, pw) => {
        if (err) {
          reject(err)
        } else if (pw) {
          resolve(pw)
        } else {
          resolve(null)
        }
      }
    )
  })

;(async () => {
  moment.locale('de')

  let firstDate = moment(process.argv[2], 'DD/MM/YYYY') // start date
  let lastDate = moment(process.argv[3], 'DD/MM/YYYY') // end date
  let firstTime = process.argv[4] // start time
  let lastTime = process.argv[5] // end time

  const subject = process.argv[6] // Subject you want to book
  history.set('subject', subject)
  const email = process.argv[7]
  history.set('email', email)

  let url = process.argv[8]
  const useMonth = process.argv[9].toLowerCase() === 'y'
  const dryRun = process.argv[10] === 'true' // if true the bot will not book any times

  const isMacOs = process.platform === 'darwin'
  let passwordValue
  let isNewPassword = true
  if (isMacOs) {
    const useKeychain = await confirm({
      message: 'Passwort aus Schlüsselbund verwenden? ',
      default: false
    })
    if (useKeychain) {
      try {
        passwordValue = await getPassword(email)
        isNewPassword = false
      } catch (_) {
        console.log(
          'Kein Passwort für Papierkram-Bot im Schlüsselbund gefunden. '
        )
        isNewPassword = true
      }
    }
  }

  if (!passwordValue) {
    passwordValue = await password({ message: 'Passwort: ', mask: true })
    isNewPassword = true
  }

  if (isMacOs && isNewPassword) {
    const saveInKeychain = await confirm({
      message: 'Passwort im Schlüsselbund speichern? ',
      default: false
    })
    if (saveInKeychain) {
      keychain.setPassword({
        account: email,
        service: 'Papierkram Credentials',
        type: 'internet',
        password: passwordValue
      })
    }
  }

  if (dryRun) {
    console.log('Testlauf aktiviert. Es werden keine Zeiten gebucht.')
  }

  if (!isValidUrl(url) && !url.includes('papierkram.de')) {
    console.error('Eingabe URL ist nicht valide: ', url)
    return
  }

  history.set('url', url)
  history.save()

  let regionChoices = []
  for (const [regionName, regionKey] of Object.entries(regionCodes)) {
    regionChoices.push({ name: regionKey, value: regionName })
  }

  const selectedRegion = await select({
    message:
      'Von welchem Bundesland sollen die Feiertage berücksichtigt werden? ',
    choices: regionChoices,
    pageSize: 26
  })

  if (useMonth) {
    const currentDate = moment()
    firstDate = currentDate.clone().startOf('month')
    lastDate = currentDate.clone().endOf('month')
    firstTime = '08:00'
    lastTime = '16:00'

    console.log(`Buchung für ${currentDate.format('MMMM YYYY')}`)
    console.log(`Erster Tag: ${firstDate.format('DD.MM.YYYY')} ${firstTime}`)
    console.log(`Letzter Tag: ${lastDate.format('DD.MM.YYYY')} ${lastTime}`)
  }

  const firstDateForUrl = firstDate.format('YYYY-MM-DD')
  const lastDateForUrl = lastDate.format('YYYY-MM-DD')

  let result = [moment({ ...firstDate })]

  while (lastDate.date() !== firstDate.date()) {
    firstDate.add(1, 'day')
    result.push(moment({ ...firstDate }))
  }

  const validDates = result
    .filter(day => {
      const isSaturday = day.toDate().getDay() === 6
      const isSunday = day.toDate().getDay() === 0
      return (
        !isSaturday && !isSunday && !isHoliday(day.toDate(), selectedRegion)
      )
    })
    .map(day => moment(day).format('DD.MM.YYYY'))

  if (!validDates.length) {
    console.log(
      'In der angegebenen Zeitspanne wurden keine validen Tage gefunden.'
    )
    return
  }

  console.log('Auf folgende Tage wird gebucht: ', validDates)
  const browser = await puppeteer.launch({
    headless: true
  })
  const page = await browser.newPage()

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  })
  const correctUrl = url.trim().endsWith('/') ? url : url + '/'
  console.log(`Logge ein in: ${correctUrl}`)
  await page.goto(`${correctUrl}login`, { waitUntil: 'networkidle2' })
  await page.type('#user_new_email', email, { delay: 100 })
  await page.type('#user_new_password', passwordValue, { delay: 100 })
  await page.click('input[name="commit"]', { delay: 500 })
  await page.waitForSelector('.user-name')
  await page.waitForSelector('i.icon-pk-tracker')
  console.log(`Login erfolgreich für User: ${email}`)
  await page.goto(
    correctUrl + 'zeiterfassung/buchungen?b=&show_new_form=true',
    { waitUntil: 'networkidle2' }
  )
  let selectedProject = ''
  let projectElement
  for (const day of validDates) {
    await page.waitForSelector(
      '#s2id_tracker_time_entry_new_complete_project_id'
    )
    await page.click('#s2id_tracker_time_entry_new_complete_project_id')
    await new Promise(resolve => setTimeout(resolve, 1000))
    let elementHandle = await page.$$(
      '.select2-results-dept-1 .select2-result-label'
    )

    if (selectedProject.length === 0) {
      console.log('Verfügbare Projekte: ')

      let projectChoices = []
      for (const el of elementHandle) {
        const val = await page.evaluate(e => e.textContent, el)
        projectChoices.push({ name: val, value: val })
      }

      selectedProject = await select({
        message: 'Auf welches Projekt soll gebucht werden? ',
        choices: projectChoices,
        pageSize: 26
      })
    }

    for (const e of elementHandle) {
      const elementText = await page.evaluate(el => el.textContent, e)
      if (elementText === selectedProject) {
        console.log('Buche auf Projekt: ', selectedProject)
        projectElement = e
      }
    }

    if (projectElement) {
      await projectElement.click({ delay: 200 })
    } else {
      await browser.close()
      throw new Error('Projekt nicht gefunden: ' + selectedProject)
    }
    if (!dryRun) {
      await page.type('#tracker_time_entry_new_complete_task_name', subject, {
        delay: 100
      })

      await page.click('#tracker_time_entry_new_entry_date_f', {
        clickCount: 3
      })
      await page.type('#tracker_time_entry_new_entry_date_f', day, {
        delay: 100
      })
      await page.click('#tracker_time_entry_new_started_at_time', {
        clickCount: 3
      })
      await page.type('#tracker_time_entry_new_started_at_time', firstTime, {
        delay: 100
      })

      await page.click('#tracker_time_entry_new_ended_at_time', {
        clickCount: 3
      })
      await page.type('#tracker_time_entry_new_ended_at_time', lastTime, {
        delay: 100
      })

      await page.click('input[name="commit"]', { delay: 500 })
      console.log('Zeit gebucht für: ', day)
      await page.waitForTimeout(1000)
      await page.goto(
        correctUrl + 'zeiterfassung/buchungen?b=&show_new_form=true',
        { waitUntil: 'networkidle2' }
      )
    }
  }

  const controlUrl =
    correctUrl +
    'zeiterfassung/buchungen?t=' +
    firstDateForUrl +
    '..' +
    lastDateForUrl
  await page.waitForSelector('.logout')
  await page.click('.logout', { delay: 1000 })
  console.log('Logout erfolgreich. Bitte Zeiten kontrollieren: ' + controlUrl)
  await browser.close()
})()

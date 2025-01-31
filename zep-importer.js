import puppeteer from 'puppeteer';
import moment from 'moment';
import { isHoliday } from 'feiertagejs';
import keychain from 'keychain';
import { confirm, input, password, select } from '@inquirer/prompts';
import regionCodes from './regioncodes.js';
import history from './history.js';
import fs from 'fs';
import csv from 'csv-parser';
import chalk from 'chalk';
const isValidUrl = (urlString) => {
	const urlPattern = new RegExp(
		'^(https?:\\/\\/)?' + // validate protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
		'(\\#[-a-z\\d_]*)?$',
		'i'
	); // validate fragment locator
	return !!urlPattern.test(urlString);
};


const splashScreen = `
··················································································
:                                                                                :
: ███████╗███████╗██████╗        ██████╗███████╗██╗   ██╗    ██████╗             :
: ╚══███╔╝██╔════╝██╔══██╗      ██╔════╝██╔════╝██║   ██║    ╚════██╗            :
:   ███╔╝ █████╗  ██████╔╝█████╗██║     ███████╗██║   ██║     █████╔╝            :
:  ███╔╝  ██╔══╝  ██╔═══╝ ╚════╝██║     ╚════██║╚██╗ ██╔╝    ██╔═══╝             :
: ███████╗███████╗██║           ╚██████╗███████║ ╚████╔╝     ███████╗            :
: ╚══════╝╚══════╝╚═╝            ╚═════╝╚══════╝  ╚═══╝      ╚══════╝            :
: ██████╗  █████╗ ██████╗ ██╗███████╗██████╗ ██╗  ██╗██████╗  █████╗ ███╗   ███╗ :
: ██╔══██╗██╔══██╗██╔══██╗██║██╔════╝██╔══██╗██║ ██╔╝██╔══██╗██╔══██╗████╗ ████║ :
: ██████╔╝███████║██████╔╝██║█████╗  ██████╔╝█████╔╝ ██████╔╝███████║██╔████╔██║ :
: ██╔═══╝ ██╔══██║██╔═══╝ ██║██╔══╝  ██╔══██╗██╔═██╗ ██╔══██╗██╔══██║██║╚██╔╝██║ :
: ██║     ██║  ██║██║     ██║███████╗██║  ██║██║  ██╗██║  ██║██║  ██║██║ ╚═╝ ██║ :
: ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ :
:                                                                                :
··················································································
`
const getPassword = (email) =>
	new Promise((resolve, reject) => {
		keychain.getPassword(
			{
				account: email,
				service: 'Papierkram Credentials',
				type: 'internet',
			},
			(err, pw) => {
				if (err) reject(err);
				else resolve(pw || null);
			}
		);
	});
console.log(chalk.blue(splashScreen));
console.log(chalk.bgBlue.black('Importiert eine in ZEP erstellte CSV in Papierkram'));

(async () => {
	moment.locale('de');

	let email, url, description;
	const historyFile = 'history.json';
	let useHistory = false;
	if (fs.existsSync(historyFile)) {
		const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
		console.log('----------- Historie -----------');
		console.log('Zuletzt verwendet:');
		console.log('Papierkram-URL:', historyData.url || 'Nicht vorhanden');
		console.log('E-Mail Adresse:', historyData.email || 'Nicht vorhanden');
		console.log('Tätigkeitsbeschreibung:', historyData.subject || 'Nicht vorhanden');
		console.log('------------------------------');

		useHistory = await confirm({ message: 'Werte aus der Historie verwenden?', default: true });
		if (useHistory) {
			email = historyData.email;
			url = historyData.url;
			description = historyData.subject;
		}
	}

	if (!useHistory) {
		url = await input({ message: 'Papierkram URL:' });
		description = await input({ message: 'Tätigkeitsbeschreibung: (zB Entwicklung)' });
		email = await input({ message: 'E-Mail für Papierkram:' });
		fs.writeFileSync(historyFile, JSON.stringify({ url, email, subject: description }, null, 2));
	}
	history.set('email', email);
	history.set('url', url);
	history.set('subject', description);
	history.save();

	if (!isValidUrl(url) && !url.includes('papierkram.de')) {
		console.error('Eingabe URL ist nicht valide: ', url);
		return;
	}


	const csvFilePath = await input({ message: 'Pfad zur CSV-Datei:' });
	if (!fs.existsSync(csvFilePath)) {
		console.error('CSV file not found:', csvFilePath);
		process.exit(1);
	}
//	const dryRun = await confirm({ message: 'Testlauf (keine Buchungen vornehmen)?', default: false });

	const isMacOs = process.platform === 'darwin';
	let pw;
	let isNewPassword = true;
	if (isMacOs) {
		const useKeychain = await confirm({ message: 'Passwort aus Schlüsselbund verwenden? ', default: false });
		if (useKeychain) {
			try {
				pw = await getPassword(email);
				isNewPassword = false;
			} catch (_) {
				console.log('Kein Passwort im Schlüsselbund gefunden.');
			}
		}
	}
	if (!pw) {
		pw = await password({ message: 'Passwort: ', mask: true });
		isNewPassword = true;
	}
	if (isMacOs && isNewPassword) {
		const saveInKeychain = await confirm({ message: 'Passwort im Schlüsselbund speichern? ', default: false });
		if (saveInKeychain) {
			keychain.setPassword({
				account: email,
				service: 'Papierkram Credentials',
				type: 'internet',
				password: pw,
			});
		}
	}

	const selectedRegion = await select({
		message: 'Von welchem Bundesland sollen die Feiertage berücksichtigt werden?',
		choices: Object.entries(regionCodes).map(([name, key]) => ({ name: key, value: name })),
		pageSize: 26,
	});

	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.setViewport({
		width: 1920,
		height: 1080,
		deviceScaleFactor: 1,
		isMobile: false
	});

	let tryAgain = true;
	const correctUrl = url.trim().endsWith('/') ? url : `${url}/`;
	while (tryAgain) {
		console.log('Login Versuch...');
		await page.goto(`${correctUrl}/login`, { waitUntil: 'networkidle2' });
		await page.type('#user_email', email, { delay: 100 });
		await page.type('#user_password', pw, { delay: 100 });
		await page.click('input[name="commit"]', { delay: 500 });
		try {
			console.log('Prüfe, ob eine 2FA erforderlich ist.');
			await page.waitForSelector('#user_email_code_attempt', {timeout: 5000});
			console.log('2FA erforderlich. Prüfe deine E-Mails und gebe den Code ein.');
			const code = await input({message: '2FA Code: '});
			await page.type('#user_email_code_attempt', code, {delay: 100});
			await page.click('input[name="commit"]', {delay: 500});
			try {
				await page.waitForSelector('.user-name', {timeout: 5000});
				await page.waitForSelector('i.icon-pk-tracker', {timeout: 5000});
				tryAgain = false;
			} catch (error) {
				try {
					await page.waitForSelector('.toast-container', {timeout: 5000});
				} catch (error) {
					console.log('Fehler beim Login - 2FA Code falsch oder abgelaufen.');
					tryAgain = await confirm({
						message: 'Nochmal versuchen? ',
						default: false,
					});
					if (!tryAgain) {
						await browser.close();
						return;
					}
				}
			}
		} catch (error) {
			try {
				console.log('2FA Maske nicht gefunden. Prüfe ob Login erfolgreich war...')
				await page.waitForSelector('.user-name')
				await page.waitForSelector('i.icon-pk-tracker')
				tryAgain = false;
			} catch (e) {
				console.log('Anscheinend war der Login Versuch nicht erfolgreich.');
				tryAgain = await confirm({
					message: 'Nochmal versuchen? ',
					default: false,
				});
				if (!tryAgain) {
					console.log('Script abgebrochen. Fehler: ' + e);
					return;
				}
			}
		}
	}
	console.log(`Login erfolgreich für User: ${email}`);

	const bookings = [];

	fs.createReadStream(csvFilePath)
	.pipe(csv({ separator: ';' }))
	.on('data', (row) => {
		const date = moment(row['Datum'], 'DD.MM.YYYY');
		if (!date.isValid()) return;
		const startTime = row['von'];
		const endTime = row['bis'];
		if (!startTime || !endTime) return;

		if (![6, 0].includes(date.toDate().getDay()) && !isHoliday(date.toDate(), selectedRegion)) {
			bookings.push({ date: date.format('DD.MM.YYYY'), startTime, endTime });
		}
	})
	.on('end', async () => {
		if (!bookings.length) {
			console.log('Keine gültigen Einträge gefunden.');
			await browser.close();
			return;
		}
		let selectedProject = '';
		let projectElement;
		await page.goto(`${correctUrl}/zeiterfassung/buchungen?b=&show_new_form=true`, { waitUntil: 'networkidle2' });
		for (const { date, startTime, endTime } of bookings) {
			await page.waitForSelector('#s2id_tracker_time_entry_new_complete_project_id');
			await page.click('#s2id_tracker_time_entry_new_complete_project_id');
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (!selectedProject) {
				const elements = await page.$$('.select2-results-dept-1 .select2-result-label');
				const projects = await Promise.all(elements.map(el => page.evaluate(e => e.textContent, el)));
				selectedProject = await select({ message: 'Projekt auswählen:', choices: projects.map(p => ({ name: p, value: p })), pageSize: 26 });
			}

			const projectElements = await page.$$('.select2-results-dept-1 .select2-result-label');
			for (const e of projectElements) {
				const elementText = await page.evaluate((el) => el.textContent, e);
				if (elementText === selectedProject) {
					console.log('Buche auf Projekt: ', selectedProject);
					projectElement = e;
					break;
				}
			}
			if (projectElement) {
				await projectElement.click({ delay: 200 });
			} else {
				await browser.close();
				throw new Error(`Projekt nicht gefunden: ${selectedProject}`);
			}
			console.log(`Buche ${date} - ${startTime} - ${endTime} - ${selectedProject}`);
			await page.type('#tracker_time_entry_new_complete_task_name', description, {
				delay: 100,
			});

			await page.click('#tracker_time_entry_entry_date_f', {
				clickCount: 3,
			});
			await page.type('#tracker_time_entry_entry_date_f', date, {
				delay: 100,
			});
			await page.click('#tracker_time_entry_started_at_time', {
				clickCount: 3,
			});
			await page.type('#tracker_time_entry_started_at_time', startTime, {
				delay: 100,
			});

			await page.click('#tracker_time_entry_ended_at_time', {
				clickCount: 3,
			});
			await page.type('#tracker_time_entry_ended_at_time', endTime, {
				delay: 100,
			});
			await page.click('#tracker_time_entry_duration', {
				clickCount: 1
			});

			await page.click('input[name="commit"]', { delay: 500 });
			console.log(`Gebucht: ${date} von ${startTime} bis ${endTime}`);
			await page.waitForTimeout(1000);
			await page.goto(`${correctUrl}/zeiterfassung/buchungen?b=&show_new_form=true`, { waitUntil: 'networkidle2' });
		}
		console.log('Alle Buchungen abgeschlossen! Logge aus...');
		const controlUrl = `${correctUrl}zeiterfassung/buchungen?t=${bookings[0].date}..${bookings[bookings.length - 1].date}`;
		await page.waitForSelector('.logout');
		await page.click('.logout', { delay: 1000 });
		console.log(`Logout erfolgreich. Bitte Zeiten kontrollieren: ${controlUrl}`);
		await browser.close();
	});
})();

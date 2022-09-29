const puppeteer = require('puppeteer');
const moment = require('moment');

(async () => {
    moment.locale('de')
    const firstDate = moment(process.argv[2], 'DD/MM/YYYY'); // start date
    const lastDate = moment(process.argv[3], 'DD/MM/YYYY'); // end date
    const firstTime = process.argv[4]; // start time
    const lastTime = process.argv[5]; // end time
    const subject = process.argv[6]; // Subject you want to book
    const email = process.argv[7];
    const password = process.argv[8];
    const url = process.argv[9];
    var result = [moment({...firstDate})];

    while(lastDate.date() !== firstDate.date()){
        firstDate.add(1, 'day');
        result.push(moment({ ...firstDate }));
    }

    var dates = [];
    result.map(day => {
        if (!(day.getDay() % 6)) {
            const dateString = moment(day, "DD/MM/YYYY").format("DD/MM/YYYY");
            dates.push(dateString.split("/").join("."));
        } else {
            console.log(day.getDay() + 'ist ein Wochenend-Datum, also wird hier nicht gebucht');
        }
    })

    console.log('Tage, die gebucht werden: ', dates);

    const browser = await puppeteer.launch({
        headless: true});
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });
    await page.goto(url + '/login', {waitUntil: "networkidle2"});
    await page.type('#user_new_email', email, {delay: 100});
    await page.type('#user_new_password', password, {delay: 100});
    await page.click('input[name="commit"]', {delay: 500});
    console.log('Login erfolgreich für User:  ', email);
    await page.waitForSelector('.user-name');
    await page.waitForSelector('i.icon-pk-tracker');
    await page.goto(url + '/zeiterfassung/buchungen?b=&show_new_form=true', {waitUntil: "networkidle2"});

    for (const day of dates) {
        await page.waitForSelector('#s2id_tracker_time_entry_new_complete_project_id');
        await page.click('#s2id_tracker_time_entry_new_complete_project_id');
        await page.waitForTimeout(1000);
        let elementHandle = await page.$x(`//div[@class='select2-result-label']`);

        console.log('Wähle letztes Projekt aus.');

        if (elementHandle.length > 0) {
            await elementHandle[elementHandle.length - 1].click({delay: 200})
        } else {
            throw new Error("Project not found");
        }

        await page.type('#tracker_time_entry_new_complete_task_name', subject, {delay: 100});

        await page.click('#tracker_time_entry_new_entry_date_f', {clickCount: 3});
        await page.type('#tracker_time_entry_new_entry_date_f', day, {delay: 100});
        await page.click('#tracker_time_entry_new_started_at_time', {clickCount: 3});
        await page.type('#tracker_time_entry_new_started_at_time', firstTime, {delay: 100});

        await page.click('#tracker_time_entry_new_ended_at_time', {clickCount: 3});
        await page.type('#tracker_time_entry_new_ended_at_time', lastTime, {delay: 100});

        await page.click('input[name="commit"]', {delay: 500});
        console.log('Zeit gebucht für: ', day);
        await page.waitForTimeout(1000);
        await page.goto(url + '/zeiterfassung/buchungen?b=&show_new_form=true', {waitUntil: "networkidle2"});
    }

    await page.waitForSelector('.logout');
    await page.click('.logout', {delay: 1000});
    await browser.close();
})();

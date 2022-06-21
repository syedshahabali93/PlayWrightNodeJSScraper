import playWright from 'playwright';
import fs from 'fs';
import { base_url, job_view_url, jobTitleLocator, companySizeLocator, noMatchingJobsFound } from './locators.js';

(async () => {
    const pageLoadDelay = 5000;
    const buttonPressDelay = 20000;
    const jobsList = [];
    try {
        const browser = await playWright['chromium'].launch({
            headless: false
        });
        const context = await browser.newContext({
            viewport: null
        });

        const homePage = await context.newPage();
        await homePage.goto(base_url);

        await homePage.keyboard.press('Enter', {
            delay: buttonPressDelay
        });

        await homePage.keyboard.press('Enter', {
            delay: buttonPressDelay
        });

        await homePage.keyboard.press('Enter', {
            delay: buttonPressDelay
        });


        let paginationExists = true;
        let paginationValue = 0;
        let pageNo = 1;
        while (paginationExists) {
            console.log("Page No. " + pageNo);
            await delay(pageLoadDelay);
            let jobIDsList = await homePage.evaluate(() => {
                var temp = [];
                var jobIDList = document.getElementsByClassName('jobs-search-results__list-item');

                Array.prototype.forEach.call(jobIDList, function (el) {
                    temp.push(el.getAttribute('data-occludable-job-id'));
                });
                return temp;
            })

            for (let index = 0; index < jobIDsList.length; index++) {
                let jobObject = {};
                let jobPage = await context.newPage();
                let jobUrl = job_view_url + jobIDsList[index] + '/';
                jobPage.goto(jobUrl);
                await delay(pageLoadDelay);
                await jobPage.waitForSelector(jobTitleLocator);
                let jobTitleElement = await jobPage.$$(jobTitleLocator);
                let jobTitle = await jobTitleElement[0].innerText();
                await jobPage.waitForSelector(companySizeLocator);
                let jobCompanySizeElement = await jobPage.$$(companySizeLocator);
                let jobCompanySize = await jobCompanySizeElement[1].innerText();
                jobObject['TITLE'] = jobTitle;
                jobObject['COMPANY-SIZE'] = jobCompanySize;
                jobObject['URL'] = jobUrl;
                jobsList.push(jobObject);
                await delay(pageLoadDelay);
                await jobPage.close();
            }

            let currentUrl = homePage.url();
            paginationValue = 25 + paginationValue;
            currentUrl = currentUrl + '&start=' + paginationValue.toString();
            homePage.goto(currentUrl);
            await delay(pageLoadDelay);

            console.log("Page Level Objects List: ");
            console.log(jobsList);
            console.log("\n");
            pageNo = pageNo + 1;

            let json = JSON.stringify(jobsList);

            fs.appendFileSync('output.json', json, 'utf-8', function (err) {
                if (err) {
                    console.log('An error occurred while writing file.');
                    return console.log(err);
    
                }
                console.log('output.json has been saved.');
            });
    
            try {
                let checkForLastPage = await homePage.$(noMatchingJobsFound);
                if (checkForLastPage != null) {
                    paginationExists = false;
                }
            } catch (e) { }
        }
        console.log("Completed.");
        console.log("All Pages List: ");
        console.log(jobsList);

    } catch (exception) {
        console.log("Error Occurred");
        console.log(exception);
    }

})();


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

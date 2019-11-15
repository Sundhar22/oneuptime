const puppeteer = require('puppeteer');
var utils = require('./test-utils');
var should = require('should');
var init = require('./test-init');
const { Cluster } = require('puppeteer-cluster');

// user credentials
let email = utils.generateRandomBusinessEmail();
let password = utils.generateRandomString();
let userCredentials;
const monitorName = utils.generateRandomString();


describe('Scheduled event', () => {
    const operationTimeOut = 50000;

    beforeAll(async (done) => {
        jest.setTimeout(200000);

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 120000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        // Register user 
        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            
            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => {
                const signInResponse = userCredentials;

                if((await request.url()).match(/user\/login/)){
                    request.respond({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(signInResponse)
                    });
                }else{
                    request.continue();
                }
            });
            await page.on('response', async (response)=>{
                try{
                    const res = await response.json();
                    if(res && res.tokens){
                        userCredentials = res;
                    }
                }catch(error){}
            });

            // user
            await init.registerUser(user, page);
            await init.loginUser(user, page);
        });

        await cluster.queue({ email, password });

        await cluster.idle();
        await cluster.close();
        done();
    });
    
    afterAll(async (done) => {
        done();
    });

    test('should create a new scheduled event for a monitor', async (done) => {
        expect.assertions(1);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 45000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);

            await page.waitForSelector('#frmNewMonitor');

            await page.click('input[id=name]');

            await page.type('input[id=name]', data.monitorName);

            await init.selectByText('#type', 'device', page);

            await page.waitForSelector('#deviceId');

            await page.click('#deviceId');

            await page.type('#deviceId', utils.generateRandomString());

            await page.click('button[type=submit]');

            await page.waitFor(5000);

            const moreButtonSelector = `#more_details_${data.monitorName}`;
            await page.click(moreButtonSelector);

            await page.waitFor(2000);

            addButtonSelector = '#addScheduledEventButton';
            await page.click(addButtonSelector);

            await page.waitFor(1000);

            await page.type('input[name=name]', utils.scheduledEventName);
            await page.type('textarea[name=description]', utils.scheduledEventDescription);

            await page.evaluate(() => {
                document.querySelector('input[name=showEventOnStatusPage]').click();
            });

            await page.click('#createScheduledEventButton');


            createdScheduledEventSelector = '#scheduledEventsList > div > div.bs-ObjectList-cell.bs-u-v-middle.bs-ActionsParent.db-ListViewItem--hasLink > div.Text-color--cyan.Text-display--inline.Text-fontSize--14.Text-fontWeight--medium.Text-lineHeight--20.Text-typeface--base.Text-wrap--wrap';
            await page.waitFor(1000);

            var createdScheduledEventName = await page.$eval(createdScheduledEventSelector, el => el.textContent);
            
            expect(createdScheduledEventName).toEqual(utils.scheduledEventName);
        });

        cluster.queue({ email, password, monitorName, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);

    test('should update the created scheduled event for a monitor', async (done) => {
        expect.assertions(1);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 45000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector(`#more_details_${data.monitorName}`);
            await page.click(`#more_details_${data.monitorName}`);
            createdScheduledEventSelector = '#scheduledEventsList > div > div.bs-ObjectList-cell.bs-u-v-middle.bs-ActionsParent.db-ListViewItem--hasLink > div.Text-color--cyan.Text-display--inline.Text-fontSize--14.Text-fontWeight--medium.Text-lineHeight--20.Text-typeface--base.Text-wrap--wrap';
            await page.waitForSelector(createdScheduledEventSelector);
            await page.click(createdScheduledEventSelector);

            await page.waitFor(1000);

            await page.click('input[name=name]', { clickCount: 3 })
            await page.keyboard.press('Backspace')
            await page.type('input[name=name]', utils.updatedScheduledEventName);

            await page.click('textarea[name=description]', { clickCount: 3 })
            await page.keyboard.press('Backspace')
            await page.type('textarea[name=description]', utils.updatedScheduledEventDescription);

            await page.evaluate(() => {
                document.querySelector('input[name=showEventOnStatusPage]').click();
            });
            await page.evaluate(() => {
                document.querySelector('input[name=alertSubscriber]').click();
            });

            await page.click('#updateScheduledEventButton');

            await page.waitFor(1000);

            var createdScheduledEventName = await page.$eval(createdScheduledEventSelector, el => el.textContent);
            
            expect(createdScheduledEventName).toEqual(utils.updatedScheduledEventName);
        });

        cluster.queue({ email, password, monitorName, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);

    test('should delete the created scheduled event for a monitor', async (done) => {
        expect.assertions(1);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: 45000
        });

        cluster.on('taskerror', (err) => {
            throw err;
        });

        await cluster.task(async ({ page, data }) => {
            const user = {
                email: data.email,
                password: data.password
            }
            const signInResponse = data.userCredentials;

            // intercept request and mock response for login
            await page.setRequestInterception(true);
            await page.on('request', async (request) => await init.filterRequest(request, signInResponse));

            await init.loginUser(user, page);
            await page.waitForSelector(`#more_details_${data.monitorName}`);
            await page.click(`#more_details_${data.monitorName}`);
            
            var deleteButtonSelector = '#scheduledEventsList > div > div:nth-child(5) > button'

            await page.waitForSelector(deleteButtonSelector);
            await page.click(deleteButtonSelector);

            await page.waitFor(1000);

            var scheduledEventCounterSelector = '#scheduledEventCount'
            var scheduledEventCount = await page.$eval(scheduledEventCounterSelector, el => el.textContent);

            expect(scheduledEventCount).toEqual("0 Scheduled Event");
        });

        cluster.queue({ email, password, monitorName, userCredentials });
        await cluster.idle();
        await cluster.close();
        done();
    }, operationTimeOut);
});
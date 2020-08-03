const parseHeaders = require('parse-headers');

const S = require('string');
const emailAddressParser = require("email-addresses");

const turndown = require('turndown'); // converts html to markdown
const cheerio = require('cheerio'); // cherio allows us to do jQuery style DOM navigation

const singleIdTypes = ["message-id", "in-reply-to"]; // These ID feilds should only have one entry
const multipleAddressTypes = ["cc", "to"]; // These email address feilds could have multiple entries

module.exports = {
    getParsedHeaders: (headers) => {
        let parsedHeaders = parseHeaders(headers);

        // Now we'll iterate through those headers and modify some of the values.
        for (const [key, value] of Object.entries(parsedHeaders)) {

            // We need to turn "References" into an array so we can take the first value later.
            if (key === 'references') {
                const refrencesArray = S(S(value).strip('<', '>').s).split(' ');
                parsedHeaders[key] = refrencesArray;
            }

            // Strip all the angled brackets off of the ID feilds so they match what we did for "References".
            if (singleIdTypes.includes(key)) {
                parsedHeaders[key] = S(value).strip('<', '>').s;
            }

            // We want to get the original "Subject" of the email, so we remove any "Re" that shows up.
            if (key === 'subject') {
                parsedHeaders[key] = S(value).chompLeft('Re:', 'RE:', 're:').trimLeft().s; // This is not comprehensive.
            }

            // Parse lists of email addresses.
            if (multipleAddressTypes.includes(key)) {
                parsedHeaders[key] = emailAddressParser.parseAddressList(value);
            }

            // "From" should not have multiple values, so we process it differently.
            if (key === 'from') {
                parsedHeaders[key] = emailAddressParser.parseOneAddress(value);
            }
        }

        return parsedHeaders;
    },

    html2markdown: (html) => {
        const turndownService = new turndown();
        const $ = cheerio.load(html);

        $('.gmail_quote').empty(); // Get rid of all elements containing the 'gmail_quote' class.

        //TODO: There are sooooo many other ways that a reply could be formatted. Add some of them.

        // Convert the remaining HTML into markdown
        return turndownService.turndown($.html())
    },

    createTask: (twilio, channelSid, fromAddress, targetAgent) => {
        let attributes = {
            emailTarget: targetAgent,
            channelType: 'web',
            channelSid: channelSid,
            name: fromAddress
        };

        // Allow sending to a specific agent
        if (targetAgent !== undefined) {
            attributes['emailTarget'] = targetAgent;
        }

        return twilio.taskrouter
            .workspaces(process.env.WORKSPACE_SID)
            .tasks
            .create({
                taskChannel: 'email',
                workflowSid: process.env.WORKFLOW_SID,
                attributes: JSON.stringify(attributes)
            });
    },

    checkTaskPending: (twilio, taskSid) => {
        if (!taskSid) {
            return Promise.resolve(false);
        }

        return twilio.taskrouter
            .workspaces(process.env.WORKSPACE_SID)
            .tasks(taskSid)
            .fetch()
            .then(task => {
                console.log('check pending got task', task);
                return ['completed', 'canceled', 'wrapping'].indexOf(task.assignmentStatus) === -1;
            })
            .catch(e => {
                if (e.status === 404) {
                    return false;
                }

                throw e;
            });
    }
};

const cheerio = require('cheerio');
const TurndownService = require('turndown');

// TODO: This could be more useful if it weren't a flat array.
// 'Attributions' are strings of text that get added before thread history.
// They are the most reliable way to identify the start of the thread history
const attributionRegExp = [
    // example: "From: Nemo MacNaught <nemo.macnaught@gmail.com>Date: Wednesday, November 13, 2019 at 3:37 PMTo: Nemo MacNaught <nemomacnaught@yahoo.com>Subject: Re: Test"
    // comment: "Outlook Desktop default format"
    "From:\\s.+?Date:\\s.+?To:\\s.+?Subject:\\s",

    // example: "On Wed, Nov 13, 2019 at 3:31 PM Nemo MacNaught <nemomacnaught@yahoo.com> wrote:"
    // comment: "Gmail default format"
    "On[^.!?:;]+?,[^.!?:;]+?,[^.!?:;]+?\\sat\\s\\d{1,2}:\\d{1,2}\\s[AP]M\\s[^<]+?<.*>\\swrote:",

    // example: "On Wednesday, November 13, 2019, 03:45:41 PM PST, Nemo MacNaught <nemomacnaught@yahoo.com> wrote:"
    // comment: "Yahoo default format"
    "On\\s\\w+,\\s\\w+\\s\\d{1,2},\\s\\d{4},\\s\\d{2}:\\d{2}:\\d{2}\\s[AP]M\\s[A-Z]{3},\\s[^<]+?<.*>\\swrote:",

    // example: "On Oct 21, 2019, at 15:53, Nemo MacNaught <nemo.macnaught@icloud.com> wrote:"
    // comment: "iOS Mail App default format"
    "On\\s\\w+\\s\\w+,\\s\\d{4}.\\sat\\s\\d{2}:\\d{2},\\s[^<]+?<\\S*>\\swrote:",

    // example: "On Oct 21, 2019, at 15:53, Nemo MacNaught <nemo.macnaught@icloud.com> wrote:"
    // comment: "iOS Mail App default format"
    "On\\s\\w+\\s\\w+,\\s\\d{4}.\\sat\\s\\d{2}:\\d{2},\\s[^<]+?<\\S*>\\swrote:",

    // example: "On Saturday, November 16, 2019, Nemo MacNaught <[nemomacnaught@yahoo.com](mailto:nemomacnaught@yahoo.com)\> wrote:"
    // comment: "Gmail Mobile Browser"
    "On\\s\\w+,\\s\\w+\\s\\d{1,2},\\s\\d{4},\\s[^:]*<[^>]*>\\swrote:",

    // example: "-------- Original message --------From: Nemo MacNaught <nemo.macnaught@gmail.com> Date: 11/13/19  15:37  (GMT-08:00) To: Nemo MacNaught <nemomacnaught@yahoo.com> Subject: Re: Test"
    // comment: "Samsung Mail default format"
    "-------- Original message --------", // Samsung Mail Android App
    "-----Original Message-----", // AOL Desktop Browser

    // Tutanota: <div>Nov 17, 2019, 09:55 by tamarind.pony@tutanota.com:</div><blockquote className="tutanota_quote">
    // Zoho iOS: ---- On Sun, 17 Nov 2019 10:29:31 -0800 nemo.macnaught@outlook.com<nemo.macnaught@outlook.com> wrote ----
];

// These are the Cherio/Jquery selectors that identify signatures
const signatureSelectors = [
    '.gmail_signature', // Gmail Desktop Web Client
    '.x-apple-signature',
    '[data-signature-widget]', // Mail.ru Desktop Web Client
    '#mail-app-auto-default-signature', // Mail.ru iOS App
    '.ms-outlook-ios-signature', // Outlook iOS App
    'ms-outlook-mobile-signature', // Outlook Android App
    '#composer_signature', // Samsung Mail Android App
    'a:contains("Sent from Yahoo Mail for iPhone")', // Yahoo iOS App signature nag
    'div[name="messageSignatureSection"]', // Spark iOS App
    '#__aol_mail_signature__', // AOL iOS App
    '#OutlookSignature', // Outlook
    'div.moz-signature', // Thunderbird
    'div#Zm-_Id_-Sgn', // Zoho Desktop Browser
];

const regexp = new RegExp(attributionRegExp.join("|"), 'gm');

module.exports = function extractHtmlContent(htmlEmail) {
    let $ = cheerio.load(htmlEmail);

    // Remove all the signatures which can be selected with HTML.
    signatureSelectors.forEach(signatureSelector => {
        $(signatureSelector).remove();
    });

    // Order matters here. Remove the HTML that points to other things you want to remove last.
    $('div.gmail_quote').remove(); // Gmail
    $('.yahoo-quoted-begin').nextAll().remove(); // Yahoo iOS App, removes everything after the attribution
    $('.yahoo-quoted-begin').remove(); // Yahoo iOS App, removes the attribution
    $('#composeWebView_previouse_content').remove(); // Mail.ru iOS App
    $('#divRplyFwdMsg').nextAll().remove(); // Outlook Desktop Browser
    $('#divRplyFwdMsg').prev('hr').remove(); // Outlook iOS App
    $('#divRplyFwdMsg').remove(); // Outlook Desktop Browser
    $('div[name="messageReplySection"]').remove(); // Spark iOS App
    $('div.device_aol_et_org_dt_dd_quote').nextAll().remove(); // AOL Android App
    $('div.aolmail_replyHeader').nextAll().remove(); // AOL iOS App, removes everything after the attribution
    $('div.aolmail_replyHeader').remove(); // AOL iOS App, removes the attribution

    $('blockquote[cite^="mid"]').remove(); // Thunderbird Desktop thread history
    $('div.moz-cite-prefix').remove(); // Thunderbird Attribution

    $('blockquote.tutanota_quote').remove(); // Tutanota Desktop Browser. Note, this isn't good enough to pass the test.

    $('div.replyHeader').nextUntil('blockquote').next().remove(); // Zoho iOS App
    $('div.replyHeader').remove(); // Zoho iOS Attribution

    $('div.zmail_extra').remove(); // ZohoDesktop Browser Thread History

    $('div#edo-original').remove(); // Edison Mail iOS Thread History

    // Making our own plaintext because the email's plaintext version may be wrapped to less than 78 characters.
    // Learn more in http://www.rfc-editor.org/rfc/rfc2822.txt section 2.2.1
    let turndownService = new TurndownService();
    let markdown = turndownService.turndown($('body').html()
        .replace(/^-- ?\n/g, '\n')); // TODO: This is a sloppy way to remove the remaining '--' before the signatures.

    return markdown.split(regexp)[0].trim()
        .replace(/\s+\n+/g, '\n\n'); // TODO: This can be done better.
}

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const config = require("./config");

dotenv.config();

MongoClient.connect(process.env.MONGODB_URL).then(async client => {
    const messages = [];
    const { host, port, auth, secure } = await config();

    const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
        tls: {
            rejectUnauthorized: false
        }
    });

    transport.verify(async (error, success) => {
        if (error) {
            console.error(error);
        } else {
            const db = client.db(process.env.MONGODB_NAME);
            const notifications = db.collection("notifications");
            const users = db.collection("users");

            let notifCursor = notifications.watch();

            const { subject, appUrl, language, amountMessages } = await config();

            const sendMail = mailOptions => {
                transport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
            }

            const sendAmountOfMails = amount => {
                let count = Math.min(amount, messages.length);
                for(let i =0; i<count; i++){
                    const options = messages.pop();
                    sendMail(options);
                }
                if(messages.length > 0)
                    console.log(`${messages.length} messages left in Queue`);
            }

            // set amount of mails to send over one minute
            setInterval(()=>sendAmountOfMails(amountMessages), 60000);

            notifCursor.on("change", async ({ fullDocument }) => {
                if (fullDocument) {
                    let { from, notifTo, title, boardId, action } = fullDocument;
                    if (notifTo) {
                        const user = await users.findOne({ _id: notifTo });
                        const mailOptions = {
                            from: auth.user,
                            to: user.email || user.mail,
                            subject,
                            text: createTextMessage(language, from, title, action, boardId, appUrl),
                            html: createHTMLMessage(language, from, title, action, boardId, appUrl)
                        };

                        messages.push(mailOptions);
                    }
                }
            });
        }
    });
});

const createTextMessage = (language, ...args) => textMessages[language](...args);

const englishTextMessage = (from, title, action, boardId, appUrl) => {
    return `Hey There! 
    The user: ${from} has modified a board you are watching.
    Board Title: ${title}
    ${from} did the following change: ${action}
    Link to Board: ${appUrl}/b/${boardId}
    `;
}

const hebrewTextMessage = (from, title, action, boardId, appUrl) => {
    return `
    שלום רב!
    המשתמש: ${from} ערך לוח עליו הפעלת צפייה.
    כותרת הלוח הינה: ${title}
    ${from} עשה את הפעולה הבאה: ${action}
    קישור ללוח הרלוונטי: ${appUrl}/b/${boardId}
    `
}

const textMessages = {
    'english': englishTextMessage,
    'hebrew': hebrewTextMessage
}

const createHTMLMessage = (language, ...args) => htmlMessages[language](...args);


const englishHtmlMessage = (from, title, action, boardId, appUrl) => {
    return `
    <html> 
        <h2> Hi There! </h2>
        <br>
        <p> The user: ${from} has modified a board you are watching. </p>
        <p> Board Title: ${title} </p>
        <p> ${from} did the following change: ${action} </p>
        <br>
        <a href="${appUrl}/b/${boardId}"> Link to Board </a>
    </html>
    `;
}

const hebrewHtmlMessage = (from, title, action, boardId, appUrl) => {
    return `
    <html> 
        <div dir="rtl">
            <h2>  שלום רב! </h2>
            <br>
            <p> המשתמש: ${from} ערך לוח עליו הפעלת צפייה. </p>
            <p> כותרת הלוח הינה: ${title} </p>
            <p> ${from} עשה את הפעולה הבאה: ${action} </p>
            <br>
            <a href="${appUrl}/b/${boardId}"> קישור ללוח הרלוונטי </a>
        </div>
    </html>
    `;
}

const htmlMessages = {
    'english': englishHtmlMessage,
    'hebrew': hebrewHtmlMessage
}




const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

MongoClient.connect(process.env.MONGODB_URL).then(client => {
    const db = client.db(process.env.MONGODB_NAME);

    const notifications = db.collection("notifications");
    let notifCursor = notifications.watch();
    notifCursor.on("change", ({ fullDocument }) => {
        if (fullDocument) {
            let { userId } = fullDocument;
            if (userId) {
                // send mail
            }
        }
    })
});




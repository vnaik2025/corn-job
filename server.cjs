
require('dotenv').config();
const webpush = require('web-push');
const cron = require('node-cron');
const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

// Set VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const serviceAccount = {
  "type": process.env.FIREBASE_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
  "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
};
console.log("service account",serviceAccount)
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Send push notification
async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(JSON.parse(subscription), JSON.stringify(payload));
    console.log(`Notification sent for task: ${payload.title}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Check and send notifications
async function checkAndSendNotifications() {
  const now = Date.now();
  console.log('Checking for tasks to notify...');

  try {
    const tasksSnapshot = await db
      .collection('tasks')
      .where('alert', '==', true)
      .where('notified', '==', false)
      .get();

    if (tasksSnapshot.empty) {
      console.log('No tasks found that require notifications.');
      return;
    }

    console.log(`Found ${tasksSnapshot.size} tasks that need notifications.`);

    const notificationPromises = tasksSnapshot.docs.map(async (doc) => {
      const task = doc.data();
      const taskId = doc.id;
      const taskTime = new Date(task.timestamp).getTime();
      const alertMinutes = task.alertMinutes || 0;
      const alertTime = taskTime - alertMinutes * 60 * 1000;

      // Check if current time is within a 1-minute window of the alert time
      if (Math.abs(now - alertTime) <= 60000) {
        console.log(`Task "${task.title}" is due for notification!`);

        // Fetch user's subscription
        const subscriptionDoc = await db
          .collection('subscriptions')
          .doc(task.userId)
          .get();

        if (!subscriptionDoc.exists) {
          console.log(`No subscription found for user ${task.userId}`);
          return;
        }

        const subscription = subscriptionDoc.data().subscription;

        const payload = {
          title: `Task Reminder: ${task.title}`,
          body: `Your task "${task.title}" is due at ${new Date(taskTime).toLocaleString()}.`,
          data: { url: '/', taskId },
        };

        await sendPushNotification(subscription, payload);

        await db.collection('tasks').doc(taskId).update({ notified: true });
      }
    });

    await Promise.all(notificationPromises);
    console.log('All notifications processed!');
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// API endpoint for testing notifications (optional)
app.post('/api/send-notification', async (req, res) => {
  const { subscription, payload } = req.body;
  try {
    await sendPushNotification(subscription, payload);
    res.status(200).send('Notification sent');
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).send('Failed to send push');
  }
});

// Schedule checks every minute
cron.schedule('* * * * *', () => {
  checkAndSendNotifications();
});

// Initial run
checkAndSendNotifications();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

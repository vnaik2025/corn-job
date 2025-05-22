// // server.cjs
// require('dotenv').config();
// const cron = require('node-cron');
// const express = require('express');
// const admin = require('firebase-admin');
// const app = express();

// app.use(express.json());

// const serviceAccount = {
//   type: process.env.FIREBASE_TYPE,
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   client_email: process.env.FIREBASE_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_CLIENT_ID,
//   auth_uri: process.env.FIREBASE_AUTH_URI,
//   token_uri: process.env.FIREBASE_TOKEN_URI,
//   auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
//   client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
//   universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
// };

// // Initialize Firebase Admin SDK
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const db = admin.firestore();

// // Add root GET endpoint for Cron-Job.org pings
// app.get('/', (req, res) => {
//   res.status(200).send('Server is running');
// });

// // Send FCM notification with retry logic
// async function sendPushNotification(token, payload, retries = 3) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//      const message = {
//   data: {
//     title: payload.title,
//     body: payload.body,
//     taskId: payload.data.taskId,
//   },
//   token,
// };
//       await admin.messaging().send(message);
//       console.log(`Notification sent for task: ${payload.title} (Attempt ${attempt})`);
//       return true;
//     } catch (error) {
//       console.error(`Error sending notification for task "${payload.title}" (Attempt ${attempt}):`, error);
//       if (
//         error.code === 'messaging/registration-token-not-registered' ||
//         error.code === 'messaging/invalid-registration-token' ||
//         attempt === retries
//       ) {
//         console.log(`Unrecoverable error or max retries reached for task: ${payload.title}`);
//         return false;
//       }
//       await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//     }
//   }
//   return false;
// }

// // Check and send notifications
// async function checkAndSendNotifications() {
//   const now = Date.now();
//   console.log(`Checking for tasks to notify at ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}...`);

//   try {
//     // Query tasks with alerts enabled and not yet notified
//     const tasksSnapshot = await db
//       .collection('tasks')
//       .where('alert', '==', true)
//       .where('notified', '==', false)
//       .get();

//     if (tasksSnapshot.empty) {
//       console.log('No tasks found that require notifications.');
//       return;
//     }

//     console.log(`Found ${tasksSnapshot.size} tasks that need notifications.`);

//     const notificationPromises = tasksSnapshot.docs.map(async (doc) => {
//       const task = doc.data();
//       const taskId = doc.id;
//       const taskTime = new Date(task.timestamp).getTime();
//       const alertMinutes = task.alertMinutes || 0;
//       const alertTime = taskTime - alertMinutes * 60 * 1000;

//       // Log task details for debugging
//       console.log(`Evaluating task "${task.title}" (ID: ${taskId})`);
//       console.log(`  Task Time: ${new Date(taskTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Alert Time: ${new Date(alertTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Current Time: ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Time Difference (ms): ${now - alertTime}`);

//       // Check if current time is within a window of 1 minute past to 5 minutes future
//  if (Math.floor(alertTime / 60000) === Math.floor(now / 60000)) {

//         console.log(`Task "${task.title}" is due for notification!`);

//         const token = task.token;
//         if (!token) {
//           console.log(`No FCM token found for task ${taskId}. Marking as notified to avoid repeated processing.`);
//           await db.collection('tasks').doc(taskId).update({ notified: true });
//           return;
//         }

//         const payload = {
//           title: `Task Reminder: ${task.title}`,
//           body: `Your task "${task.title}" is due at ${new Date(taskTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`,
//           data: { taskId },
//         };

//         const success = await sendPushNotification(token, payload);
//         if (success) {
//           console.log(`Marking task ${taskId} as notified`);
//           await db.collection('tasks').doc(taskId).update({ notified: true });
//         } else {
//           console.log(`Failed to send notification for task ${taskId}. Not marking as notified.`);
//         }
//       } else {
//         console.log(`Task "${task.title}" is not within the notification window.`);
//       }
//     });

//     await Promise.all(notificationPromises);
//     console.log('All notifications processed!');
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//   }
// }

// // API endpoint for testing notifications
// app.post('/api/send-notification', async (req, res) => {
//   const { token, payload } = req.body;
//   try {
//     const success = await sendPushNotification(token, payload);
//     if (success) {
//       res.status(200).send('Notification sent');
//     } else {
//       res.status(500).send('Failed to send notification');
//     }
//   } catch (err) {
//     console.error('Push error:', err);
//     res.status(500).send('Failed to send push');
//   }
// });

// // Schedule checks every minute
// cron.schedule('* * * * *', () => {
//   console.log('Running scheduled notification check...');
//   checkAndSendNotifications();
// });

// // Initial run
// checkAndSendNotifications();

// app.listen(3000, () => {
//   console.log('Server running on port 3000');
// });

// server.cjs
require('dotenv').config();
const cron = require('node-cron');
const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Notification message formats
const formats = [
  `Your task “{title}” is due soon. Be the hero you need!`,
  `“{title}” needs your magic touch. Wand ready?`,
  `Don’t make “{title}” cry. It just wants attention.`,
  `Task time: “{title}”. Destiny awaits. 🌟`,
  `📝 “{title}” isn’t going to do itself (unfortunately).`,
  `“{title}” is lurking. Finish it before it finishes you.`,
  `⏰ Ping! Time to tackle “{title}” like a boss.`,
  `🚀 “{title}” is your launchpad to productivity.`,
  `Just in case you forgot, “{title}” exists. 😉`,
  `Knock knock. “{title}” is at the door.`,
  `“{title}” says: Do me, maybe?`,
  `Finish “{title}” and unlock nap mode. 💤`,
  `You promised to do “{title}”... remember?`,
  `“{title}” – now or never (but preferably now).`,
  `Get your stuff together. “{title}” needs love.`,
  `🧠 Brain check: Have you done “{title}”?`,
  `“{title}” is silently judging you. 👀`,
  `🎯 “{title}” = mission accepted?`,
  `Let’s crush “{title}” and take the crown. 👑`,
  `If “{title}” were pizza, you’d eat it. Now go do it.`,
  `💡 Pro tip: Complete “{title}”. Feel powerful.`,
  `Alert: “{title}” in the wild. Capture it!`,
  `A wild “{title}” appeared! Use Task Attack!`,
  `“{title}” is 90% not scary. You got this.`,
  `🚨 “{title}” alert! This is not a drill.`,
  `Conquer “{title}” and earn +5 confidence.`,
  `“{title}” has been waiting politely. Be nice.`,
  `You’ve avoided “{title}” long enough.`,
  `👀 Still there? “{title}” is.`,
  `Rise, warrior. “{title}” calls.`,
  `Face “{title}” with courage and snacks.`,
  `“{title}” just sent you a passive-aggressive vibe.`,
  `Doing “{title}” now = guilt-free later.`,
  `You + “{title}” = ❤️`,
  `Only YOU can prevent overdue “{title}”.`,
  `Good vibes only. And “{title}”.`,
  `“{title}”: because Future You said thanks.`,
  `🎬 Action scene: you vs “{title}”. Go.`,
  `Power up! “{title}” unlocked.`,
  `Finish “{title}” and impress the time gods.`,
  `Reminder: “{title}” is still a thing.`,
  `Make “{title}” disappear like magic.`,
  `No pressure… but “{title}”.`,
  `Your quest: “{title}”. Accept?`,
  `One small task for you, one big win: “{title}”`,
  `🚴‍♂️ Pedal to the productivity: “{title}”`,
  `Don’t worry. “{title}” is friendly.`,
  `⚔️ Your next duel: “{title}”`,
  `😅 You know what’s coming… “{title}”`,
  `💭 Thought of the day: Finish “{title}”`,
  `✨ “{title}” is the way.`,
];

// Track used formats to avoid repetition
const usedFormats = new Map();

// Select a unique random format for each task
function getUniqueFormat(taskId, taskTitle) {
  const used = usedFormats.get(taskId) || new Set();
  let remaining = formats.filter((_, i) => !used.has(i));

  // Reset if all formats used
  if (remaining.length === 0) {
    used.clear();
    remaining = [...formats];
  }

  const index = Math.floor(Math.random() * remaining.length);
  const selected = remaining[index];
  const selectedIndex = formats.indexOf(selected);
  used.add(selectedIndex);
  usedFormats.set(taskId, used);

  return selected.replace('{title}', taskTitle);
}

// Add root GET endpoint for Cron-Job.org pings
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

// Send FCM notification with retry logic
async function sendPushNotification(token, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const message = {
        data: {
          title: payload.title,
          body: payload.body,
          taskId: payload.data.taskId,
        },
        token,
      };
      await admin.messaging().send(message);
      console.log(`Notification sent for task: ${payload.title} (Attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`Error sending notification for task "${payload.title}" (Attempt ${attempt}):`, error);
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token' ||
        attempt === retries
      ) {
        console.log(`Unrecoverable error or max retries reached for task: ${payload.title}`);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
  return false;
}

// Check and send notifications
async function checkAndSendNotifications() {
  const now = Date.now();
  console.log(`Checking for tasks to notify at ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}...`);

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

      console.log(`Evaluating task "${task.title}" (ID: ${taskId})`);
      console.log(`  Task Time: ${new Date(taskTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Alert Time: ${new Date(alertTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Current Time: ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Time Difference (ms): ${now - alertTime}`);

      if (Math.floor(alertTime / 60000) === Math.floor(now / 60000)) {
        console.log(`Task "${task.title}" is due for notification!`);

        const token = task.token;
        if (!token) {
          console.log(`No FCM token found for task ${taskId}. Marking as notified to avoid repeated processing.`);
          await db.collection('tasks').doc(taskId).update({ notified: true });
          return;
        }

        const body = getUniqueFormat(taskId, task.title);
        const payload = {
          title: `⏰ Reminder`,
          body,
          data: { taskId },
        };

        const success = await sendPushNotification(token, payload);
        if (success) {
          console.log(`Marking task ${taskId} as notified`);
          await db.collection('tasks').doc(taskId).update({ notified: true });
        } else {
          console.log(`Failed to send notification for task ${taskId}. Not marking as notified.`);
        }
      } else {
        console.log(`Task "${task.title}" is not within the notification window.`);
      }
    });

    await Promise.all(notificationPromises);
    console.log('All notifications processed!');
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// API endpoint for testing notifications
app.post('/api/send-notification', async (req, res) => {
  const { token, payload } = req.body;
  try {
    const success = await sendPushNotification(token, payload);
    if (success) {
      res.status(200).send('Notification sent');
    } else {
      res.status(500).send('Failed to send notification');
    }
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).send('Failed to send push');
  }
});

// Schedule checks every minute
cron.schedule('* * * * *', () => {
  console.log('Running scheduled notification check...');
  checkAndSendNotifications();
});

// Initial run
checkAndSendNotifications();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

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

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const db = admin.firestore();

// app.get('/', (req, res) => {
//   res.status(200).send('Server is running');
// });

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

// async function checkAndSendNotifications() {
//   const now = Date.now();
//   console.log(`Checking for tasks to notify at ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}...`);

//   try {
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

//       console.log(`Evaluating task "${task.title}" (ID: ${taskId})`);
//       console.log(`  Task Time: ${new Date(taskTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Alert Time: ${new Date(alertTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Current Time: ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
//       console.log(`  Time Difference (ms): ${now - alertTime}`);

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

// cron.schedule('* * * * *', () => {
//   console.log('Running scheduled notification check...');
//   checkAndSendNotifications();
// });

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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

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

    // List of 50 humorous notification message formats
    const notificationMessages = [
      `Yo, "${task.title}" is calling your name! Get it done! 😎`,
      `Hey! "${task.title}" is ready to be crushed. Let's go! 🚀`,
      `Psst! "${task.title}" is waiting. Don't leave it hanging! 😉`,
      `Time to shine! Tackle "${task.title}" now! 🌟`,
      `Uh-oh! "${task.title}" says, 'Do me now, pretty please!' 😜`,
      `Your mission: Complete "${task.title}". Accept it? 😏`,
      `"${task.title}" is knocking. Answer the call! 🔔`,
      `Don't procrastinate! "${task.title}" needs your attention! 😬`,
      `Be a hero and finish "${task.title}" today! 🦸`,
      `"${task.title}" is like, 'C'mon, let's do this!' 💪`,
      `Tick-tock! "${task.title}" is ready for action! ⏰`,
      `Hey champ, "${task.title}" is up. Knock it out! 🥊`,
      `"${task.title}" is begging for your focus. Give it some love! ❤️`,
      `Time to adult! "${task.title}" awaits your greatness! 😃`,
      `"${task.title}" just winked at you. Wink back by finishing it! 😉`,
      `Let's roll! "${task.title}" is ready to be checked off! ✅`,
      `"${task.title}" is tapping its foot. Hurry up! 🏃`,
      `You got this! Smash "${task.title}" now! 💥`,
      `"${task.title}" is giving you puppy eyes. Don't ignore it! 🐶`,
      `Time to be awesome! "${task.title}" is waiting! 😎`,
      `"${task.title}" says, 'I'm ready when you are!' Let's go! 🚴`,
      `Don't let "${task.title}" gather dust. Get to it! 🧹`,
      `"${task.title}" is your VIP task today. Handle it! 🎯`,
      `Rise and grind! "${task.title}" needs you! ☀️`,
      `"${task.title}" is whispering, 'Finish me!' Listen up! 👂`,
      `Time to slay "${task.title}" like a boss! 🗡️`,
      `"${task.title}" is ready for its close-up. Action! 🎬`,
      `Hey, "${task.title}" is feeling lonely. Give it some attention! 😢`,
      `"${task.title}" is your quest today. Accept the challenge! ⚔️`,
      `No excuses! "${task.title}" is waiting for you! 😤`,
      `"${task.title}" says, 'Let's make it happen!' Do it! 💥`,
      `Be a rockstar and tackle "${task.title}" now! 🎸`,
      `"${task.title}" is cheering for you. Don't let it down! 📣`,
      `Time to conquer "${task.title}"! You got this! 🏆`,
      `"${task.title}" is like, 'Yo, let's wrap this up!' 🙌`,
      `Don't snooze on "${task.title}"! It's go time! ⏰`,
      `"${task.title}" is ready to be crossed off. Let's do it! ✍️`,
      `Hey you! "${task.title}" needs your magic touch! ✨`,
      `"${task.title}" is calling. Pick up and get it done! 📞`,
      `Time to flex those skills on "${task.title}"! 💪`,
      `"${task.title}" is your moment to shine. Go for it! 🌟`,
      `Don't leave "${task.title}" hanging! Finish it! 😜`,
      `"${task.title}" is ready for you to be its hero! 🦸‍♀️`,
      `Let's make "${task.title}" history! Get to it! 🗑️`,
      `"${task.title}" is wagging its tail for you. Act now! 🐕`,
      `Time to tackle "${task.title}" like a pro! 🏀`,
      `"${task.title}" is ready for its big moment. Don't miss it! 🎤`,
      `Hey, "${task.title}" is knocking. Open the door! 🚪`,
      `"${task.title}" says, 'Let's finish strong!' You in? 💪`,
      `Be epic and complete "${task.title}" now! ⚡`,
    ];

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

        // Randomly select a humorous message from the list
        const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];

        const payload = {
          title: task.title, // Simplified title
          body: randomMessage.replace('${task.title}', task.title), // Use random humorous message
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

cron.schedule('* * * * *', () => {
  console.log('Running scheduled notification check...');
  checkAndSendNotifications();
});

checkAndSendNotifications();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
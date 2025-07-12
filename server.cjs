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

    const tasks = tasksSnapshot.docs;
    console.log(`Found ${tasks.length} tasks that need notifications.`);

    if (tasks.length === 0) {
      console.log('No tasks found that require notifications.');
      return;
    }

   const notificationMessages = [
  `Yo, "\${title}" is calling your name! Get it done! 😎`,
  `Hey! "\${title}" is ready to be crushed. Let's go! 🚀`,
  `Psst! "\${title}" is waiting. Don't leave it hanging! 😉`,
  `Time to shine! Tackle "\${title}" now! 🌟`,
  `Uh-oh! "\${title}" says, 'Do me now, pretty please!' 😜`,
  `Your mission: complete "\${title}". Accept it? 😏`,
  `"\${title}" is knocking. Answer the call! 🔔`,
  `Don't procrastinate! "\${title}" needs your attention! 😬`,
  `Be a hero and finish "\${title}" today! 🦸`,
  `"\${title}" is like, 'C'mon, let's do this!' 💪`,
  `Tick-tock! "\${title}" is ready for action! ⏰`,
  `Hey champ, "\${title}" is up. Knock it out! 🥊`,
  `"\${title}" is begging for your focus. Give it some love! ❤️`,
  `Time to adult! "\${title}" awaits your greatness! 😃`,
  `"\${title}" just winked at you. Wink back by finishing it! 😉`,
  `Let's roll! "\${title}" is ready to be checked off! ✅`,
  `"\${title}" is tapping its foot. Hurry up! 🏃`,
  `You got this! Smash "\${title}" now! 💥`,
  `"\${title}" is giving you puppy eyes. Don't ignore it! 🐶`,
  `Time to be awesome! "\${title}" is waiting! 😎`,
  `"\${title}" says, 'I'm ready when you are!' Let's go! 🚴`,
  `Don't let "\${title}" gather dust. Get to it! 🧹`,
  `"\${title}" is your VIP task today. Handle it! 🎯`,
  `Rise and grind! "\${title}" needs you! ☀️`,
  `"\${title}" is whispering, 'Finish me!' Listen up! 👂`,
  `Time to slay "\${title}" like a boss! 🗡️`,
  `"\${title}" is ready for its close-up. Action! 🎬`,
  `Hey, "\${title}" is feeling lonely. Give it some attention! 😢`,
  `"\${title}" is your quest today. Accept the challenge! ⚔️`,
  `No excuses! "\${title}" is waiting for you! 😤`,
  `"\${title}" says, 'Let's make it happen!' Do it! 💥`,
  `Be a rockstar and tackle "\${title}" now! 🎸`,
  `"\${title}" is cheering for you. Don't let it down! 📣`,
  `Time to conquer "\${title}"! You got this! 🏆`,
  `"\${title}" is like, 'Yo, let's wrap this up!' 🙌`,
  `Don't snooze on "\${title}"! It's go time! ⏰`,
  `"\${title}" is ready to be crossed off. Let's do it! ✍️`,
  `Hey you! "\${title}" needs your magic touch! ✨`,
  `"\${title}" is calling. Pick up and get it done! 📞`,
  `Time to flex those skills on "\${title}"! 💪`,
  `"\${title}" is your moment to shine. Go for it! 🌟`,
  `Don't leave "\${title}" hanging! Finish it! 😜`,
  `"\${title}" is ready for you to be its hero! 🦸‍♀️`,
  `Let's make "\${title}" history! Get to it! 🗑️`,
  `"\${title}" is wagging its tail for you. Act now! 🐕`,
  `Time to tackle "\${title}" like a pro! 🏀`,
  `"\${title}" is ready for its big moment. Don't miss it! 🎤`,
  `Hey, "\${title}" is knocking. Open the door! 🚪`,
  `"\${title}" says, 'Let's finish strong!' You in? 💪`,
  `Be epic and complete "\${title}" now! ⚡`,
  `Chop chop! "\${title}" won’t do itself! 🔪`,
  `Even coffee agrees you should do "\${title}" ☕`,
  `Don’t worry, "\${title}" doesn’t bite… probably 🐊`,
  `"\${title}" is hotter than your DMs. Handle it 🔥`,
  `Time for battle! Slay "\${title}" ⚔️`,
  `Put on your cape, "\${title}" needs saving 🦸‍♂️`,
  `Even your to-do list is rooting for "\${title}" 📋`,
  `No better time than now to smash "\${title}" 🧨`,
  `"\${title}" is ready to vibe with your productivity 🎧`,
  `Break up with distractions, date "\${title}" instead 💔➡️💘`,
  `Your future self will high-five you for doing "\${title}" 🙌`,
  `Knock knock. Who’s there? "\${title}" 🔑`,
  `Finish "\${title}" and brag guilt-free 😌`,
  `Get it done before it gets revenge – "\${title}" 😈`,
  `Make your to-do list shorter. Start with "\${title}" ✂️`,
  `Don’t ghost "\${title}". It deserves closure 👻`,
  `You and "\${title}" – a legendary duo waiting to happen 🎮`,
  `Cue the Rocky theme. "\${title}" is your opponent 🎵🥊`,
  `One small task for you, one giant leap for your list – "\${title}" 👨‍🚀`,
  `You're one tap away from victory. "\${title}" awaits 🏁`,
  `Legend says completing "\${title}" gives instant karma ✨`,
  `Today’s power move: crush "\${title}" 💼`,
  `Slay the day – starting with "\${title}" 💃`,
  `"\${title}": small task, big impact 💡`,
  `This is your sign to do "\${title}" 🪧`,
  `The world won’t end, but "\${title}" won’t do itself 🌍`,
  `Productivity mode: ON. Starting with "\${title}" 🔛`,
  `You're 1 decision away from less stress – finish "\${title}" 💆`,
  `Level up your day by completing "\${title}" 🎮`,
  `Silence the guilt – finish "\${title}" now 🧘`,
  `Crushing "\${title}" = instant confidence boost 💯`,
  `"\${title}" is lurking… better deal with it 👀`,
  `Finish "\${title}" and treat yourself 🎁`,
  `When in doubt, knock "\${title}" out 💪`,
  `"\${title}" won’t wait forever! ⌛`,
  `Final boss of the hour: "\${title}" 🧟‍♂️`,
  `The grind begins with "\${title}" 🛠️`,
  `Less talk, more action: "\${title}" 🤐`,
  `Hit send. Mark done. Feel powerful. "\${title}" ✅`,
  `The only way out is through "\${title}" 🚪`,
  `Goal today: destroy "\${title}" 🎯`,
  `If you were a ninja, "\${title}" is the mission 🥷`,
  `Feeling lazy? Do "\${title}" to warm up 🛋️➡️🔥`,
  `Bonus points for handling "\${title}" now 🎯`,
  `Tick "\${title}" off and gain +10 productivity XP ✨`,
  `Wanna feel accomplished? Do "\${title}" first 🏅`,
  `Knock "\${title}" down like dominoes 🁢`,
  `Imagine finishing "\${title}"... now go live it 🌈`,
  `Clear the fog. Start with "\${title}" 🌫️➡️☀️`,
  `You’re the chosen one. Complete "\${title}" 🧙‍♂️`,
  `No cap – "\${title}" is next up 🎩`,
  `Add some ✨spice✨ to your day with "\${title}"`,
  `True heroes start with "\${title}" 💖`,
  `"\${title}": the sequel you've been waiting for 🎬`,
  `Tap. Complete. Conquer. "\${title}" 🛡️`,
  `Master your moment. Begin with "\${title}" 🧘‍♂️`,
  `Don’t think. Just tap and do "\${title}" 🎯`,
  `This isn’t a drill. "\${title}" is real 🔔`,
  `Prove your greatness with "\${title}" 🧠`,
  `Today’s MVP: the one who finishes "\${title}" 🥇`
];


    const notificationPromises = tasks.map(async (doc) => {
      const task = doc.data();
      const taskId = doc.id;
      const taskTime = new Date(task.timestamp).getTime();
      const alertMinutes = task.alertMinutes || 0;
      const alertTime = taskTime - alertMinutes * 60 * 1000;

      console.log(`\nEvaluating task "${task.title}" (ID: ${taskId})`);
      console.log(`  Task Time: ${new Date(taskTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Alert Time: ${new Date(alertTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Current Time: ${new Date(now).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Time Difference (ms): ${now - alertTime}`);

      if (Math.floor(alertTime / 60000) === Math.floor(now / 60000)) {
        console.log(`Task "${task.title}" is due for notification!`);

        const token = task.token;
        if (!token) {
          console.log(`No FCM token for task ${taskId}. Marking as notified.`);
          await db.collection('tasks').doc(taskId).update({ notified: true });
          return;
        }

        const randomMessageTemplate = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
        const messageBody = randomMessageTemplate.replace('${title}', task.title);

        const payload = {
          title: task.title,
          body: messageBody,
          data: { taskId },
        };

        const success = await sendPushNotification(token, payload);
        if (success) {
          console.log(`Marking task ${taskId} as notified`);
          await db.collection('tasks').doc(taskId).update({ notified: true });
        } else {
          console.log(`Failed to send notification for task ${taskId}`);
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

// Run check every minute
cron.schedule('* * * * *', () => {
  console.log('Running scheduled notification check...');
  checkAndSendNotifications();
});

// Initial check on startup
checkAndSendNotifications();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

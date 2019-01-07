/**
 * This script listens to a Pubsub subscription,
 * waiting for messages that contain the RGB hex
 * code for new colors.
 * When a new message arrives, the color is converted
 * to BGR and sent to the Razer Chroma SDK REST API server,
 * which is local.
 */
const {PubSub} = require('@google-cloud/pubsub');
const http = require('http')
const fs = require('fs');

// Your Google Cloud Platform project ID
const projectId = process.env.GCP_PROJECT_ID;

// Instantiates a client
const pubsubClient = new PubSub({
  projectId: projectId,
});

// Get the port of Razer Chroma SDK REST API server
let razer_sdk_port;
fs.readFile('razer_sdk_port', 'utf8', (err, contents) => {
  if (err) {
    console.error(`Encountered error loading Razer SDK port: ${err}`)
    process.exit(1)
  }
  razer_sdk_port = parseInt(contents, 10);
});

async function createTopic(topicName) {
  await pubsubClient.createTopic(topicName);
  console.log(`Topic ${topicName} created.`);
}

function listenForMessages(subscriptionName) {
  // References an existing subscription
  const subscription = pubsubClient.subscription(subscriptionName);

  let messageCount = 0;
  const messageHandler = message => {
    console.log(`Received message ${message.id}:`);
    let color = JSON.parse(message.data).color;
    console.log(`\tNew Color: #${color}`)
    messageCount += 1;
    message.ack();

    // Convert RGB color representation into BGR
    color = parseInt(color, 16)
    let red = (color >> 16) & 0xFF;
    let green = (color >> 8) & 0xFF;
    let blue = (color >> 0) & 0xFF;
    let color_bgr = (blue << 16) | (green << 8) | (red << 0);

    const razer_sdk = `http://localhost:${razer_sdk_port}/chromasdk`
    for (let device of ['keyboard', 'headset']) {
      let r = http.request(`${razer_sdk}/${device}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      let payload = JSON.stringify({
        effect: 'CHROMA_STATIC',
        param: {
          color: color_bgr
        }
      });
      r.write(payload);
      r.end();
    }
  };

  subscription.on(`message`, messageHandler);
  console.log(`Connected to Google PubSub and listening for messages on ${subscriptionName}`)
}

createTopic(process.env.TOPIC_NAME)
listenForMessages(process.env.TOPIC_NAME)

// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');
const http = require('https');

// Your Google Cloud Platform project ID
const projectId = process.env.GCP_PROJECT_ID;

// Instantiates a client
const pubsubClient = new PubSub({
  projectId: projectId,
});

// Publish a pubsub message to a topic
async function publishMessage(topicName, data) {
  const dataBuffer = Buffer.from(data);

  const messageId = await pubsubClient
    .topic(topicName)
    .publisher()
    .publish(dataBuffer);
  console.log(`Message ${messageId} published.`);
}

// Convert human color name into an RGB hex value and
// publish it to the Pubsub topic.
function setHexColor(colorName) {
  http.get(encodeURI(`https://www.colorhexa.com/color.php?c=${colorName}`), (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
    }
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        // An incredibly fragile way to yoinketh the
        // hex color value from the page returned by colorhexa.com
        let hexColor = rawData.match(/hex [#]([0-9a-fA-F]+)/)
        pushMessage(hexColor[1])
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  }); 
}

function pushMessage(color) {
  const topicName = process.env.GCP_TOPIC_NAME;
  const data = JSON.stringify({ color: color });
  publishMessage(topicName, data);
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.setChromaColor = (req, res) => {
  // Does the query contain a color name value?
  let color = req.query.color || null;
  if (!color) {
    res.status(500).send(`No valid color name provided.`)
  }
  res.status(200).send(`OK, changing Chroma to ${color}`);
  setHexColor(color)
};

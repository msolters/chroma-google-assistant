# Razer Chroma - Google Assistant Integration

This repo contains the source code and instructions to configure your local Razer Chroma
gear to be color-controlled via Google Assistant voice commands.  The major components are as follows:

* IFTTT applet which detects Google Asst voice commands with a text ingredient (color) and makes a webhook containing the color that was said as a query parameter
* A local NodeJS script that should be run locally in bash.  I recommend Windows Linux Subsystem if you are on a Windows machine which most gamers probably are.
* A Google Cloud Function which you must install in GCP
* You will need to download a service account with Pubsub consumer privileges for the local NodeJS script

Here's the procedure to set up each piece.

# Create a Project
First of all, create a new project in Google Cloud Platform.  Put the project identifier into `config` by setting `GCP_PROJECT_ID`.  Activate the following APIs:
* Pubsub
* Google Cloud Functions

Create a service account that has the Pubsub Consumer role privileges.  Save the JSON file as `gcp-sa.json` and put it into the root of this repo.

## Google Cloud Function
Go into the Google Cloud Platform console and go to Google Cloud Functions.  Enable the API if you've never used it before.  We want to create a new NodeJS 8 Google Cloud Function.  The `package.json` will be the same as the one in the repo root.  Copy paste `cloud-function.js` as the source.  Make sure you set the following two environment variables as follows:

* `GCP_PROJECT_ID` - The Google Cloud Platform project identifier for the GCP project you intend to use
* `GCP_TOPIC_NAME` - The name of the Pubsub topic you want to use

The function you want to call is `setChromaColor`.

Once you have created the cloud function, go to "Trigger" and copy the provided `URL`.

## IFTTT
Make an IFTTT applet that connects Google Assistant and Webhooks.  You'll have to authorize IFTTT to be able to communicate with your Google account's Assistant.  The type of Google Assistant trigger we want is to capture a simple text ingredient.  The webhook is going to be the `URL` we grabbed in the last step, but with the added query `?color=$` where `$` is the IFTTT text ingredient variable.

The goal is to configure the Google Assistant language you want to use to communicate a new color for Chroma.  Then we need to create an HTTP request against our Google Cloud function, passing `?color=<the color used in the Assistant voice command>` along.

Example IFTTT webhook URL:
```
https://us-central1-myproject-579238.cloudfunctions.net/chroma-asst?color={{TextField}}
```

## Local Script
Make sure you update the project ID and topic name environment variables in `config`
```
npm install
./chroma-asst
```

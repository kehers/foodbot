const dbo = require('../lib/db.js')
    , Slack = require('./slack.js')
    , { WebClient } = require('@slack/client')
    ;


exports.updatePoll = async (team, token, data) => {
  try {
    const options = [];
    let i = 0;
    for (const option of data.options) {
      options.push({
                    text: {
                      type: "plain_text",
                      text: option,
                      emoji: true
                    },
                    value: `${i}`
                  });
      i++;
    }

    //console.log(options);return;
    const status = await dbo.db().collection('polls').updateOne({
      day: (new Date()).toDateString(),
      team
    }, {
      $set: {
        token,
        question: data.question,
        options: data.options,
        email: data.email,
        channel: data.channel
      }
    }, {
      upsert: true
    });

    const slackAPI = new WebClient(token);
    const response = await slackAPI.chat.postMessage({
          channel: data.channel
          , blocks: [{
            type: "section",
            text: {
              type: "mrkdwn",
              text: data.question
            }
          }, {
            type: "actions",
            elements: [
              {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Make your selection",
                  emoji: true
                },
                options
              }
            ]
          }]
        });

    return response;
  }
  catch(err) {
    err = (err.message) ? err.message : err;
    throw new Error(err);
  }
}

exports.todaysPoll = async(id) => {
  try {
    return await dbo.db().collection('responses').find({
      team: id,
      day: (new Date()).toDateString()
    }).toArray();
  }
  catch(err) {
    err = (err.message) ? err.message : err;
    throw new Error(err);
  }
}

exports.log = async(body) => {

  const user = body.user;
  const choice = body.actions[0].selected_option.value;

  try {
    // Get option
    const doc = await dbo.db().collection('polls').findOne({
      team: body.team.id,
      day: (new Date()).toDateString()
    });

    const slack = new WebClient(doc.token);

    // Closed?
    if (doc.closed) {
      return await slack.chat.postEphemeral({
        user: body.user.id
        , channel: body.channel.id
        , text: "FoodBot closed. No food for you 😛"
      });
    }

    await slack.chat.postEphemeral({
        user: body.user.id
        , channel: body.channel.id
        , text: "Your choice has been logged 💥"
      });
    const selection = doc.options[+choice];

    await dbo.db().collection('responses').updateOne({
      day: (new Date()).toDateString(),
      'user.id': user.id,
      team: body.team.id
    }, {
      $set: {
        selection,
        user
      }
    }, {
      upsert: 1
    });//*/
  }
  catch(err) {
    err = (err.message) ? err.message : err;
    throw new Error(err);
  }
}

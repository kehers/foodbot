const got = require('got')
    ;

exports.getChannels = async (token) => {
  try {
    const r = await got('https://slack.com/api/conversations.list', {
      query: {
        token: token,
        exclude_archived: true,
        types: 'public_channel',
        limit: 1000
      }, throwHttpErrors: false,
      json: true
    });

    const channels = r.body;
    if (!channels.channels)
      throw new Error('There has been an error getting your Slack channels');

    return channels.channels.map(channel => {
      return {
        id: channel.id,
        name: channel.name
      }
    });
  }
  catch(e) {
    throw e;
  }
}

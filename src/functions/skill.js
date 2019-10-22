const {URLSearchParams} = require( 'url' );
const {mappings} = require( '../mappings' );
const {skills} = require( '../skills' );
const https = require('https');
const url = require('url');

exports.handler = async function(event, context, callback) {
  const slackEndpoint = url.parse(process.env.SLACK_HOOK);

  const send = (data) => {
    const options = {
      hostname: slackEndpoint.hostname,
      port: 443,
      path: slackEndpoint.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, function (res) {
        let chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("error", (error)  =>{
          reject( error );
        });

        res.on("end", ()  =>{
          var body = Buffer.concat(chunks);
          resolve(body.toString());
        });
      });

      req.write(data);
      req.end();
    });
  }

  const textParser = /^(?<skill>\w*)\s?(?<check>\((?<level>\w*),\s(?<status>\w*)\)|check)?\s?(?<text>.*)?$/;
  const baseURL = 'https://disco-bot.netlify.com'; //process.env.URL;

  const params = new URLSearchParams(event.body);
  const query = params.get('text');
  const channelId = params.get('channel_id');

  const {groups} = textParser.exec(query);

  const skill = mappings.shortcuts[ groups.skill ] || groups.skill;

  const [ability] = Object.entries(mappings.ability).map(([key, value]) => {
    if( value.includes( skill ) ){
      return key;
    }
  }).filter(Boolean);
  const color = mappings.colors[ ability ];

  const username = [skills[skill].name.toUpperCase()]

  if( groups.check ){
    let status = groups.status;
    let level = groups.level;

    if( !level ){
      const levels = Object.keys(mappings.level);
      level = levels[Math.round(Math.random() * levels.length )];
    }

    if( !status ){
      status = Math.round( Math.random()) ? 'failure' : 'success';
    }

    username.push( `[${mappings.level[level]}: ${mappings.status[status]}]` );
  }

  let text = groups.text;

  if( !text ){
    const randomTextIndex = Math.round( Math.random() * (skills[skill].texts.length - 1 ));
    text = skills[skill].texts[ randomTextIndex ];
  }

  const icon = `${baseURL}/assets/skills/${skill}.png`;

  const response = await send(JSON.stringify({
    channel: channelId,
    username: username.join(' '),
    icon_url: icon,
    attachments: [
      {
        color,
        text,
      }
    ]
  }))
    .catch(error => {
      console.error( error );
      return 'fail'
    });

  return {
    statusCode: 200,
    body: response
  };
}

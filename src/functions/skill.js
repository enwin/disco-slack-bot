const {URLSearchParams} = require( 'url' );
const {mappings} = require( '../mappings' );
const {skills} = require( '../skills' );
const https = require('https');
const url = require('url');

exports.handler = async function(event, context, callback) {
  const handle = new class Handler {
    constructor(event, context, callback) {
      this.requestBody = event.body;
      this.baseURL = 'https://disco-bot.netlify.com'; //process.env.URL;

      this.parse();

      this.create();
    }

    create() {
      const skill = mappings.shortcuts[ this.groups.skill ] || this.groups.skill;

      const [ability] = Object.entries(mappings.ability).map(([key, value]) => {
        if( value.includes( skill ) ){
          return key;
        }
      }).filter(Boolean);

      const color = mappings.colors[ ability ];

      const username = [skills[skill].name.toUpperCase()];

      if( this.groups.check ){
        let status = this.groups.status;
        let level = this.groups.level;

        if( !level ){
          const levels = Object.keys(mappings.level);
          level = levels[Math.round(Math.random() * levels.length )];
        }

        if( !status ){
          status = Math.round( Math.random()) ? 'failure' : 'success';
        }

        username.push( `[${mappings.level[level]}: ${mappings.status[status]}]` );
      }

      let text = this.groups.text;

      if( !text ){
        const randomTextIndex = Math.round( Math.random() * (skills[skill].texts.length - 1 ));
        text = skills[skill].texts[ randomTextIndex ];
      }

      const icon = `${this.baseURL}/assets/skills/${skill}.jpg`;

      const message = {
        channel: this.params.channelId,
        username: username.join(' '),
        icon_url: icon
      };

      if( this.help ){
        // message.response_type = 'ephemeral';
        message.blocks = Object.entries(skills).map(([key, skill]) => {
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${skill.name.toUpperCase()}*\n${skill.description}`
            },
            accessory: {
              type: 'image',
              image_url: `${this.baseURL}/assets/skills/${key}.jpg`,
              alt_text: skill.name
            }
          };
        });

        message.blocks.splice(1)
      }
      else {
        message.attachments = [
          {
            color,
            text,
          }
        ]
      }

      this.message = message;
    }

    parse(){
      const textParser = /^(?<skill>\w*)\s?(?<check>\((?<level>\w*),\s(?<status>\w*)\)|check)?\s?(?<text>.*)?$/;

      const params = new URLSearchParams(this.requestBody);
      this.params = {
        query: params.get('text'),
        channelId: params.get('channel_id'),
        responseURL: params.get('response_url')
      }

      this.slackEndpoint = url.parse(this.params.responseURL);

      this.groups = {};

      if( this.params.query === 'help' ){
        this.help = true;
        this.groups.skill = 'encyclopedia';
        this.groups.check = true;
        this.groups.level = 'easy';
        this.groups.status = 'success';
      }
      else {
        this.groups = {
          ...this.groups,
          ...textParser.exec(this.params.query).groups
        };
      }
    }

    async respond() {
      const payload = JSON.stringify(this.message);

      console.log(JSON.stringify(this.message, null, 2))

      const response = await this.send(payload)
        .catch(error => {
          console.error( error );
          return false;
        });

      return {
        statusCode: response ? 200 : 500,
        body: ''
      }
    }

    send(data) {
      const options = {
        hostname: this.slackEndpoint.hostname,
        port: 443,
        path: this.slackEndpoint.path,
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
  }(event);

  return handle.respond();

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

  const skill = query === 'help' ? 'encyclopedia' : mappings.shortcuts[ groups.skill ] || groups.skill;

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

  const icon = `${baseURL}/assets/skills/${skill}.jpg`;

  const message = {
    channel: channelId,
    username: username.join(' '),
    icon_url: icon
  };

  if( query === 'help' ){
    message.blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Hello, Assistant to the Regional Manager Dwight! *Michael Scott* wants to know where you'd like to take the Paper Company investors to dinner tonight.\n\n *Please select a restaurant:*"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Farmhouse Thai Cuisine*\n:star::star::star::star: 1528 reviews\n They do have some vegan options, like the roti and curry, plus they have a ton of salad stuff and noodles can be ordered without meat!! They have something for everyone here"
        },
        "accessory": {
          "type": "image",
          "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
          "alt_text": "alt text for image"
        }
      },
    ];
  }
  else {
    message.attachments = [
      {
        color,
        text,
      }
    ]
  }

  const response = await send(JSON.stringify(message))
    .catch(error => {
      console.error( error );
      return false;
    });

  return {
    statusCode: response ? 200 : 500,
    body: ''
  };
}

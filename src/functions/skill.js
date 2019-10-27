const {URLSearchParams} = require( 'url' );
const {mappings} = require( '../mappings' );
const {skills} = require( '../skills' );
const https = require('https');
const url = require('url');

exports.handler = async function(event, context, callback) {
  const handle = new class Handler {
    constructor(event, context, callback) {
      this.requestBody = event.body;
      this.baseURL = process.env.URL;

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
        response_type: 'in_channel',
        channel: this.params.channelId,
        username: username.join(' '),
        icon_url: icon
      };

      if( this.help ){
        message.response_type = 'ephemeral';
        message.blocks = Object.entries(skills).map(([key, skill], index) => {
          const entry = [
            {
              "type": "divider"
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${skill.name.toUpperCase()}* ( \`\/disco ${key}\`)`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${skill.description}`
              },
              accessory: {
                type: 'image',
                image_url: `${this.baseURL}/assets/skills/${key}.jpg`,
                alt_text: skill.name
              }
            }
          ];
          return entry;
        }).reduce((a, b) => a.concat(b), []);

        message.blocks.unshift({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Welcome to this gritty world.*\nFrom here you\'ll have to start with a skill and then either a text or a check:\n\n*Command*\n_skill + text_\n`/disco rhetoric are you sure?`\n\n_skill + random check + text_\n`/disco rhetoric check are you sure?`\n\n_skill + check + text_\n`/disco rhetoric (easy, failure) are you sure?`\n\n*Check options*\n`easy`,`medium`,`challenging`,`legenday`,` heroic`\n\n*Status*\n`success`,`failure`'
          }
        })
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
}

const {URLSearchParams} = require( 'url' );
const {mappings} = require( '../mappings' );
const {skills} = require( '../skills' );

exports.handler = function(event, context, callback) {
  const textParser = new RegExp("^(?<skill>\\w*)\\s?(?<check>\\((?<level>\\w*),\\s(?<status>\\w*)\\)|check)?\\s?(?<text>.*)?$");
  const baseURL = process.env.URL;

  const params = new URLSearchParams(event.body);
  const query = params.get('text')

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

  callback( null, {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      response_type: 'in_channel',
      username: username.join(' '),
      icon_url: icon,
      attachments: [
        {
          color,
          text,
        }
      ]
    })
  });
}

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var url = _interopDefault(require('url'));

var mappings_1 = {
  ability: {
    intellect: [
      'logic',
      'encyclopedia',
      'rethoric',
      'drama',
      'conceptualization',
      'visualCalculus'
    ],
    psyche: [
      'volition',
      'inlandEmpire',
      'empathy',
      'authority',
      'espritDeCorps',
      'suggestion'
    ],
    physique: [
      'endurance',
      'painThreshold',
      'physicalInstrument',
      'electrochemistry',
      'shivers',
      'halfLight'
    ],
    motorics: [
      'handEyeCoordination',
      'perception',
      'reactionSpeed',
      'savoirFaire',
      'interfacing',
      'composure'
    ],
  },
  colors: {
    intellect: '#7cb4bf',
    psyche: '#6751b2',
    physique: '#9e4265',
    motorics: '#c3aa4f'
  },
  level: {
    easy: 'Easy',
    medium: 'Medium',
  },
  shortcuts: {
    coordination: 'handEyeCoordination',
    esprit: 'espritDeCorps',
    inland: 'inlandEmpire',
    pain: 'painThreshold',
    reaction: 'reactionSpeed',
  },
  status: {
    failure: 'Failure',
    success: 'Success'
  }
};

var mappings = {
	mappings: mappings_1
};

var encyclopedia_1 = {
  name: 'Encyclopedia',
  texts: [
    'That isn’t *just* a five-pointed star -- it’s an inverted white pentagram cradled in a wreath of antlers. The iconography of communism, in other words.'
  ]
};

var encyclopedia = {
	encyclopedia: encyclopedia_1
};

var reactionSpeed_1 = {
  name: 'Reaction speed',
  texts: []
};

var reactionSpeed = {
	reactionSpeed: reactionSpeed_1
};

const {encyclopedia: encyclopedia$1} = encyclopedia;
const {reactionSpeed: reactionSpeed$1} = reactionSpeed;

var skills_1 = {
  encyclopedia: encyclopedia$1,
  reactionSpeed: reactionSpeed$1
};

var skills = {
	skills: skills_1
};

const {URLSearchParams} = url;
const {mappings: mappings$1} = mappings;
const {skills: skills$1} = skills;

const textParser = /^(?<skill>\w*)\s?(?<check>(\((?<level>\w*),\s(?<status>\w*)\))|check)?\s?(?<text>.*)?$/;
const baseURL = process.env.URL;

var handler = function(event, context, callback) {
  const params = new URLSearchParams(event.body);
  const query = params.get('text');

  const {groups} = textParser.exec(query);
  const skill = mappings$1.shortcuts[ groups.skill ] || groups.skill;

  const [ability] = Object.entries(mappings$1.ability).map(([key, value]) => {
    if( value.includes( skill ) ){
      return key;
    }
  }).filter(Boolean);
  const color = mappings$1.colors[ ability ];

  const username = [skills$1[skill].name.toUpperCase()];

  if( groups.check ){
    let status = groups.status;
    let level = groups.level;

    if( !level ){
      const levels = Object.keys(mappings$1.level);
      level = levels[Math.round(Math.random() * levels.length )];
    }

    if( !status ){
      status = Math.round( Math.random()) ? 'failure' : 'success';
    }

    username.push( `[${mappings$1.level[level]}: ${mappings$1.status[status]}]` );
  }

  let text = groups.text;

  if( !text ){
    const randomTextIndex = Math.round( Math.random() * (skills$1[skill].texts.length - 1 ));
    text = skills$1[skill].texts[ randomTextIndex ];
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
};

var skill = {
	handler: handler
};

exports.default = skill;
exports.handler = handler;

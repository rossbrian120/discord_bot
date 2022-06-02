"use strict";

// TO DO: fix genderless thing

const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  MessageAttachment, MessageEmbed, MessageActionRow, MessageButton
} = require('discord.js');
const Canvas = require('canvas');
const { async_query } = require('../db/scripts/db_funcs.js')
const { getCaptureDifficulty, getShinyAttachment } = require('../assets/pokemon/poke_funcs.js');
const assets_dir = './assets/pokemon/';
const config = require('../assets/pokemon/poke_info.json')
const f = require('../funcs.js');
const streak = [
  {"rarities": ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "cash": 200},
  {"rarities": ["1", "2", "3", "4", "5", "6", "7", "8"], "cash": 225},
  {"rarities": ["1", "2", "3", "4", "5", "6", "7", "8"], "cash": 250},
  {"rarities": ["1", "2", "3", "4", "5", "6", "7"], "cash": 300},
  {"rarities": ["1", "2", "3", "4", "5", "6", "7"], "cash": 350},
  {"rarities": ["1", "2", "3", "4", "5", "6"], "cash": 400}
]
const continents = {
  'I':'in Kanto',
  'II':'in Johto',
  'III':'in Hoenn',
  'IV':'in Sinnoh',
  'V':'in Unova',
  'VI':'in Kalos',
  'VII':'in Alola',
  'any':'all over the place',
}
var description = "Throw a ball to try capturing the Pokemon! Throwing a ";
description += "Pokeball rolls two 6-sided dice. If their sum matches or ";
description += "exceeds the Pokemon's capture difficulty, you'll catch it! ";
description += "Throwing a Great Ball takes the highest two of three dice, and ";
description += "throwing an Ultra Ball takes the highest two of four.\n\n";
description += "But remember, you have limited balls, and the pokmeon runs away if you take too long!"

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

async function generate_embed(interaction, generation, curr_epoch_s) {
  // Get cutoffs.
  let chunk = new Date(curr_epoch_s * 1000);
  chunk.setHours(0);
  chunk.setMinutes(0);
  chunk.setSeconds(0);
  chunk.setDate(chunk.getDate() + 1)
  let n_epoch = chunk.getTime();
  chunk.setDate(chunk.getDate() - 1)
  let l_epoch = chunk.getTime();
  chunk.setDate(chunk.getDate() - 1);
  let miss = chunk.getTime();

  // TO DO: ADD LOGIC FOR STREAK RESET

  let pokemon, captureDifficulty, traits, isShiny, shinyShift, gender, gender_symbol, rem_freqs;
  let user_id = interaction.user.id;
  let new_streak = 0;

  // Find out if they can train
  let trainer_query = 'SELECT * FROM data.pokemon_trainers WHERE userId = ?;';
  let trainer_result = await async_query(trainer_query, [user_id]);
  let can_train = (trainer_result.length === 0 || trainer_result[0].lastTrainEpoch * 1000 < l_epoch);
  if (trainer_result.length == 0 || trainer_result[0].lastTrainEpoch * 1000 < miss) {
    new_streak = 0
  } else {
    new_streak = trainer_result[0].trainStreak;
  }
  // can_train = (interaction.user.id == 790037139546570802) ? true : can_train;

  // Get owned pokemon
  let owned_query = "SELECT nick FROM data.pokemon_encounters WHERE userId = ? AND owned = 1;";
  let owned_pokemon_result = await async_query(owned_query, [user_id]) // determines if we have too many pokemon
  let owned_pokemon = owned_pokemon_result.length;
  let can_catch = (trainer_result.length === 0 || owned_pokemon < trainer_result[0].slots);

  // Get ball quantities
  let pokeballs = 15;
  let greatballs = 3;
  let ultraballs = 1;
  let omegaballs = 0;
  if (trainer_result.length > 0) {
    pokeballs = trainer_result[0].pokeballs;
    greatballs = trainer_result[0].greatballs;
    ultraballs = trainer_result[0].ultraballs;
    omegaballs = trainer_result[0].omegaballs;
  }

  // Get pokemon if catching is possible, then see what pokemon appears
  if (!can_train) {
    let remaining_seconds = Math.floor((n_epoch - curr_epoch_s * 1000) / 1000);
    let minutes = Math.floor(remaining_seconds / 60);
    let seconds = Math.floor(remaining_seconds - (minutes * 60));
    return [{content: `You have to wait ${minutes} minutes and ${seconds} seconds to train another Pokemon!`},{}]
  } else {
    let allowed_freqs = streak[Math.min(new_streak, 5)].rarities;
    rem_freqs = config.frequencies.filter(item => allowed_freqs.includes(item));
    let frequency = f.shuffle(rem_freqs)[0];
    let pkmn_query = 'SELECT * FROM data.pokedex WHERE frequency = ? '
    let values = [parseInt(frequency)];
    if (generation != 'any') {
      pkmn_query += 'AND gen = ? '
      values.push(generation)
    }
    pkmn_query += 'ORDER BY RAND() LIMIT 1;'
    let pokemon_result = await async_query(pkmn_query, values);
    pokemon = pokemon_result[0];

    // Now we can update or insert after collecting capture difficulty/traits
    let update_query, update_vals;
    captureDifficulty = await getCaptureDifficulty(frequency)
    traits = f.shuffle(config.characteristics).slice(0, 2);
    isShiny = Math.floor(Math.random() * 20) == 0;
    if (isShiny) {
      shinyShift = Math.floor((Math.random() * 66 + 16) * 3.6);
    } else {
      shinyShift = 0;
    }
    if (!(pokemon.pctMale == null)) {
      let rand = Math.random()
      gender = rand <= (pokemon.pctMale / 100) ? 'male' : 'female';
      gender_symbol = rand <= (pokemon.pctMale / 100) ? '\\♂' : '\\♀';
    } else {
      gender = 'unknown'
      gender_symbol = ''
    }

    update_query = `
    INSERT INTO data.pokemon_encounters (userId, pokemonId, name, nick,
      level, gender, pokemonChar1, pokemonChar2, isShiny, shinyShift, attempted,
      caught, owned, captureDifficulty, slot, epoch, isTraining)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    update_vals = [user_id, pokemon.pokemonId, pokemon.name, pokemon.name + Math.ceil(Math.random() * 1000),
      1, gender, traits[0], traits[1], isShiny, shinyShift, '',
      0, 0, captureDifficulty, Math.ceil(Math.random() * 1000000), curr_epoch_s, 1];
    await async_query(update_query, update_vals);
  }

  // Get image
  let filename = pokemon.pokemonId.toString().padStart(3, '0') + '.png';
  let img_src = assets_dir + 'thumbnails/' + filename;
  let image;
  if (isShiny) {
    image = await getShinyAttachment(img_src, filename, shinyShift)
  } else {
    image = new MessageAttachment(img_src, filename);
  }

  let header = `
  You decide to train your pokemon ${continents[generation]} and they all gain one level!\
  Because of how hard you've been training (Streak: ${new_streak} days)\
  you've earned ₽${streak[Math.min(new_streak, 5)].cash}\
  today. You've also gotten better at finding rare Pokemon, and are guaranteed\
  to find Pokemon during this training with a minimum rarity of:\
  ${config.rarities[getMaxOfArray(rem_freqs)]}!\n\n`;
  let footer = `
  `;

  // Embed assembly
  const embed = new MessageEmbed()
    .setTitle(`Wild ${pokemon.name}${gender_symbol} appeared!`)
    .setColor(config.types[pokemon.type1].color)
    .addField('Rarity', config.rarities[pokemon.frequency.toString()], true)
    .addField("Capture Difficulty", captureDifficulty.toString() + ' / 12', true)
    .addField("Characteristics", "`" + traits[0] + "`, `" + traits[1] + "`", true)
    .setDescription(header + description)
    .setThumbnail('attachment://' + filename);
  const buttons = new MessageActionRow();
  const poke = new MessageButton()
    .setCustomId(`p_catch_poke,${interaction.id}`)
    .setLabel(`Pokeball (${pokeballs})`)
    .setStyle('SUCCESS');
  if (pokeballs === 0 || !can_catch) {poke.setDisabled(true)}
  const great = new MessageButton()
    .setCustomId(`p_catch_great,${interaction.id}`)
    .setLabel(`Great Ball (${greatballs})`)
    .setStyle('SUCCESS');
  if (greatballs === 0 || !can_catch) {great.setDisabled(true)}
  const ultra = new MessageButton()
    .setCustomId(`p_catch_ultra,${interaction.id}`)
    .setLabel(`Ultra Ball (${ultraballs})`)
    .setStyle('SUCCESS');
  if (ultraballs === 0 || !can_catch) {ultra.setDisabled(true)}
  const omega = new MessageButton()
    .setCustomId(`p_catch_omega,${interaction.id}`)
    .setLabel(`Omega Ball (${omegaballs})`)
    .setStyle('SUCCESS');
  if (omegaballs === 0 || !can_catch) {omega.setDisabled(true)}
  const decline = new MessageButton()
    .setCustomId(`p_catch_decline,${interaction.id}`)
    .setLabel("I'm afraid...")
    .setStyle('DANGER');
  buttons.addComponents(poke, great, ultra, omega, decline);

  return ([{
    embeds: [embed],
    files: [image],
    components: [buttons],
    ephemeral: false,
    fetchReply: true
  }, {
    pokeballs: pokeballs,
    greatballs: greatballs,
    ultraballs: ultraballs,
    omegaballs: omegaballs,
    pokemon: pokemon,
    captureDifficulty: captureDifficulty,
    traits: traits,
    isShiny: isShiny,
    shinyShift: shinyShift,
    owned_pokemon: owned_pokemon,
    cash: streak[Math.min(new_streak, 5)].cash,
    trainStreak: new_streak
  }])

}


module.exports = {
	type: "private",
  cat: "games",
  desc: "Train your pokemon in the wild!",
	data: new SlashCommandBuilder()
		.setName('ptrain')
		.setDescription('Train your pokemon in the wild!')
    .addStringOption(option => option
      .setName('generation')
      .setDescription('Select gen to train amongst!')
      .addChoices({name:'Gen I', value:'I'}).addChoices({name:'Gen II', value:'II'})
      .addChoices({name:'Gen III', value:'III'}).addChoices({name:'Gen IV', value:'IV'})
      .addChoices({name:'Gen V', value:'V'}).addChoices({name:'Gen VI', value:'VI'})
      .addChoices({name:'Gen VII', value:'VII'}).addChoices({name:'Any Gen', value:'any'})
    ),
	async execute(interaction) {
    // First, level up the pokemon.
    let lvl_q = "UPDATE data.pokemon_encounters SET level = LEAST(100, level + 1) WHERE userId = ? AND owned = 1;";
    await async_query(lvl_q, [interaction.user.id]);
    let curr_epoch_s = Math.floor(new Date().getTime() / 1000);
    let generation = interaction.options.getString('generation') ?? 'any';
    let response = await generate_embed(interaction, generation, curr_epoch_s);
    let reply_content = response[0];
    let catch_data = response[1];

    if (!("content" in reply_content)) {
      interaction.reply(reply_content);
      let filter = button => button.customId.includes(interaction.id);
      let collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 120 * 1000 });
      let responded = false;
      let new_row = new MessageActionRow();
      let row = reply_content.components[0].components;
      for (let i = 0; i < row.length; i++) {
        row[i].setDisabled(true);
        new_row.addComponents(row[i]);
      }
      let trainer_update = `
        INSERT INTO data.pokemon_trainers
        (userId, pokeballs, greatballs, ultraballs, omegaballs, trainStreak, cash, lastTrainEpoch)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          pokeballs = ?,
          greatballs = ?,
          ultraballs = ?,
          omegaballs = ?,
          trainStreak = ?,
          cash = cash + ?,
          lastTrainEpoch = ?
      ;`;

      collector.on('collect', i => {
        if (i.user.id === interaction.user.id) {

          // Catch logic, correct person responded
          let content = 'Your roll: ';
          let dice = 2;
          let roll_arr = [];
          if (i.customId.split(',')[0] == 'p_catch_decline') {
            content = 'You ran away from the wild Pokemon!'
          } else if (i.customId.split(',')[0] == 'p_catch_poke') {
            catch_data.pokeballs -= 1;
          } else if (i.customId.split(',')[0] == 'p_catch_great') {
            catch_data.greatballs -= 1;
            dice += 1;
          } else if (i.customId.split(',')[0] == 'p_catch_ultra') {
            catch_data.ultraballs -= 1;
            dice += 2;
          } else if (i.customId.split(',')[0] == 'p_catch_omega') {
            catch_data.omegaballs -= 1;
            dice += 4;
          }
          if (i.customId.split(',')[0] != 'p_catch_decline') {
            // Non-decline branch, encounter updates necessary.
            for (let i = 0; i < dice; i++) {
              roll_arr.push(Math.ceil(Math.random() * 6));
              content += '`' + roll_arr[i] + '`, '
            }
            content += "giving you a total of `"
            let final_query;
            roll_arr.sort(function(a, b){return b-a});
            let rolls = roll_arr.slice(0, 2);
            let total_rolls = rolls[0] + rolls[1];
            content += total_rolls + '`. '
            let encounter_update_q = "UPDATE data.pokemon_encounters SET attempted = ?, owned = ?, caught = ? WHERE userId = ? AND epoch = ? AND name = ?;";
            let encounter_update_v = [i.customId.split(',')[0].split('_')[2]]
            if (total_rolls >= catch_data.captureDifficulty) {
              content += `You caught the wild ${catch_data.pokemon.name}!`
              encounter_update_v = encounter_update_v.concat([1, 1, interaction.user.id, curr_epoch_s, catch_data.pokemon.name])
            } else {
              content += `Oh no! The wild ${catch_data.pokemon.name} escaped!`
              encounter_update_v = encounter_update_v.concat([0, 0, interaction.user.id, curr_epoch_s, catch_data.pokemon.name])
            }
            async_query(encounter_update_q, encounter_update_v);
          }
          // All branches, decline included get trainer table update.
          i.reply({ content: content, ephemeral: false });
          interaction.editReply({ components: [new_row] })
          responded = true;
          let trainer_update_vals = [interaction.user.id, catch_data.pokeballs,
            catch_data.greatballs, catch_data.ultraballs, catch_data.omegaballs,
            catch_data.trainStreak + 1, catch_data.cash, curr_epoch_s];
          async_query(trainer_update, trainer_update_vals.concat(trainer_update_vals.slice(1)));
        } else {
          // Wrong person responded
          i.reply({ content: "That's not your pokemon to catch!", ephemeral: false });
        }
      });

      collector.on('end', collected => {
        if (!responded) {
          interaction.editReply({ components: [new_row] })
          interaction.channel.send("The pokemon got away!")
          let trainer_update_vals = [interaction.user.id, catch_data.pokeballs,
            catch_data.greatballs, catch_data.ultraballs, catch_data.omegaballs,
            catch_data.trainStreak + 1, catch_data.cash, curr_epoch_s];
          async_query(trainer_update, trainer_update_vals.concat(trainer_update_vals.slice(1)));
        }
      });

    } else {
      // Something went wrong, you used /pcatch too soon or are full up on 'mons
      interaction.reply(reply_content);
    }
	}
};
"use strict";
//
const { async_query } = require('../db/scripts/db_funcs.js')
const { start_round } = require('../scripts/wwtbam_start_round.js')
const {
  MessageAttachment, MessageEmbed, MessageActionRow, MessageButton
} = require('discord.js');

const assets_dir = './assets/wwtbam/';
const cletus_name = 'cletus.png'
const cletus_path = assets_dir + cletus_name;
const zodiac_name = 'zodiac.png'
const zodiac_path = assets_dir + cletus_name;
const owl_name = 'owl.png'
const owl_path = assets_dir + owl_name;
const cletus = new MessageAttachment(cletus_path, cletus_name);
const zodiac = new MessageAttachment(zodiac_path, zodiac_name);
const owl = new MessageAttachment(owl_path, owl_name);

function identify_correct_answer(interaction) {
  for (let i = 0; i < 4; i++) {
    if (interaction.message.components[0].components[i].customId === 'wwtbam_t') {
      return interaction.message.components[0].components[i].label
    }
  }
}

function update_lifelines(row_components, id) {
  const new_options = new MessageActionRow();
  for (let i = 0; i < row_components.length; i++) {
    if (row_components[i].customId === id) {
      new_options.addComponents(row_components[i].setDisabled(true))
    } else {
      new_options.addComponents(row_components[i])
    }
  }
  console.log(new_options)
  return new_options;
}

function call_a_friend(correct_answer) {
  let luck_val = Math.random();
  let rem_letters = ['A', 'B', 'C', 'D']
  rem_letters.splice(rem_letters.indexOf(correct_answer), 1);
  if (luck_val < .2) {
    let identified_answer = rem_letters[Math.floor(Math.random()*rem_letters.length)]
    var flavor_text = `You decide to call your middle school buddy, Cletus.\
    He picks up the phone and you can barely make out what he's saying. It\
    sounds like he's in an argument with his wife, and neither of them sound\
    sober. Eventually he calms down enough for you to explain the situation\
    and read the question to him.

    _"Look buddy. I ain't some kinda know-a-lot guy, but all I know is it's\
    definitely not ` + identified_answer + ".\"_";
    var file = cletus;
    var filename = cletus_name;
  } else if (luck_val < .75) {
    if (['B', 'C'].includes(correct_answer)) {
      var identified_answers = 'B or C'
    } else {
      var identified_answers = 'A or D'
    }
    var flavor_text = `You decide to call your pen pal, the Zodiac Killer. He\
    picks up and all you can hear is deep breathing and what sounds like latin.\
    Suddenly he shouts out a sequence of letters and symbols:\

    _"+ H E G < V ¶ A + ⌖ P X < ∧ B E O + X H ⌖"_

    He then makes a loud kissing noise and hangs up. You know from your\
    correspondence with him that this means he's confident the answer is\
    ` + identified_answers + '.';
    var file = zodiac;
    var filename = zodiac_name;
  } else {
    if (Math.random() <= 0.9) {
      var identified_answer = correct_answer;
    } else {
      var identified_answer = rem_letters[Math.floor(Math.random()*rem_letters.length)];
    }
    var flavor_text = `You decide to call your ophthalmologist, Hooty the\
    talking owl. He claims to be in the middle of an important surgery, but\
    you promise to give him a dead field mouse if he helps you and he\
    reluctantly agrees.

    _"Well," he begins, "you certainly called the right owl! I happened to\
    study this subject greatly when I was a hatchling, and I'm something of an\
    expert! Absolutely, unequivocally and without a single doubt, the answer\
    must be ` + identified_answer + ".\"_";
    var file = owl;
    var filename = owl_name;
  }
  const embed = new MessageEmbed()
    .setTitle(`Phoning a friend`)
    .setColor("#6622AA")
    .setThumbnail('attachment://' + filename)
    .setDescription(flavor_text);
  return [embed, file];
}

module.exports = {
  identify_correct_answer,
	async execute(interaction) {
    let answer_letter = identify_correct_answer(interaction);
    let reply_opts = call_a_friend(answer_letter);
    interaction.reply({embeds: [reply_opts[0]], files: [reply_opts[1]]})
    }
}


module.exports = {
  identify_correct_answer, update_lifelines,
	async execute(interaction) {
    console.log('componetts\n',interaction.message.components)
    let query = "SELECT * FROM data.wwtbam_status WHERE channelId = ?";
    let values = [interaction.channelId];
    let status = await async_query(query, values);
    if (status[0].userId !== interaction.user.id) {
      interaction.reply({
        content: "You're not even playing!",
        ephemeral: true
      })
    } else if (status[0].is_available_friend === 0) {
      interaction.reply({
        content: "That lifeline isn't available!",
        ephemeral: true
      })
    } else if (status[0].is_available_friend === 1) {
      let answer_letter = identify_correct_answer(interaction);
      let reply_opts = call_a_friend(answer_letter);
      let lifes = update_lifelines(
        interaction.message.components[1].components, 'wwtbam_friend'
      )
      console.log("here are the two components we're trying to use", interaction.message.components[0], lifes)
      interaction.update({
        components: [interaction.message.components[0], lifes]
      })
      interaction.followUp({embeds: [reply_opts[0]], files: [reply_opts[1]]})
      query = 'UPDATE data.wwtbam_status SET channelId = ?, guildId = ?, ';
      query += 'userId = ?, status = ?, question_num = ?, is_available_50_50 =';
      query += ' ?, is_available_audience = ?, is_available_friend = ?, ';
      query += 'updatedAt = ? WHERE channelId = ?;';
      values = Object.values(status[0])
      values[7] = 0;
      values.push(values[0])
      async_query(query, values);
    } else {
      console.log("You should never see this message (audience is disabled).")
    }
  }
}

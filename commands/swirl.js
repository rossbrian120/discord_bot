"use strict";

const Discord = require("discord.js");
const im = require('imagemagick');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { get_msgs, get_img_details } = require('../assets/img_manip/funcs.js');


module.exports = {
  type: "private",
  cat: "utility",
  desc: "Swirl the last posted image.",
	data: new SlashCommandBuilder()
		.setName('swirl')
		.setDescription('Swirl the last posted image.')
    .addIntegerOption(option => option
      .setName('amount')
      .setDescription('Amount of swirl in degrees (-1080 to 1080, default: 90).')
    ),
	async execute(interaction) {
    await interaction.deferReply();
    let amount = interaction.options.getInteger('amount') ?? 90;
    if (Math.abs(amount) > 1080) {
      interaction.reply("That's too much swirl!")
      return;
    }
    let img_details = await get_img_details(await get_msgs(interaction));
    if (img_details.width * img_details.height > 2000 * 2500) {
      interaction.editReply("Sorry, that image is too big for me to swirl :(")
      return;
    }
    console.log(img_details);
    im.convert([img_details.url, '-swirl', `${amount}`, '-'],
    function(err, stdout) {
      if (err) {
        console.log("error", err.message); throw err;
      }
      const buf1 = Buffer.from(stdout, 'binary');
      let attach = new Discord.MessageAttachment(buf1, 'swirl.png')
      interaction.editReply({ files: [attach], ephemeral: false });
    });
  }
}

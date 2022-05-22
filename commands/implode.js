"use strict";

// Imports
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const { get_msgs, get_img_details } = require('../assets/img_manip/funcs.js');
const im = require('imagemagick');

module.exports = {
  type: "private",
  cat: "utility",
  desc: "Implode the last image.",
	data: new SlashCommandBuilder()
		.setName('implode')
		.setDescription('Implode the last image.')
    .addIntegerOption(option => option
      .setName('factor')
      .setDescription('Amount of implosion. Try -10 for a bulge, 10 for an implode.')
    ),
	async execute(interaction) {
    await interaction.deferReply();
    let factor = interaction.options.getInteger('factor') ?? 10;
    factor = factor / 10;
    console.log(factor);
    let img_details = await get_img_details(await get_msgs(interaction));
    console.log(img_details)
    if (img_details.width * img_details.height > 2000 * 2500) {
      interaction.editReply("Sorry, that image is too big for me to implode :(")
      return;
    }
    im.convert([img_details.url, '-implode', factor.toString(), '-'],
    function(err, stdout) {
      if (err) {
        console.log("error", err.message); throw err;
      }
      const buf1 = Buffer.from(stdout, 'binary');
      let attach = new Discord.MessageAttachment(buf1, 'implode.png')
      interaction.editReply({ files: [attach], ephemeral: false });
    });
  }
}

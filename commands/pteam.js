"use strict";

// Constants
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const Canvas = require('canvas');
const { async_query } = require('../db/scripts/db_funcs.js')
const assets_dir = './assets/pokemon/thumbnails/';
const f = require('../funcs.js');
const { getHueMatrix, applyHueMatrix } = require('../assets/pokemon/poke_funcs.js');

async function getTeamPic(full_path_arr, filename_arr, shinyShift_arr) {
  let canvas;
  if (full_path_arr.length <= 6) {
    canvas = Canvas.createCanvas(600, 100);
  } else {
    canvas = Canvas.createCanvas(600, 200);
  }
	const ctx = canvas.getContext('2d');
  for (let i = 0; i < full_path_arr.length; i++) {
    let y_start = (i <= 5) ? 0 : 100;
    let x_pnlty = (i <= 5) ? 0 : -600
    let img = await Canvas.loadImage(full_path_arr[i]);
    ctx.drawImage(img, i * 100 + x_pnlty, y_start, 100, 100);
    if (shinyShift_arr[i] != 0) {
      let img_data = ctx.getImageData(i * 100 + x_pnlty, y_start, 100, 100);
      let new_img_data = ctx.getImageData(i * 100 + x_pnlty, y_start, 100, 100);
      for (let j = 0; j < 100 * 100; j++) {
        let matrix = getHueMatrix(shinyShift_arr[i])
        let pos = j * 4;
        let new_rgb = applyHueMatrix(matrix, img_data.data[pos], img_data.data[pos+1], img_data.data[pos+2]);
        new_img_data.data[pos] = new_rgb[0];
        new_img_data.data[pos+1] = new_rgb[1];
        new_img_data.data[pos+2] = new_rgb[2];
      }
      ctx.putImageData(new_img_data, i * 100 + x_pnlty, y_start)
    }
  }
  let attach = new MessageAttachment(canvas.toBuffer(), 'team_pic.png');
  return attach
}

module.exports = {
  type: "private",
  cat: "games",
  desc: "See your Pokemon team!",
	data: new SlashCommandBuilder()
		.setName('pteam')
		.setDescription('Show your Pokemon team!')
    .addUserOption(option => option
      .setName('target')
      .setDescription('Pokemon team to look at (defaults to your own)')
      .setRequired(false)
    ),
	async execute(interaction) {
    let user = interaction.options.getUser('target') ?? interaction.user;
    let query = "SELECT * FROM data.pokemon_encounters WHERE userId = ? AND owned = 1 ORDER BY slot ASC;";
    let values = [user.id]
    let team = await async_query(query, values);
    if (team.length === 0) {
      interaction.reply("You don't have any Pokemon! Try catching one with `/pcatch`!");
    } else {

      let full_path_arr = [];
      let filename_arr = [];
      let shinyShift_arr = [];
      let filename;
      let desc = '';
      let gender_symbol = '';
      for (let i = 0; i < team.length; i++) {
        let pokemon = team[i];
        filename = pokemon.pokemonId.toString().padStart(3, '0') + '.png'
        full_path_arr.push(assets_dir + filename);
        filename_arr.push(filename);
        shinyShift_arr.push(pokemon.shinyShift);
        if (pokemon.gender == 'male') {
          gender_symbol = '\♂';
        } else if (pokemon.gender == 'female') {
          gender_symbol = '\♀';
        }
        desc += (i + 1) + '. ' + pokemon.nick + ' | ' + pokemon.name + `\\${gender_symbol}`;
        desc += " | Lvl. " + (pokemon.level);
        desc += " | `" + pokemon.pokemonChar1 + "`, `" + pokemon.pokemonChar2 + "`\n"
      }
      let team_pic = await getTeamPic(full_path_arr, filename_arr, shinyShift_arr);
      const embed = new MessageEmbed()
        .setTitle(`${user.username}'s Pokemon team!`)
        .setColor("#c03028")
        .setDescription(desc)
        .setImage('attachment://team_pic.png');
      interaction.reply({ embeds: [embed], files: [team_pic] })
    }
	}
};

"use strict";

// Imports
const f = require('../../funcs.js');
const fs = require('fs');
const seedrandom = require('seedrandom')
const Discord = require('discord.js');
const record_filename = './f_record.json';
const record_filename_full = './scripts/fruitymon/f_record.json';
var f_record = require(record_filename);
var animal_stats = require('./animal_stats.json');
let fill = '\u200b';
const rare_pet_prob = 1/8; // Usually 1/8
const rare_variant_prob = 1/3; // Usually 1/3

// Define pet quirks
let late_bloomer = {
  "str": "Late Bloomer",
  "proper": "Late Bloomer",
  "effects": {"hours_to_maturity": 3}
};
let precocious = {
  "str": "precocious",
  "proper": "Precocious",
  "effects": {"hours_to_maturity": 0.25}
};
let productive = {
  "str": "productive",
  "proper": "Productive",
  "effects": {"base_speed": 1.5}
};
let prodigious = {
  "str": "prodigious",
  "proper": "Prodigious",
  "effects": {"base_speed": 2}
};
let lazy = {
  "str": "lazy",
  "proper": "Lazy",
  "effects": {"base_speed": 0.5}
};
let hearty = {
  "str": "hearty",
  "proper": "Hearty",
  "effects": {"base_health": 10}
};
let beast = {
  "str": "beast",
  "proper": "Beast",
  "effects": {"base_health": 15}
};
let frail = {
  "str": "frail",
  "proper": "Frail",
  "effects": {"base_health": -10}
};
let artisan = {
  "str": "artisan",
  "proper": "Artisan",
  "effects": {"base_freq": 2}
};
let basic = {
  "str": "basic",
  "proper": "Basic",
  "effects": {"base_freq": -10}
};
let meaty = {
  "str": "meaty",
  "proper": "Meaty",
  "effects": {"base_spoils": 4}
};
let gourmet = {
  "str": "gourmet",
  "proper": "Gourmet",
  "effects": {"base_spoils": 8}
};
let skeletal = {
  "str": "skeletal",
  "proper": "Skeletal",
  "effects": {"base_spoils": 0.5}
};
let hoarder = {
  "str": "hoarder",
  "proper": "Hoarder",
  "effects": {"capacity": 2}
};
let incredible = {
  "str": "incredible",
  "proper": "Incredible",
  "effects": {
    "hours_to_maturity": 0.5, "base_speed": 1.25,
    "base_health": 5, "base_spoils": 4
  }
};
let ultimate = {
  "str": "ultimate",
  "proper": "Ultimate",
  "effects": {
    "hours_to_maturity": 0.25, "base_speed": 2,
   "base_health": 15, "base_spoils": 8
  }
};
let worthless = {
  "str": "worthless",
  "proper": "Worthless",
  "effects": {
    "hours_to_maturity": 4, "base_speed": 0.5,
   "base_health": -10, "base_spoils": 0.5
  }
};
let comfy = {
  "str": "comfy",
  "proper": "Comfy",
  "effects": {
    "hours_to_maturity": 1.5, "base_speed": 0.5, "base_freq": 3
  }
};
let fat = {
  "str": "fat",
  "proper": "Fat",
  "effects": {
    "base_health": 15, "base_speed": 0.75
  }
};
let hurried = {
  "str": "fat",
  "proper": "Fat",
  "effects": {
    "base_freq": -1, "base_speed": 1.5
  }
};
let animal_quirks = [
  worthless, ultimate, incredible, skeletal, gourmet, meaty, basic, artisan,
  frail, beast, hearty, lazy, prodigious, productive, precocious, late_bloomer,
  comfy, fat, hurried
]

function generatePets(msg, user_specific=false) {
  let pet_array = [];
  let d = new Date();
  let date_int = Math.floor(d/8.64e7) - 18741;
  let user_int = 0;
  if (user_specific) {
    user_int = 2;
  }
  let keys = Object.keys(animal_stats)
  pet_array.push(keys[(date_int + user_int) % 5])
  pet_array.push(keys[(date_int + user_int + 1) % 5])
  pet_array.push(keys[(date_int + user_int + 2) % 5])
  return pet_array;
}

function getVariant(msg, pet_str, user_specific=false) {
  // Returns variant object randomly
  let pet_array = [];
  let d = new Date();
  let date_int = Math.floor(d/8.64e7) - 18741;
  if (user_specific) {
    date_int += msg.author.id
  }
  let rng = seedrandom(date_int + pet_str);
  let specified_rarity = "uncommon";
  if (rng() < rare_variant_prob) {
    specified_rarity = "rare";
  }
  console.log("pet_str", pet_str, "rng", rng(), "rarity", specified_rarity)
  let variants_arr = [];
  for (const key of Object.keys(animal_stats[pet_str].variants)) {
    if (animal_stats[pet_str].variants[key].rarity === specified_rarity) {
      variants_arr.push(animal_stats[pet_str].variants[key])
    }
  }
  rng = seedrandom(date_int + pet_str + 1);
  return variants_arr[Math.floor(rng() * variants_arr.length)];
}

function getPetInfo(msg, pet_str, index=0, user_specific=false) {
  let d = new Date();
  let date_int = Math.floor(d/8.64e7) - 18741;
  if (user_specific) {
    date_int += parseInt((msg.author.id).slice(4))
  }
  let pet_info = {};
  pet_info['emoji'] = animal_stats[pet_str].emoji;
  pet_info['desc'] = animal_stats[pet_str].description;
  pet_info['name'] = animal_stats[pet_str].str;
  pet_info['proper'] = animal_stats[pet_str].proper;
  pet_info['hours_to_maturity'] = animal_stats[pet_str].hours_to_maturity;
  pet_info['base_price'] = animal_stats[pet_str].base_price;
  pet_info['base_speed'] = animal_stats[pet_str].base_speed;
  pet_info['base_health'] = animal_stats[pet_str].base_health;
  pet_info['base_spoils'] = animal_stats[pet_str].base_spoils;
  pet_info['base_freq'] = animal_stats[pet_str].base_freq;
  pet_info['generation'] = animal_stats[pet_str].generation;
  pet_info['death'] = animal_stats[pet_str].death;
  pet_info['inv'] = [];
  pet_info['capacity'] = 3;
  pet_info['animal_type'] = pet_info['name'];
  pet_info['rarity'] = "common"
  let rng = seedrandom(date_int + pet_str + index)
  if (rng() < rare_pet_prob) {
    let variant = getVariant(msg, pet_str);
    pet_info['name'] = variant.str;
    pet_info['emoji'] = variant.emoji
    pet_info['rarity'] = variant.rarity;
    pet_info['proper'] = variant.proper;
    pet_info['base_price'] = (variant.rarity === 'uncommon') ? pet_info['base_price'] * 2 : pet_info['base_price'] * 3;
  }
  return pet_info;
}

function getMorePetInfo(msg, pet_info) {
  let num_quirks = 1 + Math.floor(Math.pow(Math.random(), 2) * 3);
  console.log("num_quirks", num_quirks)
  let shuffled_quirks = f.shuffle(animal_quirks);
  pet_info["quirks"] = shuffled_quirks.slice(0, num_quirks);
  console.log(pet_info["quirks"][0].effects)
  console.log("Pet info before quirk modifications", pet_info)
  for (let i = 0; i < num_quirks; i++) {
    for (const [key, value] of Object.entries(pet_info["quirks"][i].effects)) {
      if (["base_freq", "base_health"].includes(key)) {
        console.log("In first fork", key, value, pet_info[key])
        pet_info[key] += value
        console.log("In first fork (after)", pet_info[key])
      } else {
        console.log("In second fork", key, value, pet_info[key])
        pet_info[key] *= value
        console.log("In second fork (after)", pet_info[key])
      }
    }
  }
  pet_info["base_hunger"] = 16 + Math.floor(Math.random() * 25) // 16 to 40
  pet_info["curr_hunger"] = pet_info["base_hunger"]
  pet_info['curr_health'] = pet_info['base_health'];
  pet_info["nickname"] = "Dumbass"
  pet_info["dob"] = msg.createdTimestamp;
  console.log("Pet info after quirk modifications", pet_info)
  return pet_info;
}

function getPetFieldContent(msg, pet_str, index=0, user_specific=false) {
  let pet_info = getPetInfo(msg, pet_str, index, user_specific);
  let name = pet_info.name.split('_').join(' ');
  name = name[0].toUpperCase() + name.slice(1);
  let rarity = pet_info.rarity[0].toUpperCase() + pet_info.rarity.slice(1);
  let animal_type = pet_info.animal_type[0].toUpperCase() + pet_info.animal_type.slice(1);
  let first_part = pet_info.emoji + " " + name;
  let second_part = "Rarity: `" + rarity + "\n" + "`";
  second_part += "Animal Type: `" + animal_type + "\n" + "`";
  second_part += "Description: `" + pet_info.desc + "\n" + "`";
  second_part += "Price: `₣" + pet_info.base_price.toFixed(2) + "`";
  return [first_part, second_part];
}


function f_petshop(msg, content) {
  let pet_array = generatePets(msg);
  let fields_1 = getPetFieldContent(msg, pet_array[0]);
  let fields_2 = getPetFieldContent(msg, pet_array[1], 1);
  let fields_3 = getPetFieldContent(msg, pet_array[2], 2);
  let user_pet_array = generatePets(msg, true);
  let fields_4 = getPetFieldContent(msg, user_pet_array[0], 0, true);
  let fields_5 = getPetFieldContent(msg, user_pet_array[1], 1, true);
  let fields_6 = getPetFieldContent(msg, user_pet_array[2], 2, true);
  let desc = "The first three pets are available to everyone level 7 or higher.\n"
  desc += "The last three pets are only available to you.\n\n"
  desc += "Use `!f buypet <1-6>` to purchase the corresponding pet.\n" + fill
  const attachment = new Discord.MessageAttachment('./scripts/fruitymon/assets/chicken.gif', 'chicken.gif');
  const template = new Discord.MessageEmbed()
    .setColor('#AAFF22')
    .setTitle(" 🐮 🐔 🐷 🐶  Pet Store - New Animals Daily!  🐶 🐷 🐔 🐮 ")
    .setDescription(desc)
    .attachFiles(attachment)
    .setThumbnail('attachment://chicken.gif')
    .addField('1. ' + fields_1[0], fields_1[1], true)
    .addField('2. ' + fields_2[0], fields_2[1], true)
    .addField('3. ' + fields_3[0], fields_3[1], true)
    .addField('4. ' + fields_4[0], fields_4[1], true)
    .addField('5. ' + fields_5[0], fields_5[1], true)
    .addField('6. ' + fields_6[0], fields_6[1], true)
  msg.channel.send(template)
}

function f_pettiers(msg, content) {
  let description = "The different colored circles indicate a pet's rarity:\n\n"
  description += "⚪ is common.\n🔵 is uncommon.\n🟣 is rare."
  const attachment = new Discord.MessageAttachment('./scripts/fruitymon/assets/sheep.gif', 'sheep.gif');
  const template = new Discord.MessageEmbed()
    .setColor('#AA44AA')
    .setTitle("Pet Tiers")
    .setDescription(description)
    .attachFiles(attachment)
    .setThumbnail('attachment://sheep.gif');
  let i = 0;
  for (const key of Object.keys(animal_stats)) {
    let title = (i + 1) + ". " + animal_stats[key].proper;
    let descs_str = "⚪" + animal_stats[key].emoji + " " + animal_stats[key].proper + "\n"
    for (const variant of Object.keys(animal_stats[key].variants)) {
      let this_var = animal_stats[key].variants[variant];
      descs_str += this_var.r_emoji + " " + this_var.emoji + " " + this_var.proper + "\n"
    }
    template.addField(title, descs_str, true)
    i++;
  }
  template.addField("6. Exotics", "???", true)
  msg.channel.send(template)
}

function f_buyPet(msg, content) {
  if (f_record[msg.author.id]["Level"] < 7) {
    msg.channel.send("You need to be level 7 to get a pet! Duh!")
    return;
  }
  let pet_int = parseInt(content.trim());
  if (pet_int < 1 || pet_int > 6) {
    msg.channel.send("You need to specify a number between 1 and 6!")
    return;
  }
  // Identify pet and price
  let pet_str = '';
  let index = (pet_int - 1) % 3
  let user_specific = false;
  if (pet_int <= 3) {
    pet_str = generatePets(msg, user_specific=user_specific)[index]
  } else {
    user_specific = true;
    pet_str = generatePets(msg, user_specific=user_specific)[index]
  }
  let pet_info = getPetInfo(msg, pet_str, index, user_specific)
  // console.log(generatePets(msg, user_specific=user_specific))
  // console.log(pet_info)
  // Identify if user can afford it
  if (f_record[msg.author.id]["Fruitbux"] < pet_info.price) {
    msg.channel.send("You can't afford it! Ever heard of saving up?")
    return ;
  }
  // If they don't have an animals array, create one for them.
  if (!("Animals" in f_record[msg.author.id])) {
    f_record[msg.author.id]["Animals"] = []
  }
  // Check if they have a slot
  let animals_length = f_record[msg.author.id]["Animals"]
  let animals_max_length = 3;
  if (animals_length >= animals_max_length) {
    msg.channel.send("You don't have room for another animal!")
    return ;
  }
  // Get additional info for the animal, then add to inventory.
  let new_pet_info = getMorePetInfo(msg, pet_info);
  f_record[msg.author.id]["Animals"].push(new_pet_info);
  f_record[msg.author.id]["Fruitbux"] -= new_pet_info.base_price;
  fs.writeFileSync(record_filename_full, JSON.stringify(f_record, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
  });
  msg.channel.send(`Success! You bought a \`${new_pet_info.proper.toLowerCase()}\` for \`₣${new_pet_info.base_price.toFixed(2)}\`!`)
}

function getPetAgeStr(msg, animal_obj) {
  let age_ms = msg.createdTimestamp - animal_obj.dob;
  let age_frac = age_ms / (animal_obj.hours_to_maturity * 3600 * 1000)
  if (age_frac < 0.1) return "Newborn";
  if (age_frac < 0.25) return "Baby";
  if (age_frac < 0.6) return "Adolescent";
  if (age_frac < 1) return "Teen";
  return "Adult"
}

function f_petInv(msg, content) {
  const attachment = new Discord.MessageAttachment('./scripts/fruitymon/assets/pig.gif', 'pig.gif');
  const template = new Discord.MessageEmbed()
    .setColor('#CC22CC')
    .setTitle(`${msg.author.username}'s Pets`)
    .setDescription("Options:\n\n`!f namepet <slot> <name>` to rename a pet.\n\
    `!f slaughter <slot>` to transform a pet into meat.\n\
    `!f feed <slot/nickname> <qty.> <fruit/emoji>` to feed a pet.\n\
    `!f collect` to get the items your pets produced.\n\n\
    Healing can be accomplished by feeding a pet extraordinary fruits or rare trash.")
    .attachFiles(attachment)
    .setThumbnail('attachment://pig.gif');
  for (let i = 0; i < f_record[msg.author.id]["Animals"].length; i++) {
    let curr_animal = f_record[msg.author.id]["Animals"][i];
    let title = `${i + 1}. ${curr_animal.emoji} ${curr_animal.proper}`;
    let body = "Name: `" + curr_animal.nickname + "`\n";
    body += "Age: `" + getPetAgeStr(msg, curr_animal) + "`\n"
    body += `Health: \`${curr_animal.curr_health}\` / \`${curr_animal.base_health}\`\n`
    body += `Hunger: \`${curr_animal.curr_hunger}\` / \`${curr_animal.base_hunger}\`\n`
    body += `Speed: \`${curr_animal.base_speed}\`\n`
    body += `Special: \`${curr_animal.base_freq}\`\n`
    body += "Quirks: "
    for (let i = 0; i < curr_animal.quirks.length; i++) {
      body += `\`${curr_animal.quirks[i].proper.toLowerCase()}\``
      if (i === curr_animal.quirks.length - 1) {
        body += "\n"
      } else {
        body += ", "
      }
    }
    body += `Items: \`${curr_animal.inv.length}\` / \`${curr_animal.capacity}\``


    template.addField(title, body, true)
  }
  msg.channel.send(template)
}

function f_namePet(msg, content) {
  msg.channel.send("Naming a pet...")
  let split = content.split(" ");
  if (f.isNumeric(split[0])) {
    let slot = parseInt(split[0]);
    if (slot < 0 || slot > f_record[msg.author.id]["Animals"].length) {
      msg.channel.send("There's no animal in that slot!");
      return;
    }
    let name = split.slice(1).join(" ").trim();
    f_record[msg.author.id]["Animals"][slot - 1].nickname = name;
    msg.reply(`Your animal in slot \`${slot}\` is now named \`${name}\`!`)
    fs.writeFileSync(record_filename_full, JSON.stringify(f_record, null, 2), function writeJSON(err) {
      if (err) return console.log(err);
    });
  } else {
    msg.channel.send("You need to specify which pet to rename using the slot number!");
    return;
  }
}


module.exports = {f_petshop, f_buyPet, f_pettiers, f_petInv, f_namePet};


// Exotics: dragon (eggs, scales), t-rex, (eggs, scales), unicorn (milk, sparkles)

CREATE TABLE IF NOT EXISTS data.pokemon_encounters (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  userId VARCHAR(32) NOT NULL,
  pokemonId SMALLINT NOT NULL,
  name VARCHAR(32) NOT NULL,
  nick VARCHAR(32) NOT NULL,
  level SMALLINT NOT NULL,
  experience FLOAT NOT NULL DEFAULT 0,
  gender VARCHAR(32) NOT NULL,
  pokemonChar1 VARCHAR(32) NOT NULL,
  pokemonChar2 VARCHAR(32) NOT NULL,
  isShiny BOOLEAN NOT NULL,
  shinyShift SMALLINT NOT NULL,
  attempted VARCHAR(32) NOT NULL,
  caught BOOLEAN NOT NULL,
  owned BOOLEAN NOT NULL,
  captureDifficulty TINYINT NOT NULL,
  slot BIGINT NOT NULL,
  epoch BIGINT NOT NULL,
  isTraining BOOLEAN NOT NULL DEFAULT 0,
  isRadar BOOLEAN NOT NULL DEFAULT 0,
  formIndex SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

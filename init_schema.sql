CREATE TABLE notes (
id            SERIAL PRIMARY KEY,   
date          DATE,                   --Record the date, time and day of the week you are making the observation,
flock_size    INTEGER,                -- Try to estimate how many birds are in the flock.
user_id       INTEGER,
species_id    INTEGER
);

CREATE TABLE userCredentials (
  id          SERIAL PRIMARY KEY,
  email       TEXT,
  password    TEXT
);
CREATE TABLE species (
  id                  SERIAL PRIMARY KEY,
  name                TEXT,
  scientific_name     TEXT
);

CREATE TABLE behaviors_table (
  id              SERIAL PRIMARY KEY,
  description     TEXT
);

CREATE TABLE notes_behaviors_table(
id               SERIAL PRIMARY KEY,
note_id          INTEGER,
behavior_id      INTEGER
);

CREATE TABLE notes_userCredentials_table (
  id                  SERIAL PRIMARY KEY,
  notes_id            INTEGER,                 --FK 
  userCredentials_id  INTEGER,                --FK 
  comments            TEXT
);

INSERT INTO bird_behaviors (description) VALUES ('Walking');
INSERT INTO bird_behaviors (description) VALUES ('Resting');
INSERT INTO bird_behaviors (description) VALUES ('Bathing');
INSERT INTO bird_behaviors (description) VALUES ('Pooping');
INSERT INTO bird_behaviors (description) VALUES ('Pecking');
INSERT INTO bird_behaviors (description) VALUES ('Soaring');
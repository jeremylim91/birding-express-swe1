CREATE TABLE notes (
id            SERIAL PRIMARY KEY,   
date          DATE,                   --Record the date, time and day of the week you are making the observation,
behavior      TEXT,                   --Take notes on what the bird was doing as you observed it.
flock_size    INTEGER                -- Try to estimate how many birds are in the flock.
);

CREATE TABLE userCredentials (
  id          SERIAL PRIMARY KEY,
  email       TEXT,
  password    TEXT
);
CREATE TABLE games (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id serial PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  answer TEXT NOT NULL
);
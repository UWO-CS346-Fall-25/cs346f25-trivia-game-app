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

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_scores (
    user_id        INTEGER PRIMARY KEY REFERENCES users(id),
    games_played   INTEGER NOT NULL DEFAULT 0,
    num_correct    INTEGER NOT NULL DEFAULT 0,
    num_incorrect  INTEGER NOT NULL DEFAULT 0,
    num_answered   INTEGER NOT NULL DEFAULT 0
);
-- =========================================================
-- Multiplayer Online Game Schema (MySQL 8)
-- =========================================================

CREATE DATABASE IF NOT EXISTS game;
USE game;

-- Recommended for consistent FK behavior
SET @@sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  user_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,
  role           ENUM('student','teacher','admin') NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP    NULL DEFAULT NULL
) ENGINE=InnoDB;

-- =========================================================
-- ROOMS
-- =========================================================
CREATE TABLE IF NOT EXISTS rooms (
  room_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  host_user_id  BIGINT      NOT NULL,
  join_code     VARCHAR(20) NOT NULL UNIQUE,
  status        ENUM('open','in_game','closed') NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settings_json JSON        NULL,

  CONSTRAINT fk_rooms_host
    FOREIGN KEY (host_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_rooms_host_user_id ON rooms(host_user_id);

-- =========================================================
-- ROOM MEMBERSHIPS (room_id, user_id)
-- =========================================================
CREATE TABLE IF NOT EXISTS room_memberships (
  room_id       BIGINT      NOT NULL,
  user_id       BIGINT      NOT NULL,
  room_role_id  VARCHAR(50) NULL,
  joined_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at       TIMESTAMP   NULL DEFAULT NULL,

  PRIMARY KEY (room_id, user_id),

  CONSTRAINT fk_rm_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_rm_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_rm_times
    CHECK (left_at IS NULL OR left_at >= joined_at)
) ENGINE=InnoDB;

CREATE INDEX idx_room_memberships_user_id ON room_memberships(user_id);

-- =========================================================
-- MATCHES
-- =========================================================
CREATE TABLE IF NOT EXISTS matches (
  match_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id         BIGINT    NOT NULL,
  started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at        TIMESTAMP NULL DEFAULT NULL,
  winning_team_id BIGINT    NULL,

  CONSTRAINT fk_matches_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_match_times
    CHECK (ended_at IS NULL OR ended_at >= started_at)
) ENGINE=InnoDB;

CREATE INDEX idx_matches_room_id ON matches(room_id);
CREATE INDEX idx_matches_started_at ON matches(started_at);

-- =========================================================
-- TEAMS
-- =========================================================
CREATE TABLE IF NOT EXISTS teams (
  team_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  match_id    BIGINT      NOT NULL,
  team_name   VARCHAR(50) NOT NULL,
  final_score INT         NOT NULL DEFAULT 0,

  CONSTRAINT fk_teams_match
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_teams_match_id ON teams(match_id);

-- Add FK for matches.winning_team_id now that teams exists
ALTER TABLE matches
  ADD CONSTRAINT fk_matches_winning_team
  FOREIGN KEY (winning_team_id) REFERENCES teams(team_id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- =========================================================
-- TEAM MEMBERS (Option A) with constraint:
-- UNIQUE(match_id, user_id) prevents multiple teams per match
-- =========================================================
CREATE TABLE IF NOT EXISTS team_members (
  team_id      BIGINT      NOT NULL,
  match_id     BIGINT      NOT NULL,
  user_id      BIGINT      NOT NULL,
  team_role_id VARCHAR(50) NULL,
  assigned_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (team_id, user_id),
  UNIQUE KEY uq_team_members_match_user (match_id, user_id),

  CONSTRAINT fk_tm_team
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_tm_match
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_tm_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_match_id ON team_members(match_id);

-- =========================================================
-- QUESTION SETS
-- =========================================================
CREATE TABLE IF NOT EXISTS question_sets (
  question_set_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_by_user_id  BIGINT       NOT NULL,
  topic               VARCHAR(100) NULL,
  difficulty_policy   VARCHAR(50)  NULL,
  generated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source              VARCHAR(30)  NULL,

  CONSTRAINT fk_qs_creator
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_question_sets_created_by ON question_sets(created_by_user_id);

-- =========================================================
-- QUESTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS questions (
  question_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_set_id  BIGINT NOT NULL,
  question_text    TEXT   NOT NULL,
  answer_key       TEXT   NOT NULL,
  options_json     JSON   NULL,
  explanation      TEXT   NULL,
  tags_json        JSON   NULL,

  CONSTRAINT fk_questions_set
    FOREIGN KEY (question_set_id) REFERENCES question_sets(question_set_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_questions_set_id ON questions(question_set_id);

-- =========================================================
-- QUESTION ATTEMPTS
-- =========================================================
CREATE TABLE IF NOT EXISTS question_attempts (
  attempt_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  match_id        BIGINT      NOT NULL,
  user_id         BIGINT      NOT NULL,
  question_id     BIGINT      NOT NULL,
  selected_answer TEXT        NULL,
  is_correct      TINYINT(1)  NOT NULL,
  points_awarded  INT         NOT NULL DEFAULT 0,
  started_at      TIMESTAMP   NULL DEFAULT NULL,
  answered_at     TIMESTAMP   NULL DEFAULT NULL,

  CONSTRAINT fk_qa_match
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_qa_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_qa_question
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_qa_times
    CHECK (answered_at IS NULL OR started_at IS NULL OR answered_at >= started_at)
) ENGINE=InnoDB;

CREATE INDEX idx_qa_match_id ON question_attempts(match_id);
CREATE INDEX idx_qa_user_id ON question_attempts(user_id);
CREATE INDEX idx_qa_question_id ON question_attempts(question_id);

-- =========================================================
-- MINIGAME RESULTS
-- =========================================================
CREATE TABLE IF NOT EXISTS minigame_results (
  result_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  match_id       BIGINT      NOT NULL,
  user_id        BIGINT      NOT NULL,
  minigame_type  VARCHAR(50) NOT NULL,
  outcome        VARCHAR(50) NOT NULL,
  points_awarded INT         NOT NULL DEFAULT 0,
  played_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_mr_match
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_mr_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_mr_match_id ON minigame_results(match_id);
CREATE INDEX idx_mr_user_id ON minigame_results(user_id);

-- =========================================================
-- POWERUP EVENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS powerup_events (
  event_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  match_id        BIGINT      NOT NULL,
  user_id         BIGINT      NULL,
  source_team_id  BIGINT      NULL,
  target_team_id  BIGINT      NULL,
  powerup_type    VARCHAR(50) NOT NULL,
  applied_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP   NULL DEFAULT NULL,

  CONSTRAINT fk_pe_match
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_pe_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_pe_source_team
    FOREIGN KEY (source_team_id) REFERENCES teams(team_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_pe_target_team
    FOREIGN KEY (target_team_id) REFERENCES teams(team_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT chk_powerup_actor
    CHECK (user_id IS NOT NULL OR source_team_id IS NOT NULL),

  CONSTRAINT chk_powerup_times
    CHECK (expires_at IS NULL OR expires_at >= applied_at)
) ENGINE=InnoDB;

CREATE INDEX idx_pe_match_id ON powerup_events(match_id);

-- =========================================================
-- PLAYER STATS (SUMMARY)
-- =========================================================
CREATE TABLE IF NOT EXISTS player_stats (
  user_id                BIGINT PRIMARY KEY,
  total_playtime_seconds BIGINT      NOT NULL DEFAULT 0,
  total_attempts         BIGINT      NOT NULL DEFAULT 0,
  correct_attempts       BIGINT      NOT NULL DEFAULT 0,
  accuracy_percent       DECIMAL(5,2) NULL,
  last_played_at         TIMESTAMP   NULL DEFAULT NULL,

  CONSTRAINT fk_ps_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

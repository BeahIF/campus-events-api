-- Up Migration
CREATE TABLE people (
  id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(255) NOT NULL,
  age         INT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE events (
    id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE event_subscriptions (
    id         INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    person_id  INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_person_event UNIQUE (person_id, event_id)
);

-- Down Migration
DROP TABLE event_subscriptions;
DROP TABLE events;
DROP TABLE people

-- Up Migration
CREATE TABLE events (
  id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date        TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity    INT NOT NULL CHECK (capacity > 0),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE registrations (
  id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id   INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT registrations_event_person_unique UNIQUE (event_id, person_id)
);

-- Down Migration
DROP TABLE registrations;
DROP TABLE events;

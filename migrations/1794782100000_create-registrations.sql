-- Up Migration
CREATE TABLE registrations (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id INT NOT NULL REFERENCES events(id),
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(254) NOT NULL CHECK (email = lower(trim(email))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

-- Down Migration
DROP TABLE registrations;

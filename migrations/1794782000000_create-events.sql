-- Up Migration
CREATE TABLE events (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0)
);

-- Down Migration
DROP TABLE events;

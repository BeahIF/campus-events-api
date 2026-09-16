exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("events", {
    id: "id",

    name: {
      type: "text",
      notNull: true,
    },

    date: {
      type: "date",
      notNull: true,
    },

    capacity: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.addConstraint("events", "events_capacity_positive", {
    check: "capacity > 0",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("events");
};

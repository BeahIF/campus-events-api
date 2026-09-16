exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("registrations", {
    id: "id",

    event_id: {
      type: "integer",
      notNull: true,
      references: "events",
      onDelete: "CASCADE",
    },

    user_id: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.addConstraint("registrations", "registrations_event_user_unique", {
    unique: ["event_id", "user_id"],
  });
};

exports.down = (pgm) => {
  pgm.dropTable("registrations");
};

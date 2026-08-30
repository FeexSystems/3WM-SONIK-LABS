import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // Using varchar(128) because Firebase UIDs are typically 28 characters
  id: varchar('id', { length: 128 }).primaryKey(),
  email: varchar('email', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }).default('New User').notNull(),
  photoUrl: text('photo_url'),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  settings: jsonb('settings').default({ theme: 'dark', emailNotifications: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tracks = pgTable('tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 128 })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }),
  genre: varchar('genre', { length: 100 }),
  bpm: integer('bpm'),
  key: varchar('key', { length: 10 }),
  duration: integer('duration'),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  settings: jsonb('settings').default({}),
  stems: jsonb('stems').default([]),
  history: jsonb('history').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const generationJobs = pgTable('generation_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 128 })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'audio', 'stem', 'midi'
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  prompt: text('prompt'),
  inputParams: jsonb('input_params').default({}),
  assetUrl: text('asset_url'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

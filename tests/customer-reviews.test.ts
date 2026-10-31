import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
// @ts-expect-error Node's native TS runner requires an explicit extension.
import { parseReviewInput, canFeatureReview, publicReview } from "../lib/reviews/domain.ts";
const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
const invoice = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pending = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const agreement = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const valid = {
  analysisId: invoice,
  analysisKind: "invoice",
  rating: 5,
  body: "A useful and clear invoice analysis.",
  displayName: "Alex R.",
  publicationConsent: false,
};
test("Review input accepts honest ratings and requires explicit consent choice", () => {
  for (const rating of [1, 2, 3, 4, 5])
    assert.equal(parseReviewInput({ ...valid, rating }).rating, rating);
  assert.equal(
    parseReviewInput({
      ...valid,
      status: "published",
      featured: true,
      user_id: other,
    }).publicationConsent,
    false,
  );
  for (const change of [
    { rating: 0 },
    { rating: 6 },
    { rating: 4.5 },
    { rating: "5" },
    { publicationConsent: "true" },
    { publicationConsent: undefined },
    { analysisId: "demo-invoice" },
    { analysisKind: "other" },
    { body: "short" },
    { body: "x".repeat(2001) },
    { displayName: " " },
    { businessName: 123 },
  ])
    assert.throws(() => parseReviewInput({ ...valid, ...change }));
});
test("Featured eligibility never bypasses publication, consent, or minimum rating", () => {
  for (const rating of [1, 2, 3])
    assert.equal(
      canFeatureReview({
        rating,
        status: "published",
        publication_consent: true,
      }),
      false,
    );
  for (const status of ["pending", "rejected", "withdrawn"])
    assert.equal(
      canFeatureReview({ rating: 5, status, publication_consent: true }),
      false,
    );
  assert.equal(
    canFeatureReview({
      rating: 5,
      status: "published",
      publication_consent: false,
    }),
    false,
  );
  assert.equal(
    canFeatureReview({
      rating: 4,
      status: "published",
      publication_consent: true,
    }),
    true,
  );
  const result = publicReview({
    id: "x",
    rating: 1,
    body: "Honest negative feedback",
    display_name: "A.",
    business_name: null,
    role: null,
    created_at: "2026-10-31",
    user_id: user,
    invoice_id: invoice,
  } as Parameters<typeof publicReview>[0]);
  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "id",
      "rating",
      "body",
      "display_name",
      "business_name",
      "role",
      "created_at",
    ].sort(),
  );
});
test("Postgres enforces verified ownership, consent, rating-neutral moderation, audit history, and private storage", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users (id uuid primary key);
      create table public.profiles (id uuid primary key references auth.users, first_name text,last_name text,business_name text,industry text,deactivated_at timestamptz);
      create table public.invoice_analyses (id uuid primary key,user_id uuid,status text);
      create table public.agreement_analyses (id uuid primary key,user_id uuid,status text);
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant all on all tables in schema public,auth to service_role;
      grant select,update on public.profiles to authenticated;
      insert into auth.users values ('${user}'),('${other}'),('${admin}');
      insert into profiles(id) values ('${user}'),('${other}'),('${admin}');
      insert into invoice_analyses values ('${invoice}','${user}','completed'),('${pending}','${user}','processing');
      insert into agreement_analyses values ('${agreement}','${other}','completed');`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261031170447_customer_reviews.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      `update profiles set is_admin=true where id='${admin}'; set role service_role;`,
    );
    const insert = (
      who: string,
      source: string,
      rating = 1,
      consent = true,
      kind = "invoice",
    ) =>
      `insert into customer_reviews(user_id,${kind}_id,rating,body,display_name,publication_consent,consented_at,last_actor_id) values ('${who}','${source}',${rating},'A genuinely useful product experience.','Alex R.',${consent},${consent ? "now()" : "null"},'${who}') returning id`;
    await assert.rejects(
      db.query(insert(other, invoice)),
      /Completed owned invoice/,
    );
    await assert.rejects(
      db.query(insert(user, pending)),
      /Completed owned invoice/,
    );
    const {
      rows: [review],
    } = await db.query<{ id: string }>(insert(user, invoice));
    await assert.rejects(db.query(insert(user, invoice)), /unique/);
    await assert.rejects(
      db.query(
        `update customer_reviews set status='published' where id='${review.id}'`,
      ),
      /administrator/,
    );
    // Negative feedback can be published, and remains in all-rating summaries.
    await db.exec(
      `update customer_reviews set status='published',last_actor_id='${admin}' where id='${review.id}'`,
    );
    assert.equal(
      (
        await db.query<{ average: number }>(
          "select avg(rating)::float as average from customer_reviews where status='published' and publication_consent",
        )
      ).rows[0].average,
      1,
    );
    await assert.rejects(
      db.query(
        `update customer_reviews set featured=true,last_actor_id='${admin}' where id='${review.id}'`,
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.query(
        `update customer_reviews set status='rejected',last_actor_id='${admin}' where id='${review.id}'`,
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.query(
        `update customer_reviews set body='An administrator changed this review.',last_actor_id='${admin}' where id='${review.id}'`,
      ),
      /immutable/,
    );
    const {
      rows: [privateReview],
    } = await db.query<{ id: string }>(
      insert(other, agreement, 5, false, "agreement"),
    );
    await assert.rejects(
      db.query(
        `update customer_reviews set status='published',last_actor_id='${admin}' where id='${privateReview.id}'`,
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.query(
        `update customer_reviews set publication_consent=true,consented_at=now(),last_actor_id='${admin}' where id='${privateReview.id}'`,
      ),
      /immutable/,
    );
    // Withdrawal removes the review from both public and featured selection immediately.
    await db.exec(
      `update customer_reviews set publication_consent=false,status='withdrawn',featured=false,consent_withdrawn_at=now(),last_actor_id='${user}' where id='${review.id}'`,
    );
    assert.equal(
      (
        await db.query(
          "select id from customer_reviews where status='published' and publication_consent",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `select status from customer_review_events where review_id='${review.id}' order by created_at,id`,
        )
      ).rows.length,
      3,
    );
    // A positive review can be explicitly featured, and withdrawal clears both displays.
    const positiveSource = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    await db.exec(`insert into invoice_analyses values ('${positiveSource}','${admin}','completed')`);
    const {rows:[positive]} = await db.query<{id:string}>(insert(admin,positiveSource,5));
    await db.exec(`update customer_reviews set status='published',featured=true,last_actor_id='${admin}' where id='${positive.id}'`);
    assert.equal((await db.query("select id from customer_reviews where status='published' and publication_consent and featured and rating>=4")).rows.length,1);
    // A stale compare-and-update cannot overwrite a newer decision.
    assert.equal((await db.query(`update customer_reviews set featured=false,last_actor_id='${admin}' where id='${positive.id}' and updated_at='1970-01-01T00:00:00Z' returning id`)).rows.length,0);
    await db.exec(`update customer_reviews set publication_consent=false,status='withdrawn',featured=false,consent_withdrawn_at=now(),last_actor_id='${admin}' where id='${positive.id}'`);
    assert.equal((await db.query("select id from customer_reviews where status='published' and publication_consent")).rows.length,0);
    await db.exec("reset role");
    await db.exec(`update profiles set deactivated_at=now() where id='${admin}'; set role service_role`);
    await assert.rejects(db.query(`update customer_reviews set status='published',last_actor_id='${admin}' where id='${review.id}'`),/administrator/);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role;set role ${role}`);
      for (const sql of [
        "select * from customer_reviews",
        "select * from customer_review_events",
        insert(admin, invoice),
        "update customer_reviews set status='published'",
        "delete from customer_reviews",
        "update profiles set is_admin=true",
      ]) {
        await assert.rejects(
          db.query(sql),
          (e: { code?: string }) => e.code === "42501",
        );
      }
    }
    await db.exec("reset role; set role authenticated");
    await db.exec("update profiles set first_name='Still editable'");
  } finally {
    await db.close();
  }
});

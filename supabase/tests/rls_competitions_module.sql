-- Competitions module: flag default OFF + tables + RPC surface

BEGIN;

SELECT plan(16);

SELECT has_function('public', 'brand_feature_enabled', ARRAY['uuid', 'text'], 'brand_feature_enabled exists');

SELECT is(
  (
    SELECT public.brand_feature_enabled('00000000-0000-0000-0000-000000000001'::uuid, 'competitions')
  ),
  false,
  'competitions defaults to false when brand_settings missing'
);

SELECT has_table('public', 'competition_question_bank', 'competition_question_bank exists');
SELECT has_table('public', 'competition_question_options', 'competition_question_options exists');
SELECT has_table('public', 'brand_competition_questions', 'brand_competition_questions exists');
SELECT has_table('public', 'student_competition_attempts', 'student_competition_attempts exists');
SELECT has_table('public', 'student_competition_attempt_answers', 'student_competition_attempt_answers exists');
SELECT has_table('public', 'competition_question_papers', 'competition_question_papers exists');
SELECT has_table('public', 'brand_competition_papers', 'brand_competition_papers exists');

SELECT has_function('public', 'upsert_competition_bank_question', ARRAY['uuid', 'uuid', 'uuid', 'text', 'jsonb', 'uuid', 'text', 'boolean'], 'upsert_competition_bank_question exists');
SELECT has_function('public', 'add_random_competition_questions', ARRAY['uuid', 'uuid', 'uuid', 'uuid', 'int'], 'add_random_competition_questions exists');
SELECT has_function('public', 'get_student_competition_quiz', ARRAY['uuid'], 'get_student_competition_quiz exists');
SELECT has_function('public', 'start_competition_attempt', ARRAY['uuid'], 'start_competition_attempt exists');
SELECT has_function('public', 'submit_competition_attempt', ARRAY['uuid', 'jsonb'], 'submit_competition_attempt exists');
SELECT has_function('public', 'get_student_competition_papers', ARRAY['uuid'], 'get_student_competition_papers exists');
SELECT has_function('public', 'upsert_competition_question_paper', ARRAY['uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'text', 'uuid', 'boolean'], 'upsert_competition_question_paper exists');
SELECT has_function('public', 'get_brand_feature_flags', ARRAY['uuid'], 'get_brand_feature_flags exists');

SELECT * FROM finish();
ROLLBACK;

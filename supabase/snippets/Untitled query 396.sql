-- Coach setup
UPDATE profiles SET role = 'coach'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'coach@test.com');

INSERT INTO coaches (user_id, displayname, bio, specialization)
SELECT id, 'Test Coach', 'Wellness guide.', '["sleep","stress"]'
FROM auth.users WHERE email = 'coach@test.com';

-- Assign coach to your main account
INSERT INTO coach_clients (coach_id, user_id, status)
SELECT
  (SELECT id FROM auth.users WHERE email = 'coach@test.com'),
    (SELECT id FROM auth.users WHERE email = 'lucentengine@gmail.com'),
      'active';

      -- Partner setup
      UPDATE profiles SET role = 'partner'
      WHERE user_id = (SELECT id FROM auth.users WHERE email = 'partner@test.com');

      INSERT INTO partners (user_id, company_name, partner_type, region_states, contact_email, feature_flag_enabled)
      SELECT id, 'Demo Dispensary', 'dispensary', '["CA","CO"]', 'partner@test.com', true
      FROM auth.users WHERE email = 'partner@test.com';
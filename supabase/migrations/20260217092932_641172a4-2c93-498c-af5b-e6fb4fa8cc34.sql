-- Delete test users from auth
DELETE FROM auth.users WHERE id IN (
  'e6b56665-df37-4ab6-94ea-6532ec612f53',
  '7eec34db-6712-4f6b-9365-6a14b43701ce'
);
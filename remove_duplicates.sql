DELETE FROM core_aichatsession a
USING core_aichatsession b
WHERE
  a.id < b.id AND
  a.session_id IS NOT NULL AND
  a.session_id = b.session_id;
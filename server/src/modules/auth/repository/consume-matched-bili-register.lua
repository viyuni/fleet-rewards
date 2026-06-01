local raw = redis.call('GET', KEYS[1])
if not raw then
  return nil
end

local challenge = cjson.decode(raw)
if challenge.status ~= 'matched' or challenge.verifierHash ~= ARGV[1] or not challenge.biliUid then
  return nil
end

local ttl = redis.call('TTL', KEYS[1])
if ttl <= 0 then
  return nil
end

challenge.status = 'consumed'
challenge.consumedAt = ARGV[2]
redis.call('SET', KEYS[1], cjson.encode(challenge), 'EX', ttl)

return raw

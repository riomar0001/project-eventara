"""Minimal in-memory stand-in for ``redis.asyncio.Redis`` (decode_responses=True).

Implements only the commands DeadJobStore uses; TTLs are accepted and ignored.
"""


class _Pipeline:
    def __init__(self, redis: FakeRedis) -> None:
        self._redis = redis
        self._calls: list[tuple[str, tuple, dict]] = []

    async def __aenter__(self) -> _Pipeline:
        return self

    async def __aexit__(self, *exc) -> None:
        return None

    def __getattr__(self, name: str):
        def queue(*args, **kwargs):
            self._calls.append((name, args, kwargs))
            return self

        return queue

    async def execute(self) -> list:
        return [await getattr(self._redis, name)(*args, **kwargs) for name, args, kwargs in self._calls]


class FakeRedis:
    def __init__(self) -> None:
        self.strings: dict[str, str] = {}
        self.zsets: dict[str, dict[str, float]] = {}

    def pipeline(self, transaction: bool = True) -> _Pipeline:
        return _Pipeline(self)

    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.strings:
            return None
        self.strings[key] = str(value)
        return True

    async def get(self, key):
        return self.strings.get(key)

    async def mget(self, keys):
        return [self.strings.get(k) for k in keys]

    async def incr(self, key):
        self.strings[key] = str(int(self.strings.get(key, "0")) + 1)
        return int(self.strings[key])

    async def delete(self, *keys):
        removed = 0
        for key in keys:
            removed += int(self.strings.pop(key, None) is not None)
            removed += int(self.zsets.pop(key, None) is not None)
        return removed

    async def zadd(self, key, mapping):
        self.zsets.setdefault(key, {}).update(mapping)
        return len(mapping)

    async def zcard(self, key):
        return len(self.zsets.get(key, {}))

    async def zrem(self, key, *members):
        zset = self.zsets.get(key, {})
        return sum(1 for m in members if zset.pop(m, None) is not None)

    async def zremrangebyscore(self, key, low, high):
        zset = self.zsets.get(key, {})
        low = float("-inf") if low == "-inf" else float(low)
        doomed = [m for m, score in zset.items() if low <= score <= float(high)]
        for m in doomed:
            del zset[m]
        return len(doomed)

    def _ordered(self, key, reverse):
        return [m for m, _ in sorted(self.zsets.get(key, {}).items(), key=lambda kv: kv[1], reverse=reverse)]

    async def zrange(self, key, start, stop):
        items = self._ordered(key, reverse=False)
        return items[start:] if stop == -1 else items[start : stop + 1]

    async def zrevrange(self, key, start, stop):
        items = self._ordered(key, reverse=True)
        return items[start:] if stop == -1 else items[start : stop + 1]

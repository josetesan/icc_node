import redis
r = redis.StrictRedis(host='localhost', port= 6379, db=0)
f = open('taclist.txt')
for line in iter(f):
    r.sadd('taclist',line.strip())
f.close()
print "Insertados " % r.scard('taclist')
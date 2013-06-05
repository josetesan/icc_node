import redis
import csv
import sys
csvfile = open(sys.argv[1],'r')
reader = csv.DictReader(csvfile,delimiter=',')
r = redis.StrictRedis(host='localhost', port=6379, db=0)
for row in reader:
    r.set('customer:%s' % row['msisdn'], 'balance:%s' % '20000')
csvfile.close()
